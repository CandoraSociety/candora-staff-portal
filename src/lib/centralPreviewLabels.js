// Label maps for reading another person's central database profile from inside
// a program portal (read-only preview). Mirrors the central database portal.

export const PROGRAM_META = {
  pathways: { label: 'Pathways', color: '#8b5cf6' },
  empoweru: { label: 'EmpowerU', color: '#10b981' },
  frn: { label: 'FRN', color: '#22c55e' },
  phac: { label: 'PHAC', color: '#0ea5e9' },
  community: { label: 'Community Programs', color: '#f59e0b' },
  ell: { label: 'English Language Learning', color: '#6366f1' },
  digilit: { label: 'Digital Literacy', color: '#f43f5e' },
};

export const STREAM_LABELS = {
  pathways: 'WD',
  direct_to_employment: 'DEA',
  casual: 'Casual',
  external_referral: 'External Referral',
  internal_referral: 'Internal Referral',
  not_eligible: 'Not Eligible',
};

export const PROGRAM_STATUS_LABELS = {
  in_progress: 'In Progress',
  complete: 'Completed',
  incomplete: 'Incomplete',
  cancelled: 'Cancelled',
};

export const SERVICE_TYPE_LABELS = {
  information_referral: 'Information & Referral',
  advocacy: 'Advocacy',
  navigation: 'System Navigation',
  practical_support: 'Practical Support',
  caregiver_support: 'Caregiver Support',
  crisis_intervention: 'Crisis Intervention',
  follow_up: 'Follow-up',
  other: 'Other',
};

export const CASE_STATUS_LABELS = {
  intake: 'Intake',
  active: 'Active',
  monitoring: 'Monitoring',
  waitlisted: 'Waitlisted',
  closed: 'Closed',
};

export const SERVICE_CATEGORY_LABELS = {
  intensive_services: 'Intensive Services',
  caregiver_capacity_0_5: 'Caregiver Capacity 0-5',
  general: 'General',
};

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');