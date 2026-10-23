export const TRAINING_NAV_GROUPS = [
  { title: "Getting started", keys: ["dashboard", "dashboard_widgets"] },
  { title: "Time & Money", keys: ["staffadmin", "staffadmin_money", "staffadmin_supervisor"] },
  { title: "Program portals", keys: ["pathways", "rc", "ell", "centralreg"] },
];

// Section boundaries follow step titles, so inserting a slide keeps jump indices accurate.
const SECTION_STARTS = {
  dashboard: {
    "Welcome to your Candora portal": "Getting started",
    "What's a portal?": "Portals & navigation",
    "Notifications and approvals": "Dashboard & customization",
    "Set up your e-signature — protect it first": "E-signature",
    "Connect your Outlook account": "Outlook & Teams",
    "Time to practice": "Practice",
  },
  dashboard_widgets: {
    "Your home page, your widgets": "Choosing widgets",
    "The Personal Organizer": "Widget walkthrough",
    "Time to practice": "Practice",
  },
  staffadmin: {
    "Welcome to Part 2": "Overview",
    "Booking time off": "Vacation & time off",
    "Sick time and personal days": "Sick & personal days",
    "Submitting your timesheet": "Timesheets",
    "The team schedule": "Team schedule",
    "Where approvals and payments show up": "Updates & practice",
  },
  staffadmin_money: {
    "Welcome to Receipts & Reimbursements": "Overview",
    "Start with Add Receipt Entry": "Reimbursements",
    "Now the Candora MasterCard": "MasterCard receipts",
    "Where approvals and payments show up": "Updates & practice",
  },
  staffadmin_supervisor: {
    "Welcome to the supervisor add-on": "Overview",
    "Where approvals arrive": "Reviewing requests",
    "Check coverage before you decide": "Coverage & follow-up",
    "Time to practice": "Practice",
  },
  pathways: {
    "Welcome to Pathways": "Overview & caseload",
    "The dashboard tabs": "Dashboard tabs & sections",
    "The Master List": "Client files & the client journey",
    "Intake — adding a client": "Tasks & requests",
    "Time to practice": "Practice",
  },
  rc: {
    "Welcome to the Resource Centre": "Overview",
    "Clients — the central database": "Client files & intake",
    "Referrals": "Referrals & case management",
    "Time to practice": "Practice",
  },
  ell: {
    "Welcome to the ELL portal": "Overview",
    "Learners": "Learners & classes",
    "The waitlist": "Waitlist & assessments",
    "Time to practice": "Practice",
  },
  centralreg: {
    "Welcome to Central Registration": "Overview",
    "Programs": "Programs & registration",
    "Self-registration requests": "Self-registration & calendar",
    "Time to practice": "Practice",
  },
};

export function getTrainingStepSections(module) {
  const starts = SECTION_STARTS[module.key] || {};
  return module.steps.reduce((sections, step, index) => {
    const title = starts[step.title];
    if (title || !sections.length) sections.push({ title: title || "Guided tour", steps: [] });
    sections[sections.length - 1].steps.push({ title: step.title, index });
    return sections;
  }, []);
}