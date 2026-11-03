// Shared session helpers used by both the FRN and PHAC portals.

export const todayISO = () => new Date().toISOString().split('T')[0];

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