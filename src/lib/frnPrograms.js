import { PROGRAM_LABELS } from '@/lib/frnConstants';

export const FRN_PROGRAM_CATEGORY_OPTIONS = [
  { value: 'parenting', label: 'Parenting' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'social_support', label: 'Social Support' },
  { value: 'family_support', label: 'Family Support' },
  { value: 'other', label: 'Other' },
];

export const FRN_PROGRAM_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: '#22c55e' },
  { value: 'paused', label: 'Paused', color: '#f59e0b' },
  { value: 'completed', label: 'Completed', color: '#64748b' },
];

export const FRN_PROGRAM_CATEGORY_LABELS = Object.fromEntries(FRN_PROGRAM_CATEGORY_OPTIONS.map(c => [c.value, c.label]));

// A referral's program name: the name picked on the form, or the label for the
// original program value on referrals created before programs were editable.
export const referralProgramName = (referral) =>
  referral?.program_name || PROGRAM_LABELS[referral?.program] || '';

export const referralIsInProgram = (referral, program) => {
  if (!program?.name || !referral) return false;
  const name = referralProgramName(referral);
  return name.toLowerCase() === program.name.trim().toLowerCase();
};

const ENROLLED_STATUSES = ['accepted', 'enrolled', 'completed'];

export const enrolledReferralsForProgram = (referrals = [], program) =>
  referrals.filter(r => referralIsInProgram(r, program) && ENROLLED_STATUSES.includes(r.status));

export { sessionOccurrenceDates, todayISO } from '@/lib/sessionOccurrences';