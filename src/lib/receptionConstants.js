export const PROGRAM_PORTAL_OPTIONS = [
  { value: 'ell', label: 'ELL (English Language Learning)', path: '/ell' },
  { value: 'frn', label: 'FRN Programs', path: '/frn' },
  { value: 'phac', label: 'PHAC Programs', path: '/phac' },
  { value: 'empoweru', label: 'EmpowerU', path: '/empoweru' },
  { value: 'rc', label: 'Resource Centre', path: '/rc' },
  { value: 'pathways', label: 'Pathways', path: '/pathways' },
  { value: 'food', label: 'Food Services', path: '/food' },
  { value: 'board', label: 'Board', path: '/board' },
  { value: 'volunteermgr', label: 'Volunteer Manager', path: '/volunteermgr' },
  { value: 'grants', label: 'Grants', path: '/grants' },
  { value: 'marketing', label: 'Marketing', path: '/marketing' },
  { value: 'nexushr', label: 'NexusHR', path: '/nexushr' },
  { value: 'eventsmgr', label: 'Events Manager', path: '/eventsmgr' },
  { value: 'archives', label: 'Archives', path: '/archives' },
  { value: 'ed', label: 'Executive Director', path: '/ed' },
  { value: 'other', label: 'Other', path: '/' },
];
export const PROGRAM_PORTAL_LABELS = Object.fromEntries(PROGRAM_PORTAL_OPTIONS.map(p => [p.value, p.label]));
export const PROGRAM_PORTAL_PATHS = Object.fromEntries(PROGRAM_PORTAL_OPTIONS.map(p => [p.value, p.path]));

export const STAFF_ROLE_OPTIONS = [
  { value: 'facilitator', label: 'Facilitator', color: '#8b5cf6' },
  { value: 'manager', label: 'Manager', color: '#3b82f6' },
  { value: 'coordinator', label: 'Coordinator', color: '#22c55e' },
  { value: 'assistant', label: 'Assistant', color: '#f59e0b' },
  { value: 'contractor', label: 'Contractor', color: '#06b6d4' },
  { value: 'admin', label: 'Admin', color: '#64748b' },
  { value: 'other', label: 'Other', color: '#64748b' },
];
export const STAFF_ROLE_LABELS = Object.fromEntries(STAFF_ROLE_OPTIONS.map(r => [r.value, r.label]));
export const STAFF_ROLE_COLORS = Object.fromEntries(STAFF_ROLE_OPTIONS.map(r => [r.value, r.color]));

export const APPT_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', color: '#3b82f6' },
  { value: 'checked_in', label: 'Checked In', color: '#22c55e' },
  { value: 'completed', label: 'Completed', color: '#8b5cf6' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  { value: 'no_show', label: 'No Show', color: '#f59e0b' },
];
export const APPT_STATUS_LABELS = Object.fromEntries(APPT_STATUS_OPTIONS.map(s => [s.value, s.label]));

export const DROPIN_STATUS_OPTIONS = [
  { value: 'checked_in', label: 'Checked In', color: '#22c55e' },
  { value: 'checked_out', label: 'Checked Out', color: '#64748b' },
];
export const DROPIN_STATUS_LABELS = Object.fromEntries(DROPIN_STATUS_OPTIONS.map(s => [s.value, s.label]));

export const REG_STATUS_OPTIONS = [
  { value: 'pending_approval', label: 'Pending Approval', color: '#f59e0b' },
  { value: 'approved', label: 'Approved', color: '#22c55e' },
  { value: 'waitlisted', label: 'Waitlisted', color: '#a855f7' },
  { value: 'declined', label: 'Declined', color: '#ef4444' },
  { value: 'enrolled', label: 'Enrolled', color: '#3b82f6' },
  { value: 'completed', label: 'Completed', color: '#8b5cf6' },
  { value: 'withdrawn', label: 'Withdrawn', color: '#64748b' },
];
export const REG_STATUS_LABELS = Object.fromEntries(REG_STATUS_OPTIONS.map(s => [s.value, s.label]));

export const ELIGIBILITY_OPTIONS = [
  { value: 'not_assessed', label: 'Not Assessed', color: '#64748b' },
  { value: 'eligible', label: 'Eligible', color: '#22c55e' },
  { value: 'conditionally_eligible', label: 'Conditionally Eligible', color: '#f59e0b' },
  { value: 'not_eligible', label: 'Not Eligible', color: '#ef4444' },
];
export const ELIGIBILITY_LABELS = Object.fromEntries(ELIGIBILITY_OPTIONS.map(e => [e.value, e.label]));

export const RESOURCE_CATEGORY_OPTIONS = [
  { value: 'food', label: 'Food & Meals', color: '#f59e0b', icon: '🍳' },
  { value: 'housing', label: 'Housing & Shelter', color: '#3b82f6', icon: '🏠' },
  { value: 'employment', label: 'Employment & Jobs', color: '#22c55e', icon: '💼' },
  { value: 'education', label: 'Education & Training', color: '#8b5cf6', icon: '📚' },
  { value: 'health', label: 'Health & Medical', color: '#ef4444', icon: '⚕️' },
  { value: 'childcare', label: 'Childcare & Children', color: '#06b6d4', icon: '👶' },
  { value: 'legal', label: 'Legal Services', color: '#64748b', icon: '⚖️' },
  { value: 'financial', label: 'Financial Support', color: '#15803d', icon: '💰' },
  { value: 'mental_health', label: 'Mental Health', color: '#a855f7', icon: '🧠' },
  { value: 'settlement', label: 'Settlement & Immigration', color: '#0ea5e9', icon: '🌍' },
  { value: 'family_support', label: 'Family Support', color: '#ec4899', icon: '👨‍👩‍👧' },
  { value: 'community', label: 'Community Programs', color: '#f97316', icon: '🤝' },
  { value: 'other', label: 'Other', color: '#64748b', icon: '📋' },
];
export const RESOURCE_CATEGORY_LABELS = Object.fromEntries(RESOURCE_CATEGORY_OPTIONS.map(c => [c.value, c.label]));
export const RESOURCE_CATEGORY_COLORS = Object.fromEntries(RESOURCE_CATEGORY_OPTIONS.map(c => [c.value, c.color]));

export const URGENCY_OPTIONS = [
  { value: 'info', label: 'Info', color: '#3b82f6' },
  { value: 'urgent', label: 'Urgent', color: '#f59e0b' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
];
export const URGENCY_LABELS = Object.fromEntries(URGENCY_OPTIONS.map(u => [u.value, u.label]));

export const RECIPIENT_TYPE_OPTIONS = [
  { value: 'all_managers', label: 'All Managers' },
  { value: 'specific_staff', label: 'Specific Staff' },
  { value: 'all_staff', label: 'All Staff' },
  { value: 'specific_department', label: 'Specific Department' },
];
export const RECIPIENT_TYPE_LABELS = Object.fromEntries(RECIPIENT_TYPE_OPTIONS.map(r => [r.value, r.label]));