// What the staff screens show for a program. The status itself is worked out on
// the server from the intake dates and the seats taken; this is only how it reads
// and how it is coloured in Website Studio.
export const PROGRAM_STATUSES = [
  { value: 'drop_in', label: 'Drop-in', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'rolling_intake', label: 'Rolling intake', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'registration_opening_soon', label: 'Registration opening soon', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'registration_open', label: 'Registration open', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'waitlist_only', label: 'Waitlist only', tone: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'full', label: 'Full', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'closed', label: 'Closed', tone: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'finished', label: 'Finished', tone: 'bg-slate-100 text-slate-500 border-slate-200' },
];

export const PROGRAM_CATEGORIES = [
  { value: 'adult_learning', label: 'Adult Learning' },
  { value: 'family_community', label: 'Family & Community' },
  { value: 'employment', label: 'Employment' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'other', label: 'Other' },
];

export const REGISTRATION_STATUSES = [
  { value: 'pending_approval', label: 'Pending approval', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'confirmed', label: 'Confirmed', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'waitlisted', label: 'Waitlisted', tone: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'declined', label: 'Declined', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'cancelled', label: 'Cancelled', tone: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'attended', label: 'Attended', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'no_show', label: 'No show', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export const APPLICATION_STATUSES = [
  { value: 'submitted', label: 'Submitted', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'in_review', label: 'In review', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'approved', label: 'Approved', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'declined', label: 'Declined', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'waitlisted', label: 'Waitlisted', tone: 'bg-violet-50 text-violet-700 border-violet-200' },
];

const find = (list, value) => list.find((item) => item.value === value);

export const statusMeta = (value) =>
  find(PROGRAM_STATUSES, value) || { value, label: 'Registration open', tone: 'bg-slate-100 text-slate-600 border-slate-200' };

export const categoryLabel = (value) =>
  (find(PROGRAM_CATEGORIES, value) || { label: 'Other' }).label;

export const registrationMeta = (value) =>
  find(REGISTRATION_STATUSES, value) || { value, label: value || 'Unknown', tone: 'bg-slate-100 text-slate-600 border-slate-200' };

export const applicationMeta = (value) =>
  find(APPLICATION_STATUSES, value) || { value, label: value || 'Unknown', tone: 'bg-slate-100 text-slate-600 border-slate-200' };

// The same order of decisions the server makes, so the list shows the status the
// website is showing. The server remains the authority for who actually gets a seat.
export const computeProgramStatus = (program, seatsTaken = 0) => {
  if (!program) return 'closed';
  if (program.status_locked) return program.status || 'registration_open';
  if (program.status === 'closed' || program.status === 'finished') return program.status;

  const end = program.end_date ? new Date(`${String(program.end_date).slice(0, 10)}T23:59:59`).getTime() : null;
  if (end && Date.now() > end) return 'finished';

  if (program.registration_required === false || program.registration_mode === 'none') return 'drop_in';

  const opens = program.intake_opens ? new Date(`${String(program.intake_opens).slice(0, 10)}T00:00:00`).getTime() : null;
  if (opens && Date.now() < opens) return 'registration_opening_soon';

  const closes = program.intake_closes ? new Date(`${String(program.intake_closes).slice(0, 10)}T23:59:59`).getTime() : null;
  if (closes && Date.now() > closes) return 'closed';

  const capacity = Number(program.capacity) || 0;
  if (capacity > 0 && Number(seatsTaken) >= capacity) {
    return program.waitlist_enabled ? 'waitlist_only' : 'full';
  }
  if (program.registration_mode === 'waitlist') return 'waitlist_only';
  if (program.status === 'rolling_intake') return 'rolling_intake';
  return 'registration_open';
};

export const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70);

export const formatWhen = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};