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

export const STAGE_DETAILS = {
  referral_screening: {
    description: 'Receive the referral, confirm eligibility for Building Resilient Caregivers, and screen for urgency or safety concerns that need immediate attention.',
    resources: ['Intake & referral form (Central Database client profile)', 'Program eligibility criteria sheet', 'Urgency / safety screening checklist', 'Supervisor consult for complex referrals'],
  },
  assessment: {
    description: 'Meet the family, build rapport, and complete the intake & assessment conversation covering caregiver wellbeing, child development, family strengths, and identified needs.',
    resources: ['Family strengths & needs assessment', 'Caregiver wellbeing screening tools', 'Child development milestones reference (0-6)', 'Risk factor identification guide'],
  },
  support_plan: {
    description: 'Develop the individualized support plan with the caregiver — goals, objectives, action steps, frequency of contact, and the supports and referrals needed.',
    resources: ['Support plan template (Objectives tab)', 'Referral directory — internal programs and community partners', 'Caregiver Capacity 0-6 program options', 'External Referral form (client profile)'],
  },
  active_support: {
    description: 'Deliver ongoing intensive supports — regular contact, home or centre visits, coaching, resource connections, and advocacy coordinated with other services.',
    resources: ['Visit / service logging (Service History tab)', 'Community resource directory', 'Emergency supports — food, clothing, bus tickets', 'Case tasks tracker (Tasks tab)'],
  },
  monitoring_review: {
    description: 'Review progress against the support plan at set intervals, adjust objectives, monitor risk factors, and confirm services remain the right fit.',
    resources: ['Support plan review schedule (e.g. every 90 days)', 'Risk factor monitoring (Risk Factors tab)', 'Objective progress check-in', 'Supervisor case review'],
  },
  closure_followup: {
    description: 'Close the case when goals are achieved or the family exits — complete a closure summary, transition referrals as needed, and complete follow-up contact.',
    resources: ['Closure summary template', 'Follow-up schedule (e.g. 30 and 90 days post-closure)', 'Warm handoff / transition referral guide', 'Program evaluation & outcome reporting'],
  },
};

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