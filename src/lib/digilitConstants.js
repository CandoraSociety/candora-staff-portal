export const PARTICIPANT_STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered', color: '#3b82f6' },
  { value: 'started', label: 'Started', color: '#22c55e' },
  { value: 'completed', label: 'Completed', color: '#8b5cf6' },
  { value: 'withdrawn', label: 'Withdrawn', color: '#ef4444' },
  { value: 'waitlisted', label: 'Waitlisted', color: '#f59e0b' },
];
export const PARTICIPANT_STATUS_LABELS = Object.fromEntries(PARTICIPANT_STATUS_OPTIONS.map(s => [s.value, s.label]));

export const SKILL_LEVEL_OPTIONS = [
  { value: 'not_assessed', label: 'Not Assessed', color: '#64748b' },
  { value: 'beginner', label: 'Beginner', color: '#ef4444' },
  { value: 'intermediate', label: 'Intermediate', color: '#f59e0b' },
  { value: 'advanced', label: 'Advanced', color: '#22c55e' },
];
export const SKILL_LEVEL_LABELS = Object.fromEntries(SKILL_LEVEL_OPTIONS.map(s => [s.value, s.label]));

export const SESSION_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', color: '#3b82f6' },
  { value: 'completed', label: 'Completed', color: '#22c55e' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
];
export const SESSION_STATUS_LABELS = Object.fromEntries(SESSION_STATUS_OPTIONS.map(s => [s.value, s.label]));

export const TOPIC_AREA_OPTIONS = [
  { value: 'computer_basics', label: 'Computer Basics', icon: '💻' },
  { value: 'internet_email', label: 'Internet & Email', icon: '📧' },
  { value: 'smartphone_basics', label: 'Smartphone Basics', icon: '📱' },
  { value: 'online_safety', label: 'Online Safety', icon: '🔒' },
  { value: 'job_search_online', label: 'Online Job Search', icon: '🔍' },
  { value: 'office_software', label: 'Office Software', icon: '📄' },
  { value: 'social_media', label: 'Social Media', icon: '👥' },
  { value: 'other', label: 'Other', icon: '📋' },
];
export const TOPIC_AREA_LABELS = Object.fromEntries(TOPIC_AREA_OPTIONS.map(t => [t.value, t.label]));

export const ENGAGEMENT_OPTIONS = [
  { value: 'high', label: 'High', color: '#22c55e' },
  { value: 'moderate', label: 'Moderate', color: '#f59e0b' },
  { value: 'low', label: 'Low', color: '#ef4444' },
  { value: 'not_engaged', label: 'Not Engaged', color: '#64748b' },
];
export const ENGAGEMENT_LABELS = Object.fromEntries(ENGAGEMENT_OPTIONS.map(e => [e.value, e.label]));

export const SKILL_DEMO_OPTIONS = [
  { value: 'exceeded', label: 'Exceeded Expectations', color: '#22c55e' },
  { value: 'met', label: 'Met Expectations', color: '#3b82f6' },
  { value: 'partially_met', label: 'Partially Met', color: '#f59e0b' },
  { value: 'not_met', label: 'Not Met', color: '#ef4444' },
];
export const SKILL_DEMO_LABELS = Object.fromEntries(SKILL_DEMO_OPTIONS.map(s => [s.value, s.label]));

export const ATTENDANCE_OPTIONS = [
  { value: 'present', label: 'Present', color: '#22c55e' },
  { value: 'partial', label: 'Partial', color: '#f59e0b' },
  { value: 'absent', label: 'Absent', color: '#ef4444' },
];
export const ATTENDANCE_LABELS = Object.fromEntries(ATTENDANCE_OPTIONS.map(a => [a.value, a.label]));

// Pathways milestone titles for Digital Literacy
export const PATHWAYS_MILESTONE_TITLES = {
  registered: 'Digital Literacy - Registered',
  started: 'Digital Literacy - Started',
  completed: 'Digital Literacy - Completed',
  withdrawn: 'Digital Literacy - Withdrawn',
};