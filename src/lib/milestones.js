import moment from "moment";

// Hours milestones
export const HOUR_MILESTONES = [50, 100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000];

// Years of service milestones (5-year increments)
export const YEAR_MILESTONES = [5, 10, 15, 20, 25, 30];

/**
 * Calculate all milestones a volunteer has reached.
 * Returns array of { type, title, description, milestone_key }
 */
export function calculateMilestones(volunteer) {
  const milestones = [];
  const hours = volunteer.total_hours || 0;
  const startDate = volunteer.start_date ? moment(volunteer.start_date) : null;

  // Hours milestones
  for (const h of HOUR_MILESTONES) {
    if (hours >= h) {
      milestones.push({
        type: "milestone_hours",
        title: `${h} Hours`,
        description: `Reached ${h} volunteer hours`,
        milestone_key: `hours_${h}`,
        value: h,
        icon: "⏱️",
      });
    }
  }

  // Years of service milestones
  if (startDate && startDate.isValid()) {
    const yearsServed = moment().diff(startDate, "years");
    for (const y of YEAR_MILESTONES) {
      if (yearsServed >= y) {
        milestones.push({
          type: "years_of_service",
          title: `${y} Year${y === 1 ? "" : "s"} of Service`,
          description: `${y} year${y === 1 ? "" : "s"} volunteering with Candora`,
          milestone_key: `years_${y}`,
          value: y,
          icon: "🏆",
        });
      }
    }
  }

  return milestones;
}

/**
 * Find milestones that have been reached but NOT yet recorded in recognitions.
 * Returns array of unawarded milestone objects.
 */
export function getUnawardedMilestones(volunteer, existingRecognitions) {
  const reached = calculateMilestones(volunteer);
  const awardedKeys = new Set(
    existingRecognitions
      .filter((r) => r.milestone_key)
      .map((r) => r.milestone_key)
  );
  return reached.filter((m) => !awardedKeys.has(m.milestone_key));
}

/**
 * Get the NEXT upcoming milestone for a volunteer (the first unawarded one).
 */
export function getNextMilestone(volunteer, existingRecognitions) {
  const unawarded = getUnawardedMilestones(volunteer, existingRecognitions);
  if (unawarded.length === 0) return null;
  return unawarded[unawarded.length - 1]; // most recent unawarded
}