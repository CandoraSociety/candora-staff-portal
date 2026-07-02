export const FUNDER_CATEGORIES = [
  { value: 'phac_caregiver_capacity', label: 'PHAC Caregiver Capacity (0-6)', color: '#0ea5e9', description: 'Caregiver support for families/parents with children aged 0-6' },
  { value: 'pathways', label: 'Pathways', color: '#8b5cf6', description: 'Pathways Service Navigation' },
  { value: 'frn', label: 'FRN', color: '#22c55e', description: 'Family Resource Network' },
  { value: 'other', label: 'Other', color: '#64748b', description: 'Other funder/source' },
];

export const FUNDER_LABELS = Object.fromEntries(FUNDER_CATEGORIES.map(f => [f.value, f.label]));
export const FUNDER_COLORS = Object.fromEntries(FUNDER_CATEGORIES.map(f => [f.value, f.color]));

export const CASE_STATUS_OPTIONS = [
  { value: 'intake', label: 'Intake', color: '#f59e0b' },
  { value: 'active', label: 'Active', color: '#22c55e' },
  { value: 'monitoring', label: 'Monitoring', color: '#3b82f6' },
  { value: 'waitlisted', label: 'Waitlisted', color: '#a855f7' },
  { value: 'closed', label: 'Closed', color: '#64748b' },
];

export const CASE_STATUS_LABELS = Object.fromEntries(CASE_STATUS_OPTIONS.map(s => [s.value, s.label]));
export const CASE_STATUS_COLORS = Object.fromEntries(CASE_STATUS_OPTIONS.map(s => [s.value, s.color]));

export const SERVICE_TYPE_OPTIONS = [
  { value: 'information_referral', label: 'Information & Referral' },
  { value: 'advocacy', label: 'Advocacy' },
  { value: 'navigation', label: 'System Navigation' },
  { value: 'practical_support', label: 'Practical Support' },
  { value: 'caregiver_support', label: 'Caregiver Support' },
  { value: 'crisis_intervention', label: 'Crisis Intervention' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'other', label: 'Other' },
];

export const SERVICE_TYPE_LABELS = Object.fromEntries(SERVICE_TYPE_OPTIONS.map(s => [s.value, s.label]));

export const REFERRAL_DIRECTION_LABELS = {
  incoming: 'Incoming',
  outgoing: 'Outgoing',
};

export const REFERRAL_SOURCE_LABELS = {
  internal: 'Internal',
  external_partner: 'External Partner',
};

export const REFERRAL_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: '#f59e0b' },
  { value: 'accepted', label: 'Accepted', color: '#22c55e' },
  { value: 'declined', label: 'Declined', color: '#ef4444' },
  { value: 'completed', label: 'Completed', color: '#64748b' },
];

export const REFERRAL_STATUS_LABELS = Object.fromEntries(REFERRAL_STATUS_OPTIONS.map(s => [s.value, s.label]));
export const REFERRAL_STATUS_COLORS = Object.fromEntries(REFERRAL_STATUS_OPTIONS.map(s => [s.value, s.color]));

export const APPOINTMENT_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', color: '#3b82f6' },
  { value: 'completed', label: 'Completed', color: '#22c55e' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  { value: 'no_show', label: 'No Show', color: '#f59e0b' },
];

export const APPOINTMENT_STATUS_LABELS = Object.fromEntries(APPOINTMENT_STATUS_OPTIONS.map(s => [s.value, s.label]));
export const APPOINTMENT_STATUS_COLORS = Object.fromEntries(APPOINTMENT_STATUS_OPTIONS.map(s => [s.value, s.color]));

export const LOCATION_TYPE_LABELS = {
  in_person: 'In Person',
  phone: 'Phone',
  video: 'Video',
};

export const IS_PHAC = (client) => (client?.funder_categories || []).includes('phac_caregiver_capacity');