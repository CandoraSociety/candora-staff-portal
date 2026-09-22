/**
 * Parse a "YYYY-MM-DD" date-only string as LOCAL midnight.
 * Native `new Date("2026-07-05")` parses as UTC midnight, which causes
 * off-by-one errors when compared against `new Date()` in negative-UTC
 * timezones (e.g. evening in Edmonton rolls to the next day in UTC).
 */
export function parseDateLocal(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Today's date at LOCAL midnight — use as the "now" reference for
 * day-level comparisons (overdue, days-until-due, etc.).
 */
/**
 * Parse a date string that may be date-only ("YYYY-MM-DD") OR a full datetime.
 * Date-only strings parse as LOCAL midnight (never UTC) so display and
 * comparisons never shift by a day in negative-UTC timezones like Edmonton.
 */
export function parseDateSmart(dateStr) {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return parseDateLocal(dateStr);
  const d = new Date(dateStr);
  return isNaN(d) ? null : d;
}

export function startOfTodayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Whole-day difference between a due date and today, accounting for
 * the user's local timezone. Positive = days until due, negative = overdue.
 */
export function daysUntilDueLocal(dueDateStr) {
  const due = parseDateLocal(dueDateStr);
  if (!due) return null;
  const today = startOfTodayLocal();
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}