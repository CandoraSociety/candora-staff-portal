export const PROGRAM_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: '#22c55e' },
  { value: 'paused', label: 'Paused', color: '#f59e0b' },
  { value: 'ended', label: 'Ended', color: '#64748b' },
];

export const PROGRAM_STATUS_LABELS = Object.fromEntries(PROGRAM_STATUS_OPTIONS.map(s => [s.value, s.label]));
export const PROGRAM_STATUS_COLORS = Object.fromEntries(PROGRAM_STATUS_OPTIONS.map(s => [s.value, s.color]));

export const SESSION_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', color: '#3b82f6' },
  { value: 'completed', label: 'Completed', color: '#22c55e' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
];

export const SESSION_STATUS_LABELS = Object.fromEntries(SESSION_STATUS_OPTIONS.map(s => [s.value, s.label]));
export const SESSION_STATUS_COLORS = Object.fromEntries(SESSION_STATUS_OPTIONS.map(s => [s.value, s.color]));

export const WEEKDAY_OPTIONS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export const WEEKDAY_LABELS = Object.fromEntries(WEEKDAY_OPTIONS.map(d => [d.value, d.label]));

export const MONTH_LABELS = {
  1: 'January', 2: 'February', 3: 'March', 4: 'April',
  5: 'May', 6: 'June', 7: 'July', 8: 'August',
  9: 'September', 10: 'October', 11: 'November', 12: 'December',
};

// PHAC programs do not run in July (7) or August (8)
export const OFF_SEASON_MONTHS = [7, 8];

export function isOffSeason(date) {
  const month = new Date(date).getMonth() + 1;
  return OFF_SEASON_MONTHS.includes(month);
}

export function formatAgeRange(minMonths, maxMonths) {
  if (!minMonths && !maxMonths) return '0–6 years';
  const fmt = (months) => {
    if (!months && months !== 0) return '';
    if (months < 12) return `${months}mo`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem === 0 ? `${years}yr` : `${years}yr ${rem}mo`;
  };
  return `${fmt(minMonths)} – ${fmt(maxMonths)}`;
}