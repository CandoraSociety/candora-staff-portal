// Cafe Candeur hours helpers.
// The cafe runs 8:00 AM to 4:00 PM; shift times are the default, and each
// person's hours can be adjusted on the shift before they are submitted.
export const CAFE_START = '08:00';
export const CAFE_END = '16:00';

const toMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};

export function hoursBetween(start, end, breakHours = 0) {
  if (!start || !end) return 0;
  let mins = toMinutes(end) - toMinutes(start);
  if (mins < 0) mins += 24 * 60;
  const hours = mins / 60 - (Number(breakHours) || 0);
  return Math.max(0, Math.round(hours * 100) / 100);
}

// A fresh hours row for one person on a shift
export function newHoursRow(employee, date) {
  return {
    employee_id: employee.id,
    employee_name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim(),
    date,
    start_time: CAFE_START,
    end_time: CAFE_END,
    break_hours: 0,
    hours: hoursBetween(CAFE_START, CAFE_END, 0),
    submitted: false,
  };
}

// The hours rows for a shift: keep what was logged, and give anyone newly
// assigned (or assigned before hours were tracked) the cafe's standard hours.
export function hoursRowsFor(shift, employees) {
  const date = (shift.start_datetime || '').slice(0, 10);
  return (shift.assigned_staff || []).map((id) => {
    const existing = (shift.staff_hours || []).find((h) => h.employee_id === id && h.date === date);
    if (existing) return existing;
    const emp = employees.find((e) => e.id === id);
    return emp ? newHoursRow(emp, date) : null;
  }).filter(Boolean);
}