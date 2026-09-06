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

// Actionable tools per stage — one-click task creation (with optional due-date offsets)
// and in-app navigation links. url supports a {clientId} placeholder.
export const STAGE_ACTIONS = {
  referral_screening: [
    { type: 'link', label: 'Open client profile — referral details', url: '/rc/clients/{clientId}' },
    { type: 'task', label: 'Add task: Confirm BRC eligibility (due in 7 days)', title: 'Confirm Building Resilient Caregivers eligibility', due_days: 7 },
    { type: 'task', label: 'Add task: Urgency / safety screening (due in 3 days)', title: 'Complete urgency / safety screening', due_days: 3 },
    { type: 'task', label: 'Add task: Supervisor consult for complex referral', title: 'Supervisor consult for complex referral' },
  ],
  assessment: [
    { type: 'link', label: 'Open client profile — contact & demographics', url: '/rc/clients/{clientId}' },
    { type: 'task_batch', label: 'Add intake & assessment checklist (5 tasks)', titles: [
      'Meet the family & build rapport',
      'Complete caregiver wellbeing screening',
      'Complete family strengths & needs assessment',
      'Review child development milestones (0\u20136)',
      'Record identified needs in the Central Database',
    ] },
    { type: 'task', label: 'Add task: Document risk factors identified', title: 'Document risk factors identified during assessment', due_days: 7 },
  ],
  support_plan: [
    { type: 'task', label: 'Add task: Draft support plan with caregiver (due in 14 days)', title: 'Draft support plan with caregiver', due_days: 14 },
    { type: 'task', label: 'Add task: Set plan objectives & action steps', title: 'Set plan objectives & action steps', due_days: 14 },
    { type: 'task', label: 'Add task: Identify needed referrals (internal / community)', title: 'Identify needed referrals — internal programs & community partners', due_days: 14 },
    { type: 'link', label: 'Open Appointments — schedule planning meeting', url: '/rc/appointments' },
    { type: 'link', label: 'Open client profile — External Referral action', url: '/rc/clients/{clientId}' },
  ],
  active_support: [
    { type: 'task', label: 'Add task: Set recurring caregiver check-ins (due in 7 days)', title: 'Set recurring caregiver check-ins', due_days: 7 },
    { type: 'link', label: 'Open Appointments — book next visit', url: '/rc/appointments' },
    { type: 'link', label: 'Open client profile — emergency supports (food, clothing, bus tickets)', url: '/rc/clients/{clientId}' },
    { type: 'task', label: 'Add task: Connect family with community resources', title: 'Connect family with community resources', due_days: 14 },
  ],
  monitoring_review: [
    { type: 'task', label: 'Add task: 90-day support plan review (due in 90 days)', title: '90-day support plan review', due_days: 90 },
    { type: 'task', label: 'Add task: Review objectives progress with caregiver (due in 30 days)', title: 'Review objectives progress with caregiver', due_days: 30 },
    { type: 'task', label: 'Add task: Update risk factor statuses (due in 30 days)', title: 'Update risk factor statuses', due_days: 30 },
    { type: 'task', label: 'Add task: Book supervisor case review (due in 30 days)', title: 'Supervisor case review', due_days: 30 },
  ],
  closure_followup: [
    { type: 'task', label: 'Add task: Complete closure summary with caregiver', title: 'Complete closure summary with caregiver', due_days: 14 },
    { type: 'task', label: 'Add task: 30-day post-closure follow-up contact (due in 30 days)', title: '30-day post-closure follow-up contact', due_days: 30 },
    { type: 'task', label: 'Add task: 90-day post-closure follow-up contact (due in 90 days)', title: '90-day post-closure follow-up contact', due_days: 90 },
    { type: 'task', label: 'Add task: Arrange warm handoff / transition referrals', title: 'Arrange warm handoff / transition referrals', due_days: 14 },
  ],
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