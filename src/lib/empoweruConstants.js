export const COHORT_STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning', color: '#64748b' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'completed', label: 'Completed', color: '#8b5cf6' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
];
export const COHORT_STATUS_LABELS = Object.fromEntries(COHORT_STATUS_OPTIONS.map(s => [s.value, s.label]));
export const COHORT_STATUS_COLORS = Object.fromEntries(COHORT_STATUS_OPTIONS.map(s => [s.value, s.color]));

export const DELIVERY_MODE_OPTIONS = [
  { value: 'in_person', label: 'In Person' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'hybrid', label: 'Hybrid' },
];
export const DELIVERY_MODE_LABELS = Object.fromEntries(DELIVERY_MODE_OPTIONS.map(d => [d.value, d.label]));

export const REGISTRATION_STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered', color: '#3b82f6' },
  { value: 'waitlisted', label: 'Waitlisted', color: '#f59e0b' },
  { value: 'enrolled', label: 'Enrolled', color: '#22c55e' },
  { value: 'withdrawn', label: 'Withdrawn', color: '#ef4444' },
  { value: 'completed', label: 'Completed', color: '#8b5cf6' },
  { value: 'declined', label: 'Declined', color: '#64748b' },
];
export const REGISTRATION_STATUS_LABELS = Object.fromEntries(REGISTRATION_STATUS_OPTIONS.map(s => [s.value, s.label]));

export const ACCOUNT_SETUP_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: '#64748b' },
  { value: 'contacting', label: 'Contacting', color: '#f59e0b' },
  { value: 'appointment_scheduled', label: 'Appt Scheduled', color: '#3b82f6' },
  { value: 'forms_sent', label: 'Forms Sent', color: '#a855f7' },
  { value: 'forms_completed', label: 'Forms Done', color: '#6366f1' },
  { value: 'account_opened', label: 'Account Opened', color: '#22c55e' },
  { value: 'completed', label: 'Completed', color: '#15803d' },
  { value: 'participant_unresponsive', label: 'Unresponsive', color: '#ef4444' },
  { value: 'declined', label: 'Declined', color: '#dc2626' },
];
export const ACCOUNT_SETUP_STATUS_LABELS = Object.fromEntries(ACCOUNT_SETUP_STATUS_OPTIONS.map(s => [s.value, s.label]));

export const SERVICE_TYPE_OPTIONS = [
  { value: 'information_referral', label: 'Information & Referral' },
  { value: 'advocacy', label: 'Advocacy' },
  { value: 'navigation', label: 'System Navigation' },
  { value: 'practical_support', label: 'Practical Support' },
  { value: 'crisis_support', label: 'Crisis Support' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'other', label: 'Other' },
];
export const SERVICE_TYPE_LABELS = Object.fromEntries(SERVICE_TYPE_OPTIONS.map(s => [s.value, s.label]));

export const DEFAULT_SAVINGS_AMOUNT = 300;

// Main happy-path pipeline for ATB account setup — drives the progress flow on the Account Setup tab
export const ACCOUNT_SETUP_PIPELINE = ['not_started', 'contacting', 'appointment_scheduled', 'forms_sent', 'forms_completed', 'account_opened', 'completed'];
export const nextAccountSetupStatus = (status) => {
  const i = ACCOUNT_SETUP_PIPELINE.indexOf(status);
  return i >= 0 && i < ACCOUNT_SETUP_PIPELINE.length - 1 ? ACCOUNT_SETUP_PIPELINE[i + 1] : null;
};
// Statuses that mark a milestone — the matching date auto-fills when set
export const ACCOUNT_SETUP_STATUS_DATE_FIELDS = { forms_sent: 'forms_sent_date', forms_completed: 'forms_completed_date', account_opened: 'account_opened_date', completed: 'account_opened_date', appointment_scheduled: 'appointment_date' };
// Contact methods available when logging an account-setup contact attempt
export const ACCOUNT_SETUP_CONTACT_METHODS = ['Phone Call', 'Email', 'Text Message', 'In Person', 'Other'];