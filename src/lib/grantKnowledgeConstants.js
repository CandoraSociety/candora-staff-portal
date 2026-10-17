export const ENTRY_TYPES = [
  { value: 'note', label: 'Note / Info' },
  { value: 'document', label: 'Document Summary' },
  { value: 'conversation', label: 'AI Conversation' },
  { value: 'grant_record', label: 'Grant Record' },
];

export const TYPE_LABELS = {
  note: 'Note',
  document: 'Document',
  conversation: 'Conversation',
  grant_record: 'Grant Record',
};

export const TYPE_BADGES = {
  note: 'bg-slate-100 text-slate-700',
  document: 'bg-blue-100 text-blue-700',
  conversation: 'bg-purple-100 text-purple-700',
  grant_record: 'bg-emerald-100 text-emerald-700',
};