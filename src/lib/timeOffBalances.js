/**
 * Time-off balances are derived, not stored: the employee file holds the
 * starting balances (set manually in the HR portal) and the vacation accrual
 * percentage; approved timesheets then accrue vacation (hours worked x
 * percentage) and draw down vacation / sick / personal as paid leave is taken.
 */
export function computeTimeOffBalances(employee, approvedTimesheets = []) {
  const pct = Number(employee?.vacation_percentage) || 0;
  let accrued = 0;
  let usedVacation = 0, usedSick = 0, usedPersonal = 0;
  for (const t of approvedTimesheets) {
    // Vacation accumulates as the employee works more hours
    accrued += ((Number(t.total_regular_hours) || 0) + (Number(t.total_additional_hours) || 0)) * pct / 100;
    usedVacation += Number(t.total_vacation_hours) || 0;
    usedSick += Number(t.total_sick_hours) || 0;
    usedPersonal += Number(t.total_personal_hours) || 0;
    // Timesheets submitted before the leave columns were split only have the
    // combined paid-leave total — count it against sick (old column was 'sick etc').
    if (t.total_vacation_hours == null && t.total_sick_hours == null && t.total_personal_hours == null) {
      usedSick += Number(t.total_paid_leave_hours) || 0;
    }
  }
  const round = v => Math.round(v * 100) / 100;
  return {
    vacation: round((Number(employee?.vacation_hours_start) || 0) + accrued - usedVacation),
    sick: round((Number(employee?.sick_hours_start) || 0) - usedSick),
    personal: round((Number(employee?.personal_hours_start) || 0) - usedPersonal),
  };
}