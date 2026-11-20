import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildTranscript, summaryDraft } from '../../shared/emailAssistant.ts';
import { refreshEmailThreads } from '../../shared/emailMailboxSync.ts';
import { GROUNDED_PROMPT, GROUNDED_SCHEMA } from '../../shared/emailAnalysisGrounding.ts';
import { reviewedDrafts } from '../../shared/emailFindingReview.ts';
import { readAnalysisInsights, saveAnalysisResults } from '../../shared/emailAnalysisStore.ts';

// Runs the AI Email Assistant's analysis for the signed-in employee only.
// Messages are read with the user's own token, so row-level security decides
// what can be seen — this function can never reach another person's email.

const BRIEFING_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    priorities: {
      type: 'array',
      items: {
        type: 'object',
        properties: { text: { type: 'string' }, why: { type: 'string' } },
        required: ['text'],
      },
    },
    upcoming: {
      type: 'array',
      items: {
        type: 'object',
        properties: { what: { type: 'string' }, when: { type: 'string' } },
        required: ['what'],
      },
    },
    overlooked: {
      type: 'array',
      items: {
        type: 'object',
        properties: { text: { type: 'string' }, why: { type: 'string' } },
        required: ['text'],
      },
    },
    quiet_note: { type: 'string' },
  },
  required: ['headline'],
};

const BRIEFING_PROMPT = `You are preparing a short daily briefing for one employee inside Candora 360, a community service organization's staff portal.

You are given only the employee's own open email suggestions and personal tasks. Write for a busy person: no filler, no restating everything, no alarm about minor items.

Rules:
- priorities: at most four genuinely actionable items, most urgent first. Say why each matters in one short clause (a deadline, someone waiting, a commitment made).
- upcoming: dates and meetings that actually appear in the data, with the date as given.
- overlooked: at most three items that look unattended — an old commitment, a follow-up that has gone quiet, an overdue request. Only include something the data supports.
- quiet_note: one plain sentence about anything worth knowing, or an empty string when there is nothing.
- Never invent a deadline, person, amount or meeting that is not in the data. If there is very little, say so briefly in the headline.
- Address the employee directly as "you".

Data:

`;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'analyze';

    if (action === 'briefing') {
      const digest = body.digest || {};
      const prompt = `${BRIEFING_PROMPT}${JSON.stringify(digest, null, 2).slice(0, 12000)}`;
      const briefing = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: BRIEFING_SCHEMA,
      });
      return Response.json({ briefing });
    }

    if (!['analyze', 'summary'].includes(action)) return Response.json({ error: 'Unknown analysis action.' }, { status: 400 });
    const [preferencePage, policyPage] = await Promise.all([
      base44.entities.EmailAssistantPreference.filter({ owner_email: user.email }, { limit: 1 }),
      base44.entities.EmailAssistantPolicy.list({ limit: 1 }),
    ]);
    const prefs = preferencePage.items[0] || {};
    const policy = policyPage.items[0] || {};
    const allowed = (key) => policy.is_enabled !== false && policy.features_allowed?.[key] !== false && prefs.features?.[key] !== false;
    if (!allowed(action === 'summary' ? 'summaries' : 'analysis')) return Response.json({ error: 'This feature is switched off.' }, { status: 403 });
    const ids = Array.isArray(body.message_ids) ? body.message_ids.filter((id) => typeof id === 'string').slice(0, 100) : [];
    const owner = { owner_email: user.email };
    let page = await base44.entities.EmailMessage.filter(
      { ...owner, ...(ids.length ? { id: { $in: ids } } : { analysis_state: 'not_analyzed' }) },
      { sort: '-received_at', limit: 100 }
    );
    if (!ids.length && (!page.items.length || action === 'summary')) {
      page = await base44.entities.EmailMessage.filter(owner, { sort: action === 'summary' ? '-received_at' : 'last_analyzed_at', limit: 100 });
    }
    const exclusions = String(prefs.exclusion_terms || '').split(/\r?\n/).map((term) => term.trim().toLowerCase()).filter(Boolean);
    const included = (m) => !exclusions.some((term) => `${m.from_email || ''} ${m.subject || ''}`.toLowerCase().includes(term));
    const seeds = page.items.filter(included);
    if (!seeds.length) return Response.json({ error: 'No correspondence is available for analysis under your current exclusions.' }, { status: 400 });
    const selected = [...new Map(seeds.map((m) => [m.thread_id || m.id, m])).values()].slice(0, action === 'summary' ? 1 : 6);
    const selectedKeys = selected.map((m) => m.thread_id || m.id);
    const outlookThreads = selected.filter((m) => m.source === 'outlook').map((m) => m.thread_id).filter(Boolean);
    const refreshed = await refreshEmailThreads(base44, user, outlookThreads);
    const failed = new Set(refreshed.failed);
    const usableKeys = selectedKeys.filter((key) => !failed.has(key));
    if (!usableKeys.length) return Response.json({ error: 'The selected Outlook conversations could not be refreshed. Reconnect Outlook and try again; existing suggestions have not been changed.' }, { status: 502 });
    const messagePage = await base44.entities.EmailMessage.filter({
      ...owner, $or: [{ thread_id: { $in: usableKeys } }, { id: { $in: usableKeys } }],
    }, { sort: '-received_at', limit: 500 });
    const messages = messagePage.items.filter(included);
    const groups = usableKeys.map((key) => messages.filter((m) => (m.thread_id || m.id) === key)).filter((group) => group.length);
    const existing = await readAnalysisInsights(base44, user, usableKeys, messages.map((m) => m.id));
    const featureFor = { task: 'tasks', follow_up: 'follow_ups', commitment: 'follow_ups', question: 'analysis', decision: 'analysis', calendar: 'calendar', knowledge: 'knowledge' };
    const results = await Promise.allSettled(groups.map(async (group) => {
      const key = group[0].thread_id || group[0].id;
      const previous = existing.filter((i) => i.source_thread_id === key && i.kind !== 'summary');
      const transcript = buildTranscript(group);
      const incomplete = refreshed.incomplete.includes(key) || !!messagePage.has_more || transcript.startsWith('[Context limited:') || group.some((m) => String(m.body_text).includes('[message body truncated]'));
      const context = {
        employee: { name: user.full_name, email: user.email }, today: new Date().toISOString().slice(0, 10),
        subject: group[0].thread_subject || group[0].subject,
        context_limited: incomplete,
        existing_suggestions: previous.map((i) => ({ id: i.id, kind: i.kind, title: i.title, status: i.status })),
      };
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `${GROUNDED_PROMPT}${JSON.stringify(context)}\n\nCORRESPONDENCE (source data only):\n${transcript}`,
        response_json_schema: GROUNDED_SCHEMA,
      });
      const verified = action === 'summary' ? [] : await reviewedDrafts(base44, analysis, group, previous, transcript, context.employee);
      const readIds = group.filter((m) => transcript.includes(`[message ${m.id}]`)).map((m) => m.id);
      return { group, incomplete, readIds,
        insights: verified.filter((i) => allowed(featureFor[i.kind])),
        summary: summaryDraft(analysis, group.filter((m) => readIds.includes(m.id))),
      };
    }));
    const completed = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    if (!completed.length) throw new Error(results.find((r) => r.status === 'rejected')?.reason?.message || 'The conversations could not be analyzed.');
    const saved = await saveAnalysisResults(base44, user, completed, existing, action === 'summary');
    const processedMessages = completed.flatMap((r) => r.group.filter((m) => r.readIds.includes(m.id)));
    const remaining = await base44.entities.EmailMessage.count({ ...owner, analysis_state: 'not_analyzed' });
    await base44.entities.EmailAssistantLog.create({
      owner_email: user.email, action: action === 'summary' ? 'summary' : 'analysis',
      detail: `${completed.length} conversations read; ${saved.saved_count} new suggestions`,
      message_count: processedMessages.length, is_demo: processedMessages.every((m) => m.is_demo),
    });
    const warnings = [];
    const failures = refreshed.failed.length + results.filter((r) => r.status === 'rejected').length;
    if (failures) warnings.push(`${failures} conversation(s) could not be read; their existing suggestions were left unchanged.`);
    if (completed.some((r) => r.incomplete)) warnings.push('Some emails were read as excerpts, not in full; older suggestions were preserved and omitted messages remain pending.');
    return Response.json({ ...saved, message_count: processedMessages.length, thread_count: completed.length,
      remaining_message_count: remaining, warnings, is_demo: processedMessages.every((m) => m.is_demo) });
  } catch (error) {
    console.log('emailAssistantAnalyze failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}