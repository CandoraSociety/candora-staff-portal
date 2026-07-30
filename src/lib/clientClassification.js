export const DEA_SUBSECTIONS = [
  { key: 'program_started', label: 'Active (EDA)' },
  { key: 'followup_period', label: 'Follow-up Period' },
  { key: 'completed', label: 'Completed' },
  { key: 'incomplete_cancelled', label: 'Incomplete/Cancelled' },
  { key: 'not_started', label: 'Not Started' },
];

export const WD_SUBSECTIONS = [
  { key: 'program_started', label: 'Active (EDA)' },
  { key: 'work_search', label: 'Work Search Phase' },
  { key: 'followup_period', label: 'Follow-up Period' },
  { key: 'completed', label: 'Completed' },
  { key: 'incomplete_cancelled', label: 'Incomplete/Cancelled' },
  { key: 'not_started', label: 'Not Started' },
];

const EMPLOYED_CODES = ['E-RF', 'E-UF', 'E-PT'];

export function classifyClient(c) {
  const ps = c.program_status;
  const hasFollowup = !!c.followup_90day_status;
  const isEmployed = EMPLOYED_CODES.includes(c.employment_status);
  const hasEdaCompletion = !!c.completion_date;

  if (ps === 'incomplete' || ps === 'cancelled') return 'incomplete_cancelled';
  if (ps === 'complete') return hasFollowup ? 'completed' : 'followup_period';

  if (ps === 'in_progress' || (!ps && c.service_start_date)) {
    if (c.service_type === 'pathways') {
      // WD: Active (EDA) → Work Search → Follow-up
      if (isEmployed) return 'followup_period';
      if (hasEdaCompletion) return 'work_search';
      return 'program_started'; // Active (EDA)
    }
    // DEA: Active (EDA) → Follow-up
    if (hasEdaCompletion) return 'followup_period';
    return 'program_started'; // Active (EDA)
  }
  return 'not_started';
}

export function groupClientsBySubSection(clients, program) {
  const subsections = program === 'dea' ? DEA_SUBSECTIONS : WD_SUBSECTIONS;
  const groups = {};
  for (const sub of subsections) groups[sub.key] = [];
  for (const c of clients) {
    const key = classifyClient(c);
    if (groups[key]) groups[key].push(c);
  }
  return groups;
}