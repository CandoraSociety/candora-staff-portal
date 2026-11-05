// Shared vocabulary for Pathways internal placements that land in Food Services.
// The records live in the InternalTraining entity; these helpers keep the card,
// the dialog and the page reading them the same way.

export const FOOD_PLACEMENT_TYPES = {
  food_services_onsite: { label: 'Food Services — On site', short: 'On site' },
  food_services_offsite: { label: 'Food Services — Off site', short: 'Off site' },
};

export const FOOD_PLACEMENT_TYPE_KEYS = Object.keys(FOOD_PLACEMENT_TYPES);

// The four checkpoints a placement passes through, in order.
export const PLACEMENT_CHECKPOINTS = [
  { key: 'orientation', label: 'Orientation', doneKey: 'orientation_completed', dateKey: 'orientation_date' },
  { key: 'health_safety', label: 'Health & Safety', doneKey: 'health_safety_completed', dateKey: 'health_safety_date' },
  { key: 'midpoint', label: 'Midpoint check-in', doneKey: 'midpoint_checkin_completed', dateKey: 'midpoint_checkin_date' },
  { key: 'completion', label: 'Program completion', doneKey: 'program_completion_completed', dateKey: 'program_completion_date' },
];

export const PLACEMENT_STATUSES = ['referred', 'active', 'completed', 'withdrawn', 'cancelled'];

export const PLACEMENT_STATUS_STYLES = {
  referred: 'bg-blue-100 text-blue-700 border-blue-200',
  active: 'bg-green-100 text-green-700 border-green-200',
  completed: 'bg-slate-100 text-slate-700 border-slate-200',
  withdrawn: 'bg-amber-100 text-amber-700 border-amber-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export const EVALUATION_RATINGS = ['excellent', 'good', 'satisfactory', 'needs_improvement', 'unsatisfactory'];

export const EVALUATION_FIELDS = [
  { key: 'evaluation_reliability', label: 'Reliability' },
  { key: 'evaluation_attitude', label: 'Attitude' },
  { key: 'evaluation_skill_development', label: 'Skill development' },
  { key: 'evaluation_teamwork', label: 'Teamwork' },
  { key: 'evaluation_communication', label: 'Communication' },
];

export const WOULD_HIRE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'yes_with_conditions', label: 'Yes, with conditions' },
  { value: 'no', label: 'No' },
  { value: 'not_applicable', label: 'Not applicable' },
];

export const checkpointsDone = (placement) =>
  PLACEMENT_CHECKPOINTS.filter((c) => placement?.[c.doneKey]).length;

export const formatPlacementDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
};