// ── Visual categories for the "What we've learned" recap ──────────────────
// Each recap's takeaways are grouped into named sections so the wrap-up reads
// as a few labelled idea groups instead of one flat list. `points` are indexes
// into the recap's `takeaways` array (nothing is duplicated here).
// tone: gold | blue | green
export const RECAP_SECTIONS = {
  dashboard: [
    { label: 'Simulated vs real', tone: 'gold', points: [0] },
    { label: 'Getting around', tone: 'blue', points: [1, 2] },
    { label: 'Widgets, files & Microsoft', tone: 'green', points: [3, 4] },
  ],
  dashboard_widgets: [
    { label: 'The widget rules', tone: 'gold', points: [0, 1] },
    { label: 'Your own space', tone: 'blue', points: [2, 4] },
    { label: 'Getting answers', tone: 'green', points: [3] },
  ],
  staffadmin: [
    { label: 'Time off', tone: 'gold', points: [0, 2] },
    { label: 'Your timesheet', tone: 'blue', points: [1, 3] },
    { label: 'Planning coverage', tone: 'green', points: [4] },
  ],
  staffadmin_money: [
    { label: 'Starting a claim', tone: 'gold', points: [0, 1] },
    { label: 'The fields that matter', tone: 'blue', points: [2, 3] },
    { label: 'Submitting', tone: 'green', points: [4] },
  ],
  staffadmin_supervisor: [
    { label: 'Where the work arrives', tone: 'gold', points: [0] },
    { label: 'What each approval does', tone: 'blue', points: [1, 2, 3] },
    { label: 'Before you decide', tone: 'green', points: [4] },
  ],
  pathways: [
    { label: 'Your day', tone: 'gold', points: [0, 1] },
    { label: 'Your caseload', tone: 'blue', points: [2] },
    { label: 'Every client', tone: 'green', points: [3, 4] },
  ],
  pathways_journey: [
    { label: 'Step one', tone: 'gold', points: [0] },
    { label: 'The assessment', tone: 'blue', points: [1, 2] },
    { label: 'Determination & plan', tone: 'green', points: [3, 4] },
  ],
  pathways_journey_part2: [
    { label: 'Three roads', tone: 'gold', points: [0] },
    { label: 'Tracking the journey', tone: 'blue', points: [1, 2, 3] },
    { label: 'Where they all end', tone: 'green', points: [4] },
  ],
  rc: [
    { label: 'The one record', tone: 'gold', points: [0, 1] },
    { label: 'Read this first', tone: 'blue', points: [2] },
    { label: 'Keeping it clean', tone: 'green', points: [3, 4] },
  ],
  ell: [
    { label: 'The people', tone: 'gold', points: [0, 3] },
    { label: 'The program', tone: 'blue', points: [1, 2] },
    { label: 'Measuring progress', tone: 'green', points: [4] },
  ],
  centralreg: [
    { label: 'The overview', tone: 'gold', points: [0, 1] },
    { label: 'Handling a registration', tone: 'blue', points: [2, 3] },
    { label: 'Coming in from outside', tone: 'green', points: [4] },
  ],
  pathways_assessment: [
    { label: 'Before the barriers', tone: 'gold', points: [0, 1] },
    { label: 'Recording the work', tone: 'blue', points: [2, 3] },
    { label: 'Finishing the assessment', tone: 'green', points: [4] },
  ],
  pathways_service_nav: [
    { label: 'Who owns the barriers', tone: 'gold', points: [0, 1] },
    { label: 'Closing one', tone: 'blue', points: [2, 3] },
    { label: 'Widening the circle', tone: 'green', points: [4] },
  ],
  pathways_workshops: [
    { label: 'Finding them', tone: 'gold', points: [0, 2] },
    { label: 'Running one', tone: 'blue', points: [1, 3] },
    { label: 'What it changes', tone: 'green', points: [4] },
  ],
};

// Sections for a module, falling back to one group holding every takeaway.
export const getRecapSections = (moduleKey, recap) => {
  const takeaways = recap?.takeaways || [];
  const sections = RECAP_SECTIONS[moduleKey];
  if (sections?.length) return sections;
  return takeaways.length ? [{ label: 'Key points', tone: 'gold', points: takeaways.map((_, index) => index) }] : [];
};