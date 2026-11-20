import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { TONE_LABELS } from '../../shared/emailAssistant.ts';

// Writes an editable email draft for the signed-in employee. It never sends
// anything: the text comes back to the app, where the employee owns every word.

const DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    subject: { type: 'string' },
    body: { type: 'string' },
    notes: { type: 'string' },
  },
  required: ['body'],
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'reply';
    const tone = TONE_LABELS[body.tone] || TONE_LABELS.warm_professional;
    const length = body.length === 'short' ? 'short' : body.length === 'detailed' ? 'thorough' : 'normal';

    let source = '';
    if (body.message_id) {
      const message = await base44.entities.EmailMessage
        .get(body.message_id)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!message) return Response.json({ error: 'That message could not be found.' }, { status: 404 });
      if (message.owner_email && message.owner_email !== user.email) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      source = [
        `Subject: ${message.subject || message.thread_subject || ''}`,
        `From: ${message.from_name || ''} <${message.from_email || ''}>`,
        `To: ${message.recipients || ''}`,
        `Sent: ${message.received_at || ''}`,
        `Body:\n${message.body_text || ''}`,
      ].join('\n');
    }

    const task = {
      reply: 'Write a reply to the message below. Answer every question it asks, in the order that makes sense.',
      new: 'Write a new message from the employee, following the instruction given.',
      rewrite: 'Rewrite the employee\'s draft so it is clearer and more professional while keeping every fact and request intact.',
      follow_up: 'Write a short, courteous follow-up message chasing the matter below.',
    }[mode] || 'Write a reply.';

    const prompt = `You are the drafting assistant inside Candora 360, a staff portal for a community service organization in Edmonton, Canada.

${task}

Writing rules:
- The message is written by the employee, ${user.full_name || 'a staff member'}, of Candora. Sign off with their first name only.
- Tone: ${tone}. Length: ${length}.
- Use only the facts given below. Never invent a policy, a program detail, a date, a dollar amount, a name or a commitment. Where a real detail is needed but missing, write a clear placeholder in square brackets, e.g. [confirm date] or [attach report], and mention it in notes.
- Keep it plain and human. No corporate padding, no em dashes, no bullet-point walls unless the sender asked several questions.
- If the original message asks several things, make sure each one is addressed.
- Do not claim anything has already been sent, booked or paid unless the material says so.
- Put anything the employee should check before sending in notes.

${source ? `Original message:\n${source}\n\n` : ''}${body.draft_text ? `Employee's draft to work from:\n${body.draft_text}\n\n` : ''}${body.intent ? `What the employee wants to say: ${body.intent}` : ''}`;

    const draft = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: DRAFT_SCHEMA,
    });

    return Response.json({ subject: draft.subject || '', body: draft.body || '', notes: draft.notes || '' });
  } catch (error) {
    console.log('emailAssistantDraft failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}