import moment from 'moment';

export function calculateMilestones(employee, timeLogs, recognitions) {
  const milestones = [];
  const employeeId = employee.id;

  // Calculate total hours
  const totalHours = timeLogs
    .filter(log => log.employee_id === employeeId)
    .reduce((sum, log) => sum + (log.total_hours || 0), 0);

  // Update employee total_hours if needed
  if (totalHours !== (employee.total_hours || 0)) {
    // This would be handled by an automation or backend function
  }

  // Check existing recognitions to avoid duplicates
  const awardedKeys = recognitions
    .filter(rec => rec.employee_id === employeeId)
    .map(rec => rec.milestone_key);

  // Hour milestones
  const hourMilestones = [50, 100, 250, 500, 1000];
  hourMilestones.forEach(hours => {
    const key = `milestone_hours_${hours}`;
    if (totalHours >= hours && !awardedKeys.includes(key)) {
      milestones.push({
        type: 'milestone_hours',
        milestone_key: key,
        title: `${hours} Hours Milestone`,
        icon: '⏱️',
        employee_id: employeeId,
      });
    }
  });

  // Years of service milestones
  const hireDate = moment(employee.hire_date);
  if (hireDate.isValid()) {
    const yearsWorked = moment().diff(hireDate, 'years');
    const yearMilestones = [1, 3, 5, 10, 15, 20, 25];
    yearMilestones.forEach(years => {
      const key = `years_of_service_${years}`;
      if (yearsWorked >= years && !awardedKeys.includes(key)) {
        milestones.push({
          type: 'years_of_service',
          milestone_key: key,
          title: `${years} Year${years > 1 ? 's' : ''} of Service`,
          icon: '🎖️',
          employee_id: employeeId,
        });
      }
    });
  }

  return milestones;
}