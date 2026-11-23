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

// The last text the desk sent this family, so the card can say it went out.
export const lastTextSent = (texts, phone) => {
  const sent = textsForPhone(texts, phone).filter(t => t.direction === 'out');
  return sent[sent.length - 1] || null;
};