export const MODULE_CATEGORIES = [
  { value: "onboarding", label: "Onboarding", color: "bg-blue-100 text-blue-700", icon: "UserPlus" },
  { value: "compliance", label: "Compliance", color: "bg-red-100 text-red-700", icon: "ShieldCheck" },
  { value: "role_specific", label: "Role-Specific", color: "bg-purple-100 text-purple-700", icon: "Briefcase" },
  { value: "soft_skills", label: "Soft Skills", color: "bg-pink-100 text-pink-700", icon: "HeartHandshake" },
  { value: "technical", label: "Technical", color: "bg-cyan-100 text-cyan-700", icon: "Cpu" },
  { value: "safety", label: "Safety", color: "bg-orange-100 text-orange-700", icon: "HardHat" },
  { value: "wellness", label: "Wellness", color: "bg-green-100 text-green-700", icon: "HeartPulse" },
  { value: "volunteer", label: "Volunteer", color: "bg-amber-100 text-amber-700", icon: "HandHeart" },
  { value: "other", label: "Other", color: "bg-slate-100 text-slate-700", icon: "BookOpen" },
];

export const CONTENT_TYPES = [
  { value: "rich_text", label: "Rich Text", icon: "FileText" },
  { value: "presentation", label: "Presentation", icon: "Presentation" },
  { value: "video", label: "Video", icon: "Video" },
  { value: "document", label: "Document", icon: "File" },
  { value: "interactive", label: "Interactive", icon: "MousePointerClick" },
  { value: "quiz", label: "Quiz", icon: "HelpCircle" },
  { value: "mixed", label: "Mixed Media", icon: "Layers" },
];

export const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner", color: "text-green-600" },
  { value: "intermediate", label: "Intermediate", color: "text-blue-600" },
  { value: "advanced", label: "Advanced", color: "text-red-600" },
  { value: "all_levels", label: "All Levels", color: "text-slate-600" },
];

export const MODULE_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  { value: "review", label: "In Review", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  { value: "published", label: "Published", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  { value: "archived", label: "Archived", color: "bg-zinc-100 text-zinc-500", dot: "bg-zinc-400" },
];

export const PROGRAM_CATEGORIES = [
  { value: "onboarding", label: "Onboarding", color: "bg-blue-100 text-blue-700" },
  { value: "compliance", label: "Compliance", color: "bg-red-100 text-red-700" },
  { value: "role_specific", label: "Role-Specific", color: "bg-purple-100 text-purple-700" },
  { value: "professional_development", label: "Professional Development", color: "bg-indigo-100 text-indigo-700" },
  { value: "orientation", label: "Orientation", color: "bg-teal-100 text-teal-700" },
  { value: "volunteer_training", label: "Volunteer Training", color: "bg-amber-100 text-amber-700" },
  { value: "safety", label: "Safety", color: "bg-orange-100 text-orange-700" },
  { value: "other", label: "Other", color: "bg-slate-100 text-slate-700" },
];

export const PROGRAM_STATUSES = MODULE_STATUSES;

export function getModuleCategory(value) {
  return MODULE_CATEGORIES.find(c => c.value === value) || MODULE_CATEGORIES[MODULE_CATEGORIES.length - 1];
}
export function getContentType(value) {
  return CONTENT_TYPES.find(c => c.value === value) || CONTENT_TYPES[0];
}
export function getDifficulty(value) {
  return DIFFICULTY_LEVELS.find(d => d.value === value) || DIFFICULTY_LEVELS[0];
}
export function getModuleStatus(value) {
  return MODULE_STATUSES.find(s => s.value === value) || MODULE_STATUSES[0];
}
export function getProgramCategory(value) {
  return PROGRAM_CATEGORIES.find(c => c.value === value) || PROGRAM_CATEGORIES[PROGRAM_CATEGORIES.length - 1];
}
export function getProgramStatus(value) {
  return PROGRAM_STATUSES.find(s => s.value === value) || PROGRAM_STATUSES[0];
}