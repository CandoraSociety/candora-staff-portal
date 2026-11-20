import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Answers a staff member's questions about their own correspondence.
// Everything is read with the user's token (row-level security keeps it to
// their own messages) and the model is told to answer only from that material.

const ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    used_message_ids: { type: 'array', items: { type: 'string' } },
    limitation: { type: 'string' },
  },
  required: ['answer'],
};

const PROMPT = `You are the AI Email Assistant inside Candora 360, answering one employee's questions about their own email.

You will be given a set of messages and open suggestions. Follow these rules:
- Answer only from the material provided. If the answer is not there, say plainly that you cannot see it in the available correspondence and, when useful, suggest what to look for. Never fill a gap with a guess.
- Always name the messages you relied on by putting their ids in used_message_ids.
- Be brief and concrete. Two or three sentences usually, or a short list when the question asks for several items.
- Distinguish what is stated from what you infer: say "the email says" versus "it looks as though".
- Do not reveal anything beyond this employee's own correspondence.
- If the question is about something you cannot do (sending email, opening a calendar), say what you can do instead.
- Put anything the employee should know about missing or incomplete information in limitation; otherwise leave it empty.

Messages:

`;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const question = String(body.question || '').trim();
    if (!question) return Response.json({ error: 'Ask a question first.' }, { status: 400 });

    const [messagePage, insightPage] = await Promise.all([
      base44.entities.EmailMessage.filter({ owner_email: user.email }, { sort: '-received_at', limit: 60 }),
      base44.entities.EmailInsight.filter(
        { owner_email: user.email, status: { $in: ['suggested', 'approved', 'snoozed'] } },
        { sort: '-created_date', limit: 60 }
      ),
    ]);

    const messages = (messagePage.items || []).filter((m) => m.body_text || m.subject);
    if (!messages.length) {
      return Response.json({
        answer:
          'There is no correspondence available to me yet, so I cannot answer that. Load the sample conversation or add an email, then ask again.',
        references: [],
        limitation: 'No email is available to the assistant yet.',
      });
    }

    const context = messages
      .map(
        (m) =>
          `[message ${m.id}] ${m.received_at || ''} · ${m.direction === 'outbound' ? 'SENT BY EMPLOYEE' : `FROM ${m.from_name || m.from_email || 'sender'}`} · Subject: ${m.subject || m.thread_subject || '(none)'}\n${String(m.body_text || '').slice(0, 1200)}`
      )
      .join('\n\n---\n\n');

    const suggestions = (insightPage.items || [])
      .map((i) => `- ${i.kind}: ${i.title}${i.due_date ? ` (due ${i.due_date})` : ''} [${i.status}]`)
      .join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${PROMPT}${context.slice(0, 16000)}\n\nOpen suggestions on record:\n${suggestions || '(none)'}\n\nEmployee's question: ${question}`,
      response_json_schema: ANSWER_SCHEMA,
    });

    const byId = new Map(messages.map((m) => [m.id, m]));
    const references = (result.used_message_ids || [])
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((m) => ({
        message_id: m.id,
        subject: m.subject || m.thread_subject || '(no subject)',
        from: m.direction === 'outbound' ? 'You' : m.from_name || m.from_email || '',
        date: m.received_at || '',
      }));

    return Response.json({
      answer: result.answer || '',
      references,
      limitation: result.limitation || '',
    });
  } catch (error) {
    console.log('emailAssistantChat failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}