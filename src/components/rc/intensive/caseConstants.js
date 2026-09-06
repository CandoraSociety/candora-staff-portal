export const CASE_STAGES = [
  { key: 'referral_screening', label: 'Referral & Screening' },
  { key: 'assessment', label: 'Intake & Assessment' },
  { key: 'support_plan', label: 'Support Plan Development' },
  { key: 'active_support', label: 'Active Support' },
  { key: 'monitoring_review', label: 'Monitoring & Review' },
  { key: 'closure_followup', label: 'Closure & Follow-Up' },
];

export const STAGE_LABELS = Object.fromEntries(CASE_STAGES.map(s => [s.key, s.label]));

export const buildDefaultStages = () => CASE_STAGES.map(s => ({
  key: s.key,
  label: s.label,
  status: 'not_started',
  start_date: null,
  completed_date: null,
  notes: '',
}));

export const STAGE_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: '#94a3b8' },
  { value: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { value: 'complete', label: 'Complete', color: '#22c55e' },
];

export const STAGE_STATUS_COLORS = Object.fromEntries(STAGE_STATUS_OPTIONS.map(s => [s.value, s.color]));

export const TASK_STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do', color: '#94a3b8' },
  { value: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { value: 'done', label: 'Done', color: '#22c55e' },
];

export const RISK_CATEGORY_OPTIONS = [
  { value: 'family', label: 'Family', color: '#8b5cf6' },
  { value: 'individual', label: 'Individual', color: '#3b82f6' },
  { value: 'child', label: 'Child', color: '#f59e0b' },
];

export const RISK_CATEGORY_LABELS = Object.fromEntries(RISK_CATEGORY_OPTIONS.map(c => [c.value, c.label]));
export const RISK_CATEGORY_COLORS = Object.fromEntries(RISK_CATEGORY_OPTIONS.map(c => [c.value, c.color]));

export const RISK_SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#22c55e' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

export const RISK_SEVERITY_COLORS = Object.fromEntries(RISK_SEVERITY_OPTIONS.map(s => [s.value, s.color]));

export const RISK_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: '#ef4444' },
  { value: 'monitoring', label: 'Monitoring', color: '#f59e0b' },
  { value: 'mitigated', label: 'Mitigated', color: '#22c55e' },
];

export const OBJECTIVE_STATUS_OPTIONS = [
  { value: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { value: 'achieved', label: 'Achieved', color: '#22c55e' },
  { value: 'revised', label: 'Revised', color: '#3b82f6' },
  { value: 'dropped', label: 'Dropped', color: '#94a3b8' },
];

export const uid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
export const today = () => new Date().toLocaleDateString('en-CA');