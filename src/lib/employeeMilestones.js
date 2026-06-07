import { useMemo } from 'react';
import moment from 'moment';

export function calculateMilestones(employee, timeLogs = []) {
  const milestones = [];
  const now = moment();
  
  // Years of service milestones (5, 10, 15, 20, 25+)
  if (employee.hire_date) {
    const hireDate = moment(employee.hire_date);
    const yearsOfService = now.diff(hireDate, 'years', true);
    
    if (yearsOfService >= 5) {
      const milestoneYears = [5, 10, 15, 20, 25];
      milestoneYears.forEach(year => {
        if (yearsOfService >= year) {
          milestones.push({
            milestone_key: `${year}_years`,
            title: `${year} Year${year > 1 ? 's' : ''} of Service`,
            icon: '🏆',
            type: 'years_of_service',
            achieved: true
          });
        }
      });
    }
  }
  
  // Hours milestones (50, 100, 250, 500, 750, 1000+)
  const totalHours = timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
  
  if (totalHours > 0) {
    const hourMilestones = [50, 100, 250, 500, 750, 1000];
    hourMilestones.forEach(hours => {
      if (totalHours >= hours) {
        milestones.push({
          milestone_key: `${hours}_hours`,
          title: `${hours} Hours Milestone`,
          icon: '⏱️',
          type: 'milestone_hours',
          achieved: true
        });
      }
    });
  }
  
  return milestones;
}

export function getPendingMilestones(employee, timeLogs = [], awardedRecognitions = []) {
  const allMilestones = calculateMilestones(employee, timeLogs);
  const awardedKeys = new Set(awardedRecognitions.filter(r => r.milestone_key).map(r => r.milestone_key));
  
  return allMilestones.filter(m => !awardedKeys.has(m.milestone_key));
}