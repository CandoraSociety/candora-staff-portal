// Light ELL waitlist tracking — the same contact-state pattern used on the
// EmpowerU waitlist, adapted to ELL (CLB assessment instead of application form).
export const ELL_WAITLIST_STATUS_OPTIONS = [
  { value: 'waiting', label: 'Waiting', color: '#94a3b8' },
  { value: 'contacted', label: 'Contacted', color: '#3b82f6' },
  { value: 'assessment_booked', label: 'Assessment booked', color: '#10b981' },
  { value: 'not_interested', label: 'Not interested', color: '#ef4444' },
  { value: 'next_term', label: 'Next term', color: '#8b5cf6' },
];
export const ELL_WAITLIST_STATUS_LABELS = Object.fromEntries(ELL_WAITLIST_STATUS_OPTIONS.map((s) => [s.value, s.label]));
export const ELL_CLB_LABELS = Object.fromEntries(
  ['not_assessed', ...[...Array(12)].map((_, i) => `clb_${i + 1}`)].map((v) => [v, v === 'not_assessed' ? 'Not assessed' : v.replace('clb_', 'CLB ')])
);