export const isOnsite = () =>
  new URLSearchParams(window.location.search).get('location') === 'onsite';

export const locationType = () => (isOnsite() ? 'onsite' : 'offsite');

export const STATUS_OPTIONS = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'phone_screen', label: 'Phone Screen' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export const STATUS_LABELS = STATUS_OPTIONS.reduce((acc, s) => ({ ...acc, [s.value]: s.label }), {});

export const STATUS_STYLES = {
  saved: 'bg-jl-muted text-jl-muted-fg',
  applied: 'bg-jl-primary/10 text-jl-primary',
  phone_screen: 'bg-jl-purple/10 text-jl-purple',
  interview: 'bg-jl-accent/15 text-jl-accent',
  offer: 'bg-jl-success/10 text-jl-success',
  rejected: 'bg-red-50 text-red-600',
  withdrawn: 'bg-slate-100 text-slate-500',
};

export const HOW_TO_APPLY_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'email', label: 'Email' },
  { value: 'in_person', label: 'In Person' },
  { value: 'phone', label: 'Phone' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'other', label: 'Other' },
];

export const TEMPLATE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'modern', label: 'Modern' },
  { value: 'creative', label: 'Creative' },
  { value: 'simple', label: 'Simple' },
];

export const DEGREE_OPTIONS = [
  'Some High School',
  'High School Diploma / GED',
  'Some College / CEGEP',
  'College Diploma',
  'College Certificate',
  "Apprenticeship / Trades Certificate",
  "Bachelor's Degree",
  'Post-Graduate Diploma',
  "Master's Degree",
  'Doctoral Degree (PhD)',
  'Professional Degree (MD, JD, etc.)',
  'Other',
];

export const isPast = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(`${dateStr}T23:59:59`);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
};