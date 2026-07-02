export const PROGRAM_CATEGORY_OPTIONS = [
  { value: 'social', label: 'Social', icon: '☕', color: '#3b82f6' },
  { value: 'recreation', label: 'Recreation', icon: '🎯', color: '#22c55e' },
  { value: 'wellness', label: 'Wellness', icon: '💚', color: '#10b981' },
  { value: 'arts', label: 'Arts & Crafts', icon: '🎨', color: '#f59e0b' },
  { value: 'education', label: 'Education', icon: '📚', color: '#8b5cf6' },
  { value: 'support', label: 'Support Group', icon: '🤝', color: '#ec4899' },
  { value: 'girls_program', label: 'Girls Program', icon: '🌸', color: '#e879f9' },
  { value: 'other', label: 'Other', icon: '📋', color: '#64748b' },
];
export const PROGRAM_CATEGORY_LABELS = Object.fromEntries(PROGRAM_CATEGORY_OPTIONS.map(c => [c.value, c.label]));

export const PROGRAM_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: '#22c55e' },
  { value: 'paused', label: 'Paused', color: '#f59e0b' },
  { value: 'completed', label: 'Completed', color: '#8b5cf6' },
  { value: 'discontinued', label: 'Discontinued', color: '#ef4444' },
];
export const PROGRAM_STATUS_LABELS = Object.fromEntries(PROGRAM_STATUS_OPTIONS.map(s => [s.value, s.label]));

export const FUNDER_CATEGORY_OPTIONS = [
  { value: 'none', label: 'Internal (no funder)', color: '#64748b' },
  { value: 'phac', label: 'PHAC', color: '#3b82f6' },
  { value: 'frn', label: 'FRN', color: '#8b5cf6' },
  { value: 'pathways', label: 'Pathways', color: '#f59e0b' },
  { value: 'other', label: 'Other', color: '#ec4899' },
];
export const FUNDER_CATEGORY_LABELS = Object.fromEntries(FUNDER_CATEGORY_OPTIONS.map(f => [f.value, f.label]));

export const REGISTRATION_STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered', color: '#3b82f6' },
  { value: 'active', label: 'Active', color: '#22c55e' },
  { value: 'completed', label: 'Completed', color: '#8b5cf6' },
  { value: 'withdrawn', label: 'Withdrawn', color: '#ef4444' },
  { value: 'waitlisted', label: 'Waitlisted', color: '#f59e0b' },
];
export const REGISTRATION_STATUS_LABELS = Object.fromEntries(REGISTRATION_STATUS_OPTIONS.map(s => [s.value, s.label]));

export const SESSION_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', color: '#3b82f6' },
  { value: 'completed', label: 'Completed', color: '#22c55e' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
];
export const SESSION_STATUS_LABELS = Object.fromEntries(SESSION_STATUS_OPTIONS.map(s => [s.value, s.label]));

export const ENGAGEMENT_OPTIONS = [
  { value: 'high', label: 'High', color: '#22c55e' },
  { value: 'moderate', label: 'Moderate', color: '#f59e0b' },
  { value: 'low', label: 'Low', color: '#ef4444' },
  { value: 'not_engaged', label: 'Not Engaged', color: '#64748b' },
];
export const ENGAGEMENT_LABELS = Object.fromEntries(ENGAGEMENT_OPTIONS.map(e => [e.value, e.label]));

export const PARTICIPATION_OPTIONS = [
  { value: 'exceeded', label: 'Exceeded', color: '#22c55e' },
  { value: 'met', label: 'Met', color: '#3b82f6' },
  { value: 'partially_met', label: 'Partially Met', color: '#f59e0b' },
  { value: 'not_met', label: 'Not Met', color: '#ef4444' },
];
export const PARTICIPATION_LABELS = Object.fromEntries(PARTICIPATION_OPTIONS.map(p => [p.value, p.label]));