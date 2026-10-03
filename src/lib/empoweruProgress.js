// EmpowerU participant progress checkpoints. Checkpoints are program
// milestones (visualized as completed / outstanding); informational fields
// (ambassador, banking, savings amounts, contact info, notes) are NOT
// checkpoints and never count toward the progress summary.

export const PRE_PROGRAM_CHECKPOINTS = [
  { key: 'cp_registration_form', label: 'Registration Form' },
  { key: 'cp_qualtrics', label: 'Qualtrics' },
  { key: 'cp_binder', label: 'Binder' },
  { key: 'cp_pre_asset_map', label: 'Pre-Asset Map' },
];

export const COMPLETION_CHECKPOINTS = [
  { key: 'cp_post_asset_map', label: 'Post-Asset Map' },
  { key: 'cp_post_questionnaire', label: 'Post-Questionnaire' },
  { key: 'cp_completion_form', label: 'Program Completion Form' },
  { key: 'cp_asset_description', label: 'Asset Description Form' },
];

export const ALL_CHECKPOINTS = [...PRE_PROGRAM_CHECKPOINTS, ...COMPLETION_CHECKPOINTS];

// Progress summary counts ONLY completion checkpoints, never informational fields.
export function progressOf(reg) {
  const completed = ALL_CHECKPOINTS.filter(c => reg?.[c.key]).length;
  return { completed, total: ALL_CHECKPOINTS.length };
}

export function outstandingPreProgram(reg) {
  return PRE_PROGRAM_CHECKPOINTS.filter(c => !reg?.[c.key]).map(c => c.label);
}

export function outstandingCompletion(reg) {
  return COMPLETION_CHECKPOINTS.filter(c => !reg?.[c.key]).map(c => c.label);
}

export function isPreProgramComplete(reg) {
  return PRE_PROGRAM_CHECKPOINTS.every(c => reg?.[c.key]);
}