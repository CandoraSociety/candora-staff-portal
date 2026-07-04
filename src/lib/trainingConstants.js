export const PLAN_TYPES = [
  { value: "onboarding", label: "Onboarding", color: "bg-blue-100 text-blue-700", icon: "UserPlus" },
  { value: "lateral_move", label: "Lateral Move", color: "bg-purple-100 text-purple-700", icon: "ArrowLeftRight" },
  { value: "new_hire", label: "New Hire", color: "bg-green-100 text-green-700", icon: "UserCheck" },
  { value: "training", label: "Training", color: "bg-amber-100 text-amber-700", icon: "GraduationCap" },
  { value: "role_transition", label: "Role Transition", color: "bg-indigo-100 text-indigo-700", icon: "TrendingUp" },
];

export const PLAN_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-700" },
  { value: "planning", label: "Planning", color: "bg-blue-100 text-blue-700" },
  { value: "in_progress", label: "In Progress", color: "bg-amber-100 text-amber-700" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700" },
  { value: "on_hold", label: "On Hold", color: "bg-red-100 text-red-700" },
];

export const PHASES = [
  { value: "pre_start", label: "Pre-Start", color: "bg-slate-100 text-slate-700", border: "border-slate-300" },
  { value: "first_day", label: "First Day", color: "bg-amber-100 text-amber-700", border: "border-amber-300" },
  { value: "first_week", label: "First Week", color: "bg-blue-100 text-blue-700", border: "border-blue-300" },
  { value: "first_month", label: "First Month", color: "bg-purple-100 text-purple-700", border: "border-purple-300" },
  { value: "ongoing", label: "Ongoing", color: "bg-green-100 text-green-700", border: "border-green-300" },
];

export const ITEM_TYPES = [
  { value: "meeting", label: "Meeting", icon: "Users", color: "text-blue-600" },
  { value: "training", label: "Training", icon: "GraduationCap", color: "text-amber-600" },
  { value: "task", label: "Task", icon: "CheckSquare", color: "text-slate-600" },
  { value: "introduction", label: "Introduction", icon: "Handshake", color: "text-green-600" },
  { value: "review", label: "Review", icon: "ClipboardCheck", color: "text-purple-600" },
  { value: "setup", label: "Setup", icon: "Settings", color: "text-indigo-600" },
  { value: "shadowing", label: "Shadowing", icon: "Eye", color: "text-teal-600" },
  { value: "assessment", label: "Assessment", icon: "FileCheck", color: "text-rose-600" },
];

export const ITEM_STATUSES = [
  { value: "not_started", label: "Not Started", color: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  { value: "skipped", label: "Skipped", color: "bg-zinc-100 text-zinc-500", dot: "bg-zinc-400" },
];

export function getPlanType(value) {
  return PLAN_TYPES.find(t => t.value === value) || PLAN_TYPES[0];
}

export function getPlanStatus(value) {
  return PLAN_STATUSES.find(s => s.value === value) || PLAN_STATUSES[0];
}

export function getPhase(value) {
  return PHASES.find(p => p.value === value) || PHASES[1];
}

export function getItemType(value) {
  return ITEM_TYPES.find(t => t.value === value) || ITEM_TYPES[2];
}

export function getItemStatus(value) {
  return ITEM_STATUSES.find(s => s.value === value) || ITEM_STATUSES[0];
}