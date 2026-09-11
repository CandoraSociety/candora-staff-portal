export const FUNDERS = [
  { key: 'phac', label: 'PHAC' },
  { key: 'frn', label: 'FRN' },
  { key: 'ecala', label: 'ECALA' },
  { key: 'empoweru', label: 'EmpowerU' },
  { key: 'fcss', label: 'FCSS' },
  { key: 'grants', label: 'Grants' },
];

export const REPORT_KINDS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
  { value: 'final', label: 'Final' },
  { value: 'other', label: 'Other' },
];

export const CONTENT_TYPES = [
  { value: 'financial', label: 'Financial' },
  { value: 'narrative', label: 'Narrative' },
  { value: 'both', label: 'Financial + Narrative' },
  { value: 'other', label: 'Other' },
];

export const DOC_TYPES = [
  { value: 'template', label: 'Template' },
  { value: 'guideline', label: 'Guideline' },
  { value: 'submitted_report', label: 'Submitted Report' },
  { value: 'other', label: 'Other' },
];

export const docTypeLabel = (v) => DOC_TYPES.find(d => d.value === v)?.label || v;
export const reportKindLabel = (v) => REPORT_KINDS.find(d => d.value === v)?.label || v;
export const contentTypeLabel = (v) => CONTENT_TYPES.find(d => d.value === v)?.label || v;