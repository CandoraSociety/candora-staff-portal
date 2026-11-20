// Shared rules for the AI Email Assistant: how correspondence is handed to the
// model, what shape the answer must take, and how findings become suggestions.
// Imported by the analysis, chat and drafting functions so the wording and the
// privacy rules live in one place.

export type EmailRow = {
  id: string;
  owner_email?: string;
  thread_id?: string;
  thread_subject?: string;
  subject?: string;
  from_name?: string;
  from_email?: string;
  recipients?: string;
  direction?: string;
  received_at?: string;
  body_text?: string;
  attachments?: { name?: string; summary?: string }[];
  is_demo?: boolean;
};

// Keeps each message readable for the model without shipping the whole mailbox.
export function buildTranscript(messages: EmailRow[], maxChars = 24000): string {
  const sorted = messages.slice().sort((a, b) => String(b.received_at || '').localeCompare(String(a.received_at || '')));
  const parts = [];
  let budget = maxChars - 200;
  let limited = false;
  const allowance = Math.min(10000, Math.max(900, Math.floor(maxChars / Math.min(sorted.length || 1, 8)) - 500));
  for (const m of sorted) {
    const header = `[message ${m.id}]\nDate: ${m.received_at || 'unknown'}\nSubject: ${m.subject || m.thread_subject || '(no subject)'}\nFrom: ${m.direction === 'outbound' ? 'EMPLOYEE' : m.from_name || 'sender'} <${m.from_email || ''}>\nRecipients: ${m.recipients || 'unknown'}\n`;
    // Tracking URLs and invisible preheaders must not crowd out the conversation.
    const body = String(m.body_text || '').replace(/https?:\/\/[^\s<>]+/g, '[link]').replace(/[\u034f\u200b-\u200f\ufeff]/g, '').replace(/[ \t]+/g, ' ').trim();
    const room = Math.min(allowance, budget - header.length - 160);
    if (room < 200) { limited = true; break; }
    const shortened = body.length > room;
    const attachments = (m.attachments || []).map((a) => a.name || 'attachment').join(', ');
    const part = `${header}Body:\n${body.slice(0, room)}${shortened ? '\n[body excerpt; later text omitted]' : ''}${attachments ? `\nAttachments named (contents not read): ${attachments.slice(0, 120)}` : ''}`;
    parts.unshift(part);
    budget -= part.length + 8;
    limited ||= shortened;
  }
  return `${limited ? '[Context limited: newest messages prioritized; do not assume omitted replies or text.]\n\n' : ''}${parts.join('\n\n---\n\n')}`;
}

export const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    summary_short: { type: 'string' },
    summary_detailed: { type: 'string' },
    confirmed_facts: { type: 'array', items: { type: 'string' } },
    interpretations: { type: 'array', items: { type: 'string' } },
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          status: { type: 'string', description: 'decided or still open' },
        },
        required: ['text'],
      },
    },
    open_questions: { type: 'array', items: { type: 'string' } },
    commitments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          by: { type: 'string' },
          what: { type: 'string' },
          due_date: { type: 'string' },
          certainty: { type: 'string' },
        },
        required: ['what'],
      },
    },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          due_date: { type: 'string' },
          responsible: { type: 'string' },
          priority: { type: 'string' },
          confidence: { type: 'string' },
          category: { type: 'string' },
          message_id: { type: 'string' },
        },
        required: ['title'],
      },
    },
    follow_ups: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          what: { type: 'string' },
          waiting_on: { type: 'string' },
          direction: { type: 'string', description: 'waiting_for_them or owed_by_employee' },
          due_date: { type: 'string' },
          confidence: { type: 'string' },
          message_id: { type: 'string' },
        },
        required: ['what'],
      },
    },
    calendar_events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          date: { type: 'string' },
          time: { type: 'string' },
          location: { type: 'string' },
          format: { type: 'string' },
          participants: { type: 'string' },
          certainty: { type: 'string', description: 'confirmed, proposed or reference_only' },
          message_id: { type: 'string' },
        },
        required: ['title'],
      },
    },
    knowledge: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          topic: { type: 'string' },
          detail: { type: 'string' },
          suggested_home: { type: 'string' },
          message_id: { type: 'string' },
        },
        required: ['topic', 'detail'],
      },
    },
  },
  required: ['summary_short', 'summary_detailed'],
};

export const ANALYSIS_PROMPT = `You are the email analysis engine inside Candora 360, a staff portal for a Canadian community service organization.

Read the correspondence below and report what it actually says. You are helping an employee understand their own inbox — never a manager or anyone else.

Rules that matter more than completeness:
- Report only what the text supports. If a date, owner or priority is not stated or clearly implied, leave that field empty rather than guessing.
- Distinguish explicit instructions ("please send the report by Friday") from implied requests ("it would help to have the report soon"), tentative discussion ("we could meet Tuesday"), and confirmed commitments ("I'll send it Monday"). Reflect that in the certainty and confidence fields.
- Do not treat every unanswered message as requiring a reply. Consider whether the thread reads as concluded, whether the employee's answer is genuinely expected, and whether a later message already resolved it.
- Put things stated plainly in confirmed_facts. Put your own reading of tone, intent or priority in interpretations, never in confirmed_facts.
- Never invent policies, program details, funder requirements, names, amounts or deadlines.
- When you are unsure, say so in the text and mark certainty "unclear" and confidence "low".
- Keep summaries readable by a busy non-technical colleague. summary_short is two or three sentences; summary_detailed is one to three short paragraphs.
- For each finding, set message_id to the [message ...] id it came from when you can tell.
- Every finding must come from a single message of this one conversation. Never merge two separate emails or two different conversations into one finding: if two emails each ask for something, report two separate findings.
- Write each finding as the concrete next step the employee would take, in their own voice ("Send the signed lease to Kim"), not as a topic.
- calendar_events is only for something the employee is expected to attend, host or act on, where the correspondence states a date or time for it. A congratulations, a nomination, an award, a selection, or a passing courtesy line such as "enjoy the gala tonight" is not an event to plan — leave it out entirely rather than turning it into a calendar entry.
- Never invent an event name, date, time, location or format. Do not turn a relative word ("tonight", "next week") into a date, and do not add words the email does not use. Leave any field empty that the email does not state.
- If a mention is only background (someone else's evening, a past event, an honor), it belongs nowhere: not in tasks, not in calendar_events. At most it can be a knowledge item.
- suggested_home is only for knowledge items: name a place inside Candora 360 such as Grants, Program records, Finance, Marketing, Website Studio, Board, or leave it empty.

Correspondence:

`;

// A stable key so the same action found in two messages is only suggested once.
export function dedupeKey(kind: string, title: string): string {
  const slug = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .slice(0, 80);
  return `${kind}:${slug}`;
}

function isoDate(value?: string): string {
  if (!value) return '';
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(text)) return '';
  return text.slice(0, 10);
}

function certaintyOf(value?: string, fallback = 'unclear'): string {
  const v = String(value || '').toLowerCase();
  if (v.includes('confirm')) return 'confirmed';
  if (v.includes('propos') || v.includes('tentative')) return 'proposed';
  if (v) return 'unclear';
  return fallback;
}

function confidenceOf(value?: string): string {
  const v = String(value || '').toLowerCase();
  if (v === 'high' || v === 'medium' || v === 'low') return v;
  return 'medium';
}

function priorityOf(value?: string): string {
  const v = String(value || '').toLowerCase();
  if (v === 'high' || v === 'urgent' || v === 'critical') return 'high';
  if (v === 'low') return 'low';
  return 'medium';
}

// Turns the model's answer into the suggestion rows the employee reviews.
export function insightDrafts(analysis: any, messages: EmailRow[]) {
  const byId = new Map(messages.map((m) => [m.id, m]));
  const subjectFor = (messageId?: string) => {
    const msg = messageId ? byId.get(messageId) : undefined;
    return msg ? msg.thread_subject || msg.subject || '' : messages[0]?.thread_subject || messages[0]?.subject || '';
  };
  const threadFor = (messageId?: string) => (messageId ? byId.get(messageId)?.thread_id || '' : messages[0]?.thread_id || '');
  const sourceFor = (messageId?: string) =>
    messageId && byId.has(messageId) ? [messageId] : messages.map((m) => m.id).slice(0, 6);

  const rows: any[] = [];

  (analysis.tasks || []).forEach((t: any) => {
    if (!t?.title) return;
    rows.push({
      kind: 'task',
      title: t.title,
      detail: t.description || '',
      certainty: certaintyOf(t.certainty, 'proposed'),
      confidence: confidenceOf(t.confidence),
      priority: priorityOf(t.priority),
      due_date: isoDate(t.due_date),
      responsible_name: t.responsible || '',
      category: t.category || '',
      source_message_ids: sourceFor(t.message_id),
      source_subject: subjectFor(t.message_id),
      source_thread_id: threadFor(t.message_id),
      dedupe_key: dedupeKey('task', t.title),
    });
  });

  (analysis.follow_ups || []).forEach((f: any) => {
    if (!f?.what) return;
    rows.push({
      kind: 'follow_up',
      title: f.what,
      detail:
        f.direction === 'owed_by_employee'
          ? `Someone may be waiting on you${f.waiting_on ? ` (${f.waiting_on})` : ''}.`
          : `You may be waiting on ${f.waiting_on || 'someone'} to come back to you.`,
      certainty: certaintyOf(f.certainty, 'proposed'),
      confidence: confidenceOf(f.confidence),
      priority: 'medium',
      due_date: isoDate(f.due_date),
      responsible_name: f.waiting_on || '',
      source_message_ids: sourceFor(f.message_id),
      source_subject: subjectFor(f.message_id),
      source_thread_id: threadFor(f.message_id),
      dedupe_key: dedupeKey('follow_up', f.what),
    });
  });

  (analysis.calendar_events || []).forEach((e: any) => {
    if (!e?.title) return;
    // Only something with a stated date can go in a calendar, and a mention the
    // model itself flagged as reference only is not an event to plan.
    if (!isoDate(e.date)) return;
    if (String(e.certainty || '').toLowerCase().includes('reference')) return;
    const when = [isoDate(e.date), e.time].filter(Boolean).join(' ');
    rows.push({
      kind: 'calendar',
      title: e.title,
      detail: [when ? `When mentioned: ${when}` : '', e.location ? `Where: ${e.location}` : '', e.format ? `Format: ${e.format}` : '', e.participants ? `People: ${e.participants}` : '']
        .filter(Boolean)
        .join(' · '),
      certainty: certaintyOf(e.certainty),
      confidence: certaintyOf(e.certainty) === 'confirmed' ? 'high' : 'medium',
      priority: 'medium',
      due_date: isoDate(e.date),
      responsible_name: '',
      source_message_ids: sourceFor(e.message_id),
      source_subject: subjectFor(e.message_id),
      source_thread_id: threadFor(e.message_id),
      dedupe_key: dedupeKey('calendar', e.title),
    });
  });

  (analysis.decisions || []).forEach((d: any) => {
    if (!d?.text) return;
    rows.push({
      kind: 'decision',
      title: d.text.slice(0, 120),
      detail: d.text,
      certainty: String(d.status || '').toLowerCase().includes('open') ? 'unclear' : 'confirmed',
      confidence: 'medium',
      priority: 'medium',
      source_message_ids: sourceFor(),
      source_subject: subjectFor(),
      source_thread_id: threadFor(),
      dedupe_key: dedupeKey('decision', d.text),
    });
  });

  (analysis.open_questions || []).forEach((q: string) => {
    if (!q) return;
    rows.push({
      kind: 'question',
      title: q.slice(0, 120),
      detail: q,
      certainty: 'unclear',
      confidence: 'medium',
      priority: 'medium',
      source_message_ids: sourceFor(),
      source_subject: subjectFor(),
      source_thread_id: threadFor(),
      dedupe_key: dedupeKey('question', q),
    });
  });

  (analysis.commitments || []).forEach((c: any) => {
    if (!c?.what) return;
    rows.push({
      kind: 'commitment',
      title: c.what.slice(0, 120),
      detail: [c.by ? `By: ${c.by}` : '', c.what].filter(Boolean).join(' — '),
      certainty: certaintyOf(c.certainty, 'confirmed'),
      confidence: 'medium',
      priority: 'medium',
      due_date: isoDate(c.due_date),
      responsible_name: c.by || '',
      source_message_ids: sourceFor(),
      source_subject: subjectFor(),
      source_thread_id: threadFor(),
      dedupe_key: dedupeKey('commitment', c.what),
    });
  });

  (analysis.knowledge || []).forEach((k: any) => {
    if (!k?.topic) return;
    rows.push({
      kind: 'knowledge',
      title: k.topic.slice(0, 120),
      detail: k.detail,
      certainty: 'confirmed',
      confidence: 'medium',
      priority: 'low',
      suggested_home: k.suggested_home || '',
      source_message_ids: sourceFor(k.message_id),
      source_subject: subjectFor(k.message_id),
      source_thread_id: threadFor(k.message_id),
      dedupe_key: dedupeKey('knowledge', k.topic),
    });
  });

  return rows;
}

// The conversation summary is kept as its own suggestion row so it can be
// reopened later, always next to the messages it came from.
export function summaryDraft(analysis: any, messages: EmailRow[]) {
  const subject = messages[0]?.thread_subject || messages[0]?.subject || 'Conversation';
  const sections = [
    analysis.summary_detailed || analysis.summary_short || '',
    (analysis.confirmed_facts || []).length
      ? `\n\nConfirmed in the correspondence:\n${(analysis.confirmed_facts || []).map((f: string) => `• ${f}`).join('\n')}`
      : '',
    (analysis.interpretations || []).length
      ? `\n\nAI interpretation (not stated outright):\n${(analysis.interpretations || []).map((f: string) => `• ${f}`).join('\n')}`
      : '',
    (analysis.open_questions || []).length
      ? `\n\nStill open:\n${(analysis.open_questions || []).map((f: string) => `• ${f}`).join('\n')}`
      : '',
  ].join('');

  return {
    kind: 'summary',
    title: `Summary — ${subject}`,
    detail: sections.trim(),
    certainty: 'confirmed',
    confidence: 'high',
    priority: 'low',
    source_message_ids: messages.map((m) => m.id),
    source_subject: subject,
    source_thread_id: messages[0]?.thread_id || '',
    dedupe_key: `summary:${messages[0]?.thread_id || dedupeKey('summary', subject)}`,
  };
}

export const TONE_LABELS: Record<string, string> = {
  warm_professional: 'warm and professional',
  formal: 'formal',
  concise: 'short and to the point',
  friendly: 'friendly and approachable',
  direct: 'direct and businesslike',
};