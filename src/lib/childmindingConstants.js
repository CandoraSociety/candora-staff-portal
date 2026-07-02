export const PROGRAM_OPTIONS = [
  { value: 'pathways', label: 'Pathways', color: '#3b82f6', billable: true, rate: 20 },
  { value: 'ell', label: 'ELL (English Language Learning)', color: '#8b5cf6', billable: false, rate: 0 },
  { value: 'other', label: 'Other', color: '#64748b', billable: false, rate: 0 },
];
export const PROGRAM_LABELS = Object.fromEntries(PROGRAM_OPTIONS.map(p => [p.value, p.label]));
export const PROGRAM_COLORS = Object.fromEntries(PROGRAM_OPTIONS.map(p => [p.value, p.color]));
export const PROGRAM_RATES = Object.fromEntries(PROGRAM_OPTIONS.map(p => [p.value, p.rate]));
export const PROGRAM_BILLABLE = Object.fromEntries(PROGRAM_OPTIONS.map(p => [p.value, p.billable]));

export const BILLING_STATUS_OPTIONS = [
  { value: 'unbilled', label: 'Unbilled', color: '#f59e0b' },
  { value: 'billed', label: 'Billed', color: '#3b82f6' },
  { value: 'paid', label: 'Paid', color: '#22c55e' },
  { value: 'n/a', label: 'N/A', color: '#64748b' },
];
export const BILLING_STATUS_LABELS = Object.fromEntries(BILLING_STATUS_OPTIONS.map(s => [s.value, s.label]));

export const RATE_PER_HOUR = 20; // $20/child/hour for Pathways

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function calculateBilling(program, hours) {
  if (PROGRAM_BILLABLE[program]) {
    return (hours || 0) * PROGRAM_RATES[program];
  }
  return 0;
}

export function getProgramLabel(record) {
  if (record.program === 'other' && record.program_other) return record.program_other;
  return PROGRAM_LABELS[record.program] || record.program || '';
}