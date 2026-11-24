// Text messages exchanged with Kids Gift Shop families. Every message is stored
// against the family's number, so a reply shows on that family's card.

// (587) 714-2554, 587-714-2554 and 5877142554 all become +15877142554.
export const normalizeSmsPhone = (raw) => {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
};

// Every text the Kids Gift Shop sends opens with the guardian's name.
export const greetText = (name, body) => {
  const message = String(body || '').trim();
  if (!message) return message;
  if (/^hi\b/i.test(message)) return message;
  const first = String(name || '').trim().split(/\s+/)[0];
  return `Hi ${first || 'there'},\n\n${message}`;
};

// Every message with the family, oldest first.
export const textsForPhone = (texts, phone) => {
  const key = normalizeSmsPhone(phone);
  if (!key) return [];
  return (texts || [])
    .filter(t => t.phone === key)
    .sort((a, b) => (a.sent_at || '').localeCompare(b.sent_at || ''));
};

// Replies the desk has not opened yet.
export const unreadReplies = (texts, phone) =>
  textsForPhone(texts, phone).filter(t => t.direction === 'in' && !t.read_at);

// The family's most recent reply, read or not, so it stays on their card after
// the desk has opened it.
export const lastReply = (texts, phone) => {
  const replies = textsForPhone(texts, phone).filter(t => t.direction === 'in');
  return replies[replies.length - 1] || null;
};

// The last "come to the desk" text the desk sent this family, so the card can
// say it went out. Replies typed in the thread are not come-up texts.
export const lastComeUpSent = (texts, phone) => {
  const sent = textsForPhone(texts, phone)
    .filter(t => t.direction === 'out' && /please bring/i.test(t.body || ''));
  return sent[sent.length - 1] || null;
};