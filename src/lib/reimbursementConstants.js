export const PROGRAM_OPTIONS = [
  { value: 'phac', label: 'PHAC' },
  { value: 'frn', label: 'FRN' },
  { value: 'food_services', label: 'Candora Food Services' },
  { value: 'kids_gift_shop', label: 'Kids Gift Shop' },
  { value: 'pathways', label: 'Pathways' },
  { value: 'ell', label: 'ELL' },
  { value: 'empoweru', label: 'EmpowerU' },
  { value: 'admin', label: 'Admin' },
  { value: 'fcss', label: 'FCSS' },
  { value: 'community_lunch', label: 'Community Lunch' },
  { value: 'other', label: 'Other' },
];

export const programLabel = (entry) => {
  const p = entry?.program;
  if (!p) return '—';
  const opt = PROGRAM_OPTIONS.find(o => o.value === p);
  if (p === 'other') return entry.program_other ? `Other: ${entry.program_other}` : 'Other';
  return opt ? opt.label : p;
};