// Single source of truth for Employment Action Plan items — shared by the
// counsellor's plan builder and the service navigator's suggestions.
export const ACTION_PLAN_ITEMS = [
  { key: 'job_search_workshop',          label: 'Job Search Workshop',          category: 'Workshops' },
  { key: 'resume_writing_workshop',      label: 'Resume Writing Workshop',       category: 'Workshops' },
  { key: 'interview_skills_workshop',    label: 'Interview Skills Workshop',     category: 'Workshops' },
  { key: 'workplace_readiness_workshop', label: 'Workplace Readiness Workshop',  category: 'Workshops' },
  { key: 'financial_literacy_workshop',  label: 'Financial Literacy Workshop',   category: 'Workshops' },
  { key: 'skills_assessment',            label: 'Skills Assessment',             category: 'Programs' },
  { key: 'internal_placement',           label: 'Internal Placement',            category: 'Placement/Training', pathwaysOnly: true },
  { key: 'exposure_course',              label: 'Exposure Course',               category: 'Placement/Training' },
  { key: 'paid_external_placement',      label: 'Work Exposure Placement',       category: 'Placement/Training', notDEA: true },
  { key: 'employment_supports',          label: 'Employment Supports',           category: 'Supports' },
  { key: 'one_on_one_counselling',       label: 'One on One Career Counselling', category: 'Supports' },
  { key: 'job_applications',             label: 'Job Applications',              category: 'Job Search' },
  { key: 'networking',                   label: 'Networking',                    category: 'Job Search' },
  { key: 'other',                        label: 'Other',                         category: 'Other' },
];

export const ACTION_PLAN_CATEGORIES = ['Workshops', 'Programs', 'Placement/Training', 'Job Search', 'Supports', 'Other'];

// Items offered for a client's stream — DEA clients are not offered Pathways-only
// items, and non-Pathways clients are not offered internal placements.
export function getAvailablePlanItems(serviceType) {
  const isDEA = serviceType === 'direct_to_employment';
  const isPathways = serviceType === 'pathways';
  return ACTION_PLAN_ITEMS.filter(item => {
    if (isDEA && item.notDEA) return false;
    if (isDEA && item.pathwaysOnly) return false;
    if (!isPathways && item.pathwaysOnly) return false;
    return true;
  });
}

export function planItemLabel(key) {
  return ACTION_PLAN_ITEMS.find(i => i.key === key)?.label || key;
}