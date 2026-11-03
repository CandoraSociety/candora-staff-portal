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

// Session dates: the base date plus every recurrence, up to the repeat-until
// date (or 26 occurrences), optionally stopping at today.
export const sessionOccurrenceDates = (session, { untilToday = true } = {}) => {
  if (!session?.session_date) return [];
  const [y, m, d] = session.session_date.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const pattern = session.recurrence_pattern || 'none';
  const stepDays = pattern === 'weekly' ? 7 : pattern === 'biweekly' ? 14 : 0;
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const end = session.recurrence_end_date ? (() => {
    const [ey, em, ed] = session.recurrence_end_date.split('-').map(Number);
    return new Date(ey, em - 1, ed);
  })() : null;

  const dates = [];
  const max = pattern === 'none' ? 1 : 26;
  for (let i = 0; i < max; i += 1) {
    const next = new Date(start);
    if (pattern === 'monthly') next.setMonth(start.getMonth() + i);
    else if (stepDays) next.setDate(start.getDate() + stepDays * i);
    if (end && next > end) break;
    if (untilToday && next > today) break;
    dates.push(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`);
  }
  return dates.length ? dates : [session.session_date];
};

export const todayISO = () => new Date().toISOString().split('T')[0];