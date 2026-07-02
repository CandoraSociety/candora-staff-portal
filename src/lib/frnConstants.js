export const FRN_PROGRAMS = [
  { value: 'connect_parent_group', label: 'Connect Parent Group', description: 'Attachment-based parenting program' },
  { value: 'nobodys_perfect', label: "Nobody's Perfect", description: 'Parenting education program' },
  { value: 'neurodivergent_coffee_group', label: 'Neurodivergent Coffee Group', description: 'Social support group for neurodivergent individuals' },
  { value: 'wellness_compass', label: 'Wellness Compass', description: 'Wellness and self-care program' },
  { value: 'other', label: 'Other', description: 'Other FRN targeted program' },
];

export const PROGRAM_LABELS = Object.fromEntries(FRN_PROGRAMS.map(p => [p.value, p.label]));

export const REFERRAL_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: '#f59e0b' },
  { value: 'assessment_scheduled', label: 'Assessment Scheduled', color: '#3b82f6' },
  { value: 'assessed', label: 'Assessed', color: '#8b5cf6' },
  { value: 'accepted', label: 'Accepted', color: '#22c55e' },
  { value: 'declined', label: 'Declined', color: '#ef4444' },
  { value: 'enrolled', label: 'Enrolled', color: '#0ea5e9' },
  { value: 'completed', label: 'Completed', color: '#64748b' },
  { value: 'withdrawn', label: 'Withdrawn', color: '#94a3b8' },
];

export const STATUS_LABELS = Object.fromEntries(REFERRAL_STATUS_OPTIONS.map(s => [s.value, s.label]));
export const STATUS_COLORS = Object.fromEntries(REFERRAL_STATUS_OPTIONS.map(s => [s.value, s.color]));

export const REFERRAL_SOURCE_LABELS = {
  internal: 'Internal Referral',
  external_partner: 'External Partner',
};

export const RELEVANCE_LABELS = {
  high: 'High',
  moderate: 'Moderate',
  low: 'Low',
  not_suitable: 'Not Suitable',
};

export const ABILITY_LABELS = {
  yes: 'Yes',
  with_support: 'Yes, with support',
  no: 'No',
};

export const WILLINGNESS_LABELS = {
  yes: 'Yes',
  uncertain: 'Uncertain',
  no: 'No',
};

export const RECOMMENDATION_LABELS = {
  accept: 'Accept',
  accept_with_support: 'Accept with support',
  defer: 'Defer',
  decline: 'Decline',
};

export const RECOMMENDATION_COLORS = {
  accept: '#22c55e',
  accept_with_support: '#0ea5e9',
  defer: '#f59e0b',
  decline: '#ef4444',
};