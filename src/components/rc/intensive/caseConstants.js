export const CASE_STAGES = [
  { key: 'referral_intake', label: 'Referral / Intake' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'goal_setting', label: 'Goal Setting' },
  { key: 'service_plan', label: 'Service Plan' },
  { key: 'active_case_management', label: 'Active Case Management' },
  { key: 'review_reassessment', label: 'Review / Reassessment' },
  { key: 'transition_planning', label: 'Transition Planning' },
  { key: 'closure', label: 'Closure' },
  { key: 'post_service_followup', label: 'Post-Service Follow-Up' },
  { key: 'completed', label: 'Completed' },
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

// Migration from the original 6-stage workflow to the expanded 10-stage workflow.
export const LEGACY_STAGE_MAP = {
  referral_screening: 'referral_intake',
  assessment: 'assessment',
  support_plan: 'service_plan',
  active_support: 'active_case_management',
  monitoring_review: 'review_reassessment',
  closure_followup: 'closure',
};

export const LEGACY_SEVERITY_MAP = { medium: 'moderate', high: 'elevated' };

// Normalizes a case record loaded from the database: rebuilds the stage list
// (carrying progress forward from legacy stage keys), remaps legacy task stage
// keys and risk severities, and backfills missing arrays.
export function migrateCase(c) {
  const defaults = buildDefaultStages();
  const byKey = Object.fromEntries((c.stages || []).map(s => [s.key, s]));
  const stages = defaults.map(d => {
    const legacyKey = Object.entries(LEGACY_STAGE_MAP).find(([, nk]) => nk === d.key)?.[0];
    const old = byKey[d.key] || (legacyKey ? byKey[legacyKey] : null);
    return old ? {
      ...d,
      status: old.status || 'not_started',
      start_date: old.start_date || null,
      completed_date: old.completed_date || null,
      notes: old.notes || '',
    } : d;
  });
  const mappedCurrent = LEGACY_STAGE_MAP[c.current_stage] || c.current_stage;
  return {
    ...c,
    stages,
    current_stage: stages.some(s => s.key === mappedCurrent) ? mappedCurrent : stages[0].key,
    tasks: (c.tasks || []).map(t => ({ ...t, stage_key: LEGACY_STAGE_MAP[t.stage_key] || t.stage_key })),
    risk_factors: (c.risk_factors || []).map(r => ({ ...r, severity: LEGACY_SEVERITY_MAP[r.severity] || r.severity })),
  };
}

export const STAGE_DETAILS = {
  referral_intake: {
    description: 'Receive the referral, confirm eligibility for Building Resilient Caregivers, and screen for urgency or safety concerns that need immediate attention before intake.',
  },
  assessment: {
    description: 'Complete the comprehensive family assessment — circumstances, strengths, needs, barriers, risks and priorities — and determine whether intensive family support is appropriate.',
  },
  goal_setting: {
    description: 'Work collaboratively with the caregiver to identify, prioritize and document participant-centred goals for the service.',
  },
  service_plan: {
    description: 'Build the individualized service plan with the caregiver — planned supports, internal and external referrals, frequency and intensity of contact, and review dates.',
  },
  active_case_management: {
    description: 'Deliver ongoing intensive support — a minimum of biweekly one-to-one contact, visits, coaching, navigation, advocacy and coordination with other services.',
  },
  review_reassessment: {
    description: 'Formally review progress toward the service plan with the caregiver at least monthly; adjust goals, intensity and referrals as circumstances change.',
  },
  transition_planning: {
    description: 'Assess readiness to complete intensive service and build the transition plan — ongoing supports, warm referrals and reconnection pathways.',
  },
  closure: {
    description: 'Complete the file: closure rationale, supervisor review, finalized transition plan, and documented connection to ongoing supports.',
  },
  post_service_followup: {
    description: 'Carry out post-service follow-up contacts (e.g. 30 and 90 days) and document whether supports and progress have been sustained.',
  },
  completed: {
    description: 'Intensive service complete. The participant may remain connected to Candora through other programs, Resource Worker supports, volunteering or the community.',
  },
};

// Actionable tools per stage — one-click task creation (with optional due-date offsets),
// in-app navigation links ({clientId} placeholder) and tab shortcuts.
export const STAGE_ACTIONS = {
  referral_intake: [
    { type: 'link', label: 'Open client profile — referral details', url: '/rc/clients/{clientId}' },
    { type: 'task', label: 'Add task: Confirm BRC eligibility (due in 7 days)', title: 'Confirm Building Resilient Caregivers eligibility', due_days: 7 },
    { type: 'task', label: 'Add task: Urgency / safety screening (due in 3 days)', title: 'Complete urgency / safety screening', due_days: 3 },
    { type: 'task', label: 'Add task: Supervisor consult for complex referral', title: 'Supervisor consult for complex referral' },
  ],
  assessment: [
    { type: 'tab', label: 'Open the comprehensive assessment form', tab: 'assessment' },
    { type: 'task_batch', label: 'Add intake & assessment checklist (5 tasks)', titles: [
      'Meet the family & build rapport',
      'Complete caregiver wellbeing screening',
      'Complete family strengths & needs assessment',
      'Review child development milestones (0\u20136)',
      'Record identified needs in the Central Database',
    ] },
    { type: 'task', label: 'Add task: Document risk factors identified (due in 7 days)', title: 'Document risk factors identified during assessment', due_days: 7 },
  ],
  goal_setting: [
    { type: 'tab', label: 'Open collaborative goal setting', tab: 'goals' },
    { type: 'task', label: 'Add task: Schedule goal-setting conversation (due in 7 days)', title: 'Schedule goal-setting conversation with caregiver', due_days: 7 },
    { type: 'link', label: 'Open Appointments — book the conversation', url: '/rc/appointments' },
  ],
  service_plan: [
    { type: 'tab', label: 'Open the individualized service plan', tab: 'goals' },
    { type: 'task', label: 'Add task: Draft service plan with caregiver (due in 14 days)', title: 'Draft service plan with caregiver', due_days: 14 },
    { type: 'task', label: 'Add task: Identify needed referrals (internal / community)', title: 'Identify needed referrals — internal programs & community partners', due_days: 14 },
    { type: 'link', label: 'Open client profile — External Referral action', url: '/rc/clients/{clientId}' },
  ],
  active_case_management: [
    { type: 'tab', label: 'Log a contact / service activity', tab: 'activity' },
    { type: 'task', label: 'Add task: Set recurring caregiver check-ins (due in 7 days)', title: 'Set recurring caregiver check-ins', due_days: 7 },
    { type: 'link', label: 'Open Appointments — book next visit', url: '/rc/appointments' },
    { type: 'link', label: 'Open client profile — emergency supports (food, clothing, bus tickets)', url: '/rc/clients/{clientId}' },
  ],
  review_reassessment: [
    { type: 'tab', label: 'Record a formal service plan review', tab: 'activity' },
    { type: 'task', label: 'Add task: Monthly review with caregiver (due in 30 days)', title: 'Monthly service plan review with caregiver', due_days: 30 },
    { type: 'task', label: 'Add task: Update risk factor statuses (due in 30 days)', title: 'Update risk factor statuses', due_days: 30 },
    { type: 'task', label: 'Add task: Book supervisor case review (due in 30 days)', title: 'Supervisor case review', due_days: 30 },
  ],
  transition_planning: [
    { type: 'tab', label: 'Open transition planning & readiness review', tab: 'transition' },
    { type: 'task', label: 'Add task: Draft transition plan with caregiver (due in 14 days)', title: 'Draft transition plan with caregiver', due_days: 14 },
    { type: 'task', label: 'Add task: Confirm ongoing supports are in place', title: 'Confirm ongoing supports are in place before completion', due_days: 14 },
  ],
  closure: [
    { type: 'tab', label: 'Complete closure documentation', tab: 'transition' },
    { type: 'task', label: 'Add task: Complete closure summary with caregiver', title: 'Complete closure summary with caregiver', due_days: 14 },
    { type: 'task', label: 'Add task: Obtain supervisor review of closure', title: 'Obtain supervisor review of closure rationale', due_days: 14 },
  ],
  post_service_followup: [
    { type: 'tab', label: 'Record a post-service follow-up', tab: 'transition' },
    { type: 'task', label: 'Add task: 30-day post-service follow-up (due in 30 days)', title: '30-day post-service follow-up contact', due_days: 30 },
    { type: 'task', label: 'Add task: 90-day post-service follow-up (due in 90 days)', title: '90-day post-service follow-up contact', due_days: 90 },
  ],
  completed: [
    { type: 'link', label: 'Open client profile — ongoing Candora connection', url: '/rc/clients/{clientId}' },
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

export const COMPLEXITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'very_complex', label: 'Very Complex' },
];

export const CONCERN_LEVEL_OPTIONS = [
  { value: 'not_identified', label: 'Not identified', color: '#22c55e' },
  { value: 'low', label: 'Low', color: '#84cc16' },
  { value: 'moderate', label: 'Moderate', color: '#f59e0b' },
  { value: 'elevated', label: 'Elevated', color: '#f97316' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
  { value: 'not_assessed', label: 'Not assessed at this time', color: '#94a3b8' },
  { value: 'declined', label: 'Participant declined to discuss', color: '#94a3b8' },
  { value: 'na', label: 'Not applicable', color: '#94a3b8' },
];

export const CONCERN_LEVEL_COLORS = Object.fromEntries(CONCERN_LEVEL_OPTIONS.map(o => [o.value, o.color]));
export const CONCERN_LEVEL_LABELS = Object.fromEntries(CONCERN_LEVEL_OPTIONS.map(o => [o.value, o.label]));

// Comprehensive family assessment structure — narrative fields (type 'text'/'textarea'/'select')
// and level-rated concern domains ({ level, notes }).
export const ASSESSMENT_GROUPS = [
  {
    label: 'Referral & Presenting Concerns',
    fields: [
      { key: 'reason_referral', label: 'Reason for referral / presenting concerns', type: 'textarea' },
      { key: 'referral_source', label: 'Referral source', type: 'text' },
      { key: 'existing_involvement', label: 'Existing involvement with Candora or other services', type: 'textarea' },
    ],
  },
  {
    label: 'Family & Household',
    fields: [
      { key: 'household_composition', label: 'Household / family composition & relevant demographics', type: 'textarea' },
      { key: 'children', label: 'Children / youth in the household — ages & developmental considerations', type: 'textarea' },
      { key: 'caregiver_circumstances', label: "Caregiver's description of current circumstances", type: 'textarea' },
      { key: 'caregiver_priorities', label: "Caregiver's priorities", type: 'textarea' },
    ],
  },
  {
    label: 'Strengths & Supports',
    fields: [
      { key: 'family_strengths', label: 'Family strengths, protective factors, skills & resources', type: 'textarea' },
      { key: 'natural_supports', label: 'Informal / natural supports — family, friends, community connections', type: 'textarea' },
      { key: 'internal_supports', label: 'Current involvement with Candora programs / Resource Workers', type: 'textarea' },
      { key: 'external_providers', label: 'Current external service providers & professionals', type: 'textarea' },
    ],
  },
  {
    label: 'Parenting & Child Wellbeing',
    domains: [
      { key: 'parenting_concerns', label: 'Parenting / caregiver concerns' },
      { key: 'child_concerns', label: 'Child / youth behavioural, emotional or developmental concerns' },
      { key: 'family_functioning', label: 'Family relationships & family functioning' },
    ],
  },
  {
    label: 'Stability & Context',
    domains: [
      { key: 'housing', label: 'Housing stability' },
      { key: 'basic_needs', label: 'Financial / basic-needs stability' },
      { key: 'employment_education', label: 'Employment / education considerations' },
      { key: 'physical_health', label: 'Physical health' },
      { key: 'mental_health', label: 'Mental health' },
      { key: 'social_isolation', label: 'Social isolation / support network' },
      { key: 'system_navigation', label: 'System-navigation challenges' },
      { key: 'language_accessibility', label: 'Language, communication or accessibility considerations' },
      { key: 'family_violence', label: 'Family violence / safety concerns' },
      { key: 'child_safety', label: 'Child safety / wellbeing & duty-to-report considerations' },
      { key: 'other_risks', label: 'Other identified risk factors' },
      { key: 'service_barriers', label: 'Barriers to accessing services' },
    ],
  },
  {
    label: 'History & Readiness',
    fields: [
      { key: 'previous_interventions', label: 'Previous / current interventions & what has or has not helped', type: 'textarea' },
      { key: 'readiness', label: "Caregiver's readiness and priorities for change", type: 'textarea' },
    ],
  },
  {
    label: 'Worker Summary',
    fields: [
      { key: 'complexity_level', label: 'Caseworker assessment of complexity', type: 'select', options: COMPLEXITY_OPTIONS },
      { key: 'support_required', label: 'Level of support required', type: 'textarea' },
      { key: 'immediate_actions', label: 'Immediate actions required', type: 'textarea' },
      { key: 'consultation_referrals', label: 'Clinical consultation, specialized services or other referrals to consider', type: 'textarea' },
    ],
  },
];

export const CONTACT_TYPE_OPTIONS = [
  { value: 'one_to_one_meeting', label: 'One-to-one meeting' },
  { value: 'telephone_video', label: 'Telephone / video contact' },
  { value: 'home_visit', label: 'Home visit' },
  { value: 'community_visit', label: 'Community visit' },
  { value: 'coaching_problem_solving', label: 'Caregiver coaching / problem-solving' },
  { value: 'system_navigation', label: 'System navigation' },
  { value: 'advocacy', label: 'Advocacy' },
  { value: 'internal_coordination', label: 'Internal service coordination' },
  { value: 'external_coordination', label: 'External service coordination' },
  { value: 'warm_referral', label: 'Warm referral' },
  { value: 'accompaniment', label: 'Accompaniment' },
  { value: 'clinical_consultation', label: 'Clinical / professional consultation' },
  { value: 'contact_attempt', label: 'Attempt to contact' },
  { value: 'crisis_response', label: 'Crisis / emerging issue response' },
  { value: 'other', label: 'Other case management activity' },
];

export const CONTACT_TYPE_LABELS = Object.fromEntries(CONTACT_TYPE_OPTIONS.map(o => [o.value, o.label]));

export const INTENSITY_CHANGE_OPTIONS = [
  { value: 'increase', label: 'Increase intensity' },
  { value: 'maintain', label: 'Maintain current intensity' },
  { value: 'decrease', label: 'Decrease intensity' },
];

export const OUTCOME_STAGE_OPTIONS = [
  { value: 'baseline', label: 'Baseline' },
  { value: 'review', label: 'Review' },
  { value: 'closure', label: 'Closure' },
];

export const OUTCOME_CATEGORY_OPTIONS = [
  { value: 'goal_achieved', label: 'Service-plan goal achieved' },
  { value: 'caregiver_capacity', label: 'Increased caregiver capacity / confidence' },
  { value: 'family_stability', label: 'Improved family stability' },
  { value: 'risk_reduction', label: 'Reduced identified risks / safety concerns' },
  { value: 'protective_factors', label: 'Increased protective factors' },
  { value: 'service_connection', label: 'Successful connection to required services' },
  { value: 'informal_supports', label: 'Increased connection to informal / community supports' },
  { value: 'system_navigation', label: 'Improved ability to navigate systems independently' },
  { value: 'coping_problem_solving', label: 'Improved coping / problem-solving capacity' },
  { value: 'reduced_crisis_need', label: 'Reduced need for intensive / crisis intervention' },
  { value: 'sustained_engagement', label: 'Sustained engagement with appropriate supports' },
  { value: 'participant_defined', label: 'Other participant-defined outcome' },
];

export const CLOSURE_REASON_OPTIONS = [
  { value: 'goals_achieved', label: 'Primary goals substantially achieved' },
  { value: 'risks_stabilized', label: 'Immediate / high-priority risks stabilized or reduced' },
  { value: 'family_capacity', label: 'Family has increased capacity to manage remaining needs' },
  { value: 'supports_established', label: 'Appropriate ongoing supports established' },
  { value: 'independent_navigation', label: 'Participant can navigate services with less assistance' },
  { value: 'no_longer_needed', label: 'Intensive case management no longer necessary' },
  { value: 'participant_request', label: 'Participant requested to end service' },
  { value: 'participant_disengaged', label: 'Participant disengaged despite reconnection attempts' },
  { value: 'transfer', label: 'Transfer to another service / provider appropriate' },
  { value: 'other', label: 'Other documented reason' },
];

export const TRANSITION_INDICATORS = [
  'Primary goals have been substantially achieved',
  'Immediate / high-priority risks have stabilized or reduced',
  'Family has increased capacity to manage remaining needs',
  'Appropriate ongoing supports are established',
  'Participant can navigate required services with less intensive assistance',
  'Intensive case management is no longer necessary',
  'Participant requests to end service',
  'Participant disengages despite appropriate attempts to reconnect',
  'Transfer to another service / provider is appropriate',
];

export const RISK_CATEGORY_OPTIONS = [
  { value: 'family', label: 'Family', color: '#8b5cf6' },
  { value: 'individual', label: 'Individual', color: '#3b82f6' },
  { value: 'child', label: 'Child', color: '#f59e0b' },
];

export const RISK_CATEGORY_LABELS = Object.fromEntries(RISK_CATEGORY_OPTIONS.map(c => [c.value, c.label]));
export const RISK_CATEGORY_COLORS = Object.fromEntries(RISK_CATEGORY_OPTIONS.map(c => [c.value, c.color]));

export const RISK_SEVERITY_OPTIONS = [
  { value: 'none', label: 'No current concern', color: '#22c55e' },
  { value: 'low', label: 'Low', color: '#84cc16' },
  { value: 'moderate', label: 'Moderate', color: '#f59e0b' },
  { value: 'elevated', label: 'Elevated', color: '#f97316' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
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
  { value: 'paused', label: 'Paused', color: '#a855f7' },
  { value: 'dropped', label: 'Discontinued', color: '#94a3b8' },
];

export const uid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
export const today = () => new Date().toLocaleDateString('en-CA');