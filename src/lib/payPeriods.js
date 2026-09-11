// Candora pay periods: 2 weeks (14 days) long, ending on a Friday.
// Anchor: the pay period ending Friday, September 18, 2026.
//
// Submission rule (applies in perpetuity): a timesheet submitted on the
// period's end day, or by the following Wednesday, belongs to that period.
// After that, the submission rolls to the next (current) period.
const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_MS = 14 * DAY_MS;
const ANCHOR_END_UTC = Date.UTC(2026, 8, 18); // 2026-09-18
const GRACE_DAYS = 5; // end day + 5 days = the following Wednesday

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dateToUtcDay(date) {
  if (date instanceof Date) {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }
  // 'YYYY-MM-DD' string
  return Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)));
}

// Returns { start, end } in UTC-day (ms) values for the pay period a submission
// made on `date` belongs to.
export function getPayPeriod(date = new Date()) {
  const day = dateToUtcDay(date);
  // Most recent period end on or before this day
  let end = ANCHOR_END_UTC + Math.floor((day - ANCHOR_END_UTC) / PERIOD_MS) * PERIOD_MS;
  // Within 5 days after that period ended -> it belongs to that period.
  // Past the grace window -> the submission is for the next period.
  if (day > end + GRACE_DAYS * DAY_MS) end += PERIOD_MS;
  return { start: end - 13 * DAY_MS, end };
}

export function ymd(utcDay) {
  return new Date(utcDay).toISOString().slice(0, 10);
}

// The 14 days of a pay period with day-of-week labels
export function getPeriodDays(period) {
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = period.start + i * DAY_MS;
    days.push({ date: ymd(d), dayLabel: DAY_NAMES[new Date(d).getUTCDay()] });
  }
  return days;
}

export function formatShort(utcDay) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', month: 'short', day: 'numeric' }).format(new Date(utcDay));
}

export function periodLabel(period) {
  const year = new Date(period.end).getUTCFullYear();
  return `${formatShort(period.start)} – ${formatShort(period.end)}, ${year}`;
}