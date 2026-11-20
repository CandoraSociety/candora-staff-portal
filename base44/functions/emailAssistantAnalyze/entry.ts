import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  buildTranscript,
  ANALYSIS_PROMPT,
  ANALYSIS_SCHEMA,
  insightDrafts,
  summaryDraft,
} from '../../shared/emailAssistant.ts';

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

    const ids = Array.isArray(body.message_ids) ? body.message_ids.filter(Boolean).slice(0, 25) : [];
    const query = ids.length
      ? { owner_email: user.email, id: { $in: ids } }
      : { owner_email: user.email };
    const page = await base44.entities.EmailMessage.filter(query, {
      sort: ids.length ? 'received_at' : '-received_at',
      limit: ids.length ? 25 : 40,
    });
    const messages = (page.items || []).filter((m) => m.body_text || m.subject);
    if (!messages.length) {
      return Response.json(
        { error: 'There is no correspondence to analyze yet. Load the sample conversation or add an email first.' },
        { status: 400 }
      );
    }

    // Each conversation is read on its own, so an email about one thing is never
    // folded into another. A run covers the most recent conversations only.
    const byThread = new Map();
    for (const m of messages) {
      const key = m.thread_id || m.id;
      if (!byThread.has(key)) byThread.set(key, []);
      byThread.get(key).push(m);
    }
    const newest = (group) =>
      group.reduce((latest, m) => (String(m.received_at || '') > latest ? String(m.received_at || '') : latest), '');
    const groups = Array.from(byThread.values())
      .sort((a, b) => newest(b).localeCompare(newest(a)))
      .slice(0, 8);

    const results = await Promise.allSettled(
      groups.map(async (group) => {
        const subject = group[0]?.thread_subject || group[0]?.subject || 'Conversation';
        const prompt = `${ANALYSIS_PROMPT}This is one conversation: "${subject}" (${group.length} message${
          group.length > 1 ? 's' : ''
        }). Every finding must come from this conversation alone.\n\n${buildTranscript(group)}`;
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: ANALYSIS_SCHEMA,
        });
        return { analysis, group };
      })
    );

    const done = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    if (!done.length) {
      const failure = results.find((r) => r.status === 'rejected');
      throw new Error(failure?.reason?.message || 'The analysis could not be completed.');
    }

    const seen = new Set();
    const insights = [];
    const summaries = [];
    done.forEach(({ analysis, group }) => {
      insightDrafts(analysis, group).forEach((draft) => {
        if (draft.dedupe_key && seen.has(draft.dedupe_key)) return;
        if (draft.dedupe_key) seen.add(draft.dedupe_key);
        insights.push(draft);
      });
      summaries.push(summaryDraft(analysis, group));
    });

    return Response.json({
      insights,
      summaries,
      summary: summaries[0],
      message_count: messages.length,
      thread_count: groups.length,
      is_demo: messages.every((m) => m.is_demo),
    });
  } catch (error) {
    console.log('emailAssistantAnalyze failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}