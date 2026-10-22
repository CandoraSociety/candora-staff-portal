// ── Candora Staff Portal training content ─────────────────────────────────
// Each module = a guided spotlight tour (steps) + a hands-on practice
// checklist (tasks). Training always runs on top of Test Mode, so learners
// use the real app on simulated data — nothing they create touches live
// records, and their progress is tracked per user in TrainingProgress.
//
// step: { title, body, path?, target? }
//   path   → the tour navigates to this route first (within the portal)
//   target → { selector: "css" } or { text: "label" }: element to spotlight.
//            If it can't be found the step shows as a centered card, so a
//            tour never breaks if the UI shifts.
//
// task: { title, body, path?, verify }
//   verify: { kind: "created", entity: "X" } → auto-checked once a new X
//           record exists in the sandbox (compared against a snapshot taken
//           when the practice checklist first opens).
//           { kind: "self" } → the learner marks it done themselves.

export const TRAINING_MODULES = [
  {
    key: "dashboard",
    title: "Main User Page",
    shortTitle: "Main Page",
    blurb: "Your home base: announcements, portal shortcuts, to-dos and notifications.",
    path: "/",
    steps: [
      {
        title: "Welcome to your Candora portal",
        body: "This training runs in Training Mode: every record you see and touch is simulated demo data, so explore freely — nothing you change affects real client or staff information. This main page is your home base every time you sign in."
      },
      {
        title: "Announcements",
        body: "Organization-wide announcements from admin scroll across this ribbon. Hover over it to pause and read the full message — new ones appear here first.",
        target: { selector: ".ann-marquee" }
      },
      {
        title: "Your portals",
        body: "These cards are your doorways into each portal you have access to — Pathways, the Resource Centre, Finance, and so on. Only portals relevant to your role appear. Click one to jump straight into it.",
        target: { selector: 'a[href="/pathways"]' }
      },
      {
        title: "Pinning your favourites",
        body: "Use the pin on any portal card to keep your most-used portals at the top of your dashboard, so they're always one click away."
      },
      {
        title: "Notifications and approvals",
        body: "Alerts — like timesheets waiting for your approval, or reimbursement updates — appear at the top of your dashboard so nothing slips by unnoticed."
      },
      {
        title: "Your personal organizer",
        body: "The organizer is your private to-do space: set today's focus, list your priorities, and track your tasks. It follows you every time you sign in, on any device."
      },
      {
        title: "How-To knowledge base",
        body: "Anywhere in the app, ask the How-To search how to do something — from submitting a timesheet to logging a client visit — and get a step-by-step answer in plain language."
      },
      {
        title: "Your settings",
        body: "Update your profile, photo and personal preferences here at any time.",
        target: { selector: 'a[href="/user/settings"]' },
        path: "/user/settings"
      },
      {
        title: "Time to practice",
        body: "That's the tour! Next you'll try a few things yourself with the practice checklist. Remember: you're in Training Mode, so nothing you do here is real."
      }
    ],
    tasks: [
      {
        id: "dash-pin",
        title: "Pin a portal you'll use most",
        body: "Use the pin control on one of your portal cards to pin it to your dashboard.",
        verify: { kind: "self" }
      },
      {
        id: "dash-todo",
        title: "Add a to-do to your organizer",
        body: "Open the personal organizer and add a task for yourself.",
        verify: { kind: "self" }
      },
      {
        id: "dash-note",
        title: "Capture a quick note",
        body: "Use the floating notes button to capture a note — great for jotting things down during the day.",
        verify: { kind: "created", entity: "Note" }
      },
      {
        id: "dash-howto",
        title: "Search the How-To knowledge base",
        body: "Ask the How-To search: \"How do I submit a timesheet?\"",
        verify: { kind: "self" }
      }
    ]
  },
  {
    key: "pathways",
    title: "Pathways Case Management",
    shortTitle: "Pathways",
    blurb: "Employment-focused case management: your caseload, client files, Compass tasks and purchase requests.",
    path: "/pathways/dashboard",
    steps: [
      {
        title: "Welcome to Pathways",
        body: "Pathways is Candora's employment case management portal. Everything about a client's journey — intake, barriers, action plans, placements and employment outcomes — lives here. Take a moment to notice the sidebar: it's your map to every section."
      },
      {
        title: "Home — your caseload snapshot",
        body: "The Home page summarizes your day: your assigned clients, upcoming milestones and anything that needs attention.",
        target: { selector: 'a[href="/pathways/home"]' },
        path: "/pathways/home"
      },
      {
        title: "My Clients — your dashboard",
        body: "This is your active caseload. Clients are assigned to you by email, so this list is always exactly the people you're working with right now.",
        target: { selector: 'a[href="/pathways/dashboard"]' },
        path: "/pathways/dashboard"
      },
      {
        title: "The Master List",
        body: "Every client in Pathways lives in the Master List. Search by name, filter by program or status, and click any client to open their full file.",
        target: { selector: 'a[href="/pathways/master"]' },
        path: "/pathways/master"
      },
      {
        title: "Client profiles",
        body: "A client profile holds everything in one place: demographics, barriers and action plans, employment details, workshops, notes and history. Staff across the team can pick up exactly where you left off."
      },
      {
        title: "Intake — adding a client",
        body: "New clients come in through Intake. It checks for duplicates as you type, lets you link to an existing central database file, and syncs the new client automatically once saved.",
        target: { selector: 'a[href="/pathways/intake"]' },
        path: "/pathways/intake"
      },
      {
        title: "Compass tasks",
        body: "Compass entry tasks and checklists are tracked per client here — these are the funder reporting steps you complete as each client progresses.",
        target: { selector: 'a[href="/pathways/compass"]' },
        path: "/pathways/compass"
      },
      {
        title: "Employers and purchase requests",
        body: "Employer contacts, work-exposure placements, and purchase or exposure-course requests are all managed from here.",
        target: { selector: 'a[href="/pathways/employers"]' },
        path: "/pathways/employers"
      },
      {
        title: "Time to practice",
        body: "That's the tour! Now try it yourself: you'll add a demo client, open a file, and submit a purchase request — all on simulated data."
      }
    ],
    tasks: [
      {
        id: "pw-intake",
        title: "Add a new client through Intake",
        body: "Walk through the intake form and create a demo client. In Training Mode this only creates simulated data.",
        path: "/pathways/intake",
        verify: { kind: "created", entity: "Client" }
      },
      {
        id: "pw-profile",
        title: "Open a client's full profile",
        body: "From the Master List, search for a client and open their profile. Explore the barriers, action plan and employment sections.",
        path: "/pathways/master",
        verify: { kind: "self" }
      },
      {
        id: "pw-compass",
        title: "Complete a Compass task",
        body: "Open Compass and mark one of the pending demo tasks as completed.",
        path: "/pathways/compass",
        verify: { kind: "self" }
      },
      {
        id: "pw-purchase",
        title: "Submit a purchase request",
        body: "Submit a purchase or exposure-course request for one of your demo clients.",
        path: "/pathways/dashboard",
        verify: { kind: "created", entity: "PurchaseRequest" }
      }
    ]
  },
  {
    key: "rc",
    title: "Resource Centre (Central Database)",
    shortTitle: "Resource Centre",
    blurb: "The central client database: files, notes, safety alerts, visits, referrals and intensive case management.",
    path: "/rc",
    steps: [
      {
        title: "Welcome to the Resource Centre",
        body: "This portal holds Candora's central client database. It's the single source of truth for who our clients are, what they need, and how the organization has supported them — so keeping records complete here matters."
      },
      {
        title: "The dashboard",
        body: "Your starting overview: activity across the centre, your pending visits and recent service logs.",
        target: { selector: 'a[href="/rc"]' },
        path: "/rc"
      },
      {
        title: "Clients — the central database",
        body: "Every client file lives here. Search by name or phone, and click a client to open their full file.",
        target: { selector: 'a[href="/rc/clients"]' },
        path: "/rc/clients"
      },
      {
        title: "Inside a client file",
        body: "A client file holds contact details, case notes, needs, visits and referrals. Safety alerts appear prominently at the top — always read them before discussing sensitive matters with a client."
      },
      {
        title: "Intake — new clients",
        body: "New clients are registered through Intake. The duplicate matcher helps you find an existing file before creating a new one, so we never end up with two records for the same person.",
        target: { selector: 'a[href="/rc/intake"]' },
        path: "/rc/intake"
      },
      {
        title: "Referrals",
        body: "Incoming and outgoing referrals are tracked here with their status, so nothing falls through the cracks between us and partner organizations.",
        target: { selector: 'a[href="/rc/referrals"]' },
        path: "/rc/referrals"
      },
      {
        title: "Intensive case management",
        body: "Complex files get deeper support here: service plans, stages, goals and risks — for clients who need more than a single visit.",
        target: { selector: 'a[href="/rc/case-management"]' },
        path: "/rc/case-management"
      },
      {
        title: "Time to practice",
        body: "That's the tour! Now you'll register a demo client, add a note, and log a service — all on simulated data."
      }
    ],
    tasks: [
      {
        id: "rc-intake",
        title: "Intake a new client",
        body: "Use Intake to register a demo client. The duplicate matcher will help you practice finding existing files.",
        path: "/rc/intake",
        verify: { kind: "created", entity: "RCClient" }
      },
      {
        id: "rc-note",
        title: "Add a note to a client file",
        body: "Open a demo client and add a note. Try marking it as a safety alert to see how it stands out.",
        path: "/rc/clients",
        verify: { kind: "created", entity: "RCClientNote" }
      },
      {
        id: "rc-service",
        title: "Log a service",
        body: "Log a service for one of your demo clients — services are what feed our funder reporting.",
        path: "/rc/clients",
        verify: { kind: "created", entity: "RCServiceLog" }
      }
    ]
  },
  {
    key: "ell",
    title: "ELL (English Language Learning)",
    shortTitle: "ELL",
    blurb: "Learners, classes, CLB levels, waitlist and assessments.",
    path: "/ell",
    steps: [
      {
        title: "Welcome to the ELL portal",
        body: "This portal manages English Language Learning: learner rosters, classes and courses, waitlist and CLB assessments."
      },
      {
        title: "The dashboard",
        body: "Your starting overview of the ELL program: learners, classes and current capacity at a glance.",
        target: { selector: 'a[href="/ell"]' },
        path: "/ell"
      },
      {
        title: "Learners",
        body: "The learner roster shows each learner's CLB level, enrollment status and class assignment. Click a learner to update their progress.",
        target: { selector: 'a[href="/ell/learners"]' },
        path: "/ell/learners"
      },
      {
        title: "Classes",
        body: "Each class shows its schedule, room and instructor. Open a class to manage attendance, lesson plans and notes.",
        target: { selector: 'a[href="/ell/classes"]' },
        path: "/ell/classes"
      },
      {
        title: "Courses",
        body: "Courses are the curriculum offerings learners can be placed into across terms.",
        target: { selector: 'a[href="/ell/courses"]' },
        path: "/ell/courses"
      },
      {
        title: "The waitlist",
        body: "Learners waiting for a seat are tracked here with a contact state: waiting, contacted, assessment booked, and so on. Keeping these states current is what makes the waitlist manageable.",
        target: { selector: 'a[href="/ell/waitlist"]' },
        path: "/ell/waitlist"
      },
      {
        title: "Assessments",
        body: "CLB assessments are recorded here — before and after levels, so you can see each learner's progress over time.",
        target: { selector: 'a[href="/ell/assessments"]' },
        path: "/ell/assessments"
      },
      {
        title: "Time to practice",
        body: "That's the tour! Now you'll add a demo learner, work a waitlist entry, and record an assessment."
      }
    ],
    tasks: [
      {
        id: "ell-learner",
        title: "Add a new learner",
        body: "Register a demo learner with their language background and CLB level.",
        path: "/ell/learners",
        verify: { kind: "created", entity: "ELLLearner" }
      },
      {
        id: "ell-waitlist",
        title: "Work a waitlist entry",
        body: "Open the waitlist, contact a waiting learner and update their contact state with a note.",
        path: "/ell/waitlist",
        verify: { kind: "self" }
      },
      {
        id: "ell-assess",
        title: "Record a CLB assessment",
        body: "Record an assessment for one of the demo learners, showing their before and after levels.",
        path: "/ell/assessments",
        verify: { kind: "self" }
      }
    ]
  },
  {
    key: "centralreg",
    title: "Central Registration",
    shortTitle: "Central Reg",
    blurb: "One place to register participants across all programs, manage waitlists and approve QR self-registrations.",
    path: "/central-registration",
    steps: [
      {
        title: "Welcome to Central Registration",
        body: "This portal registers participants into any Candora program from one place, so every program's roster and waitlist is consistent."
      },
      {
        title: "The dashboard",
        body: "Your overview of registrations, capacity and requests across all programs.",
        target: { selector: 'a[href="/central-registration"]' },
        path: "/central-registration"
      },
      {
        title: "Programs",
        body: "Every program and its sessions, with capacity controls, live here.",
        target: { selector: 'a[href="/central-registration/programs"]' },
        path: "/central-registration/programs"
      },
      {
        title: "Registrations",
        body: "All participant registrations with their status — pending approval, enrolled, waitlisted. Approving a registration can automatically create the participant record in the program's portal.",
        target: { selector: 'a[href="/central-registration/registrations"]' },
        path: "/central-registration/registrations"
      },
      {
        title: "Waitlists",
        body: "When a program is full, registrations land on the waitlist — with their position so you can offer seats in a fair order.",
        target: { selector: 'a[href="/central-registration/waitlists"]' },
        path: "/central-registration/waitlists"
      },
      {
        title: "Self-registration requests",
        body: "People who scan a program's QR code can sign themselves up. Their requests arrive here for you to approve or decline — no approval needed at all if a program is set that way.",
        target: { selector: 'a[href="/central-registration/requests"]' },
        path: "/central-registration/requests"
      },
      {
        title: "Calendar",
        body: "Sessions by day and room — useful when someone asks what's running when.",
        target: { selector: 'a[href="/central-registration/calendar"]' },
        path: "/central-registration/calendar"
      },
      {
        title: "Time to practice",
        body: "That's the tour! Now register a demo participant, review a self-registration request, and check a waitlist."
      }
    ],
    tasks: [
      {
        id: "cr-register",
        title: "Register a participant into a program",
        body: "Create a registration for a demo participant in any program.",
        path: "/central-registration/registrations",
        verify: { kind: "created", entity: "ProgramRegistration" }
      },
      {
        id: "cr-request",
        title: "Review a self-registration request",
        body: "Approve or decline one of the pending QR self-registration requests.",
        path: "/central-registration/requests",
        verify: { kind: "self" }
      },
      {
        id: "cr-waitlist",
        title: "Check a program's waitlist",
        body: "Open the waitlists view and find the position order of a full program.",
        path: "/central-registration/waitlists",
        verify: { kind: "self" }
      }
    ]
  }
];

export const getTrainingModule = (key) => TRAINING_MODULES.find(m => m.key === key) || null;

export const moduleForPath = (pathname) => {
  if (!pathname) return null;
  if (pathname === "/" || pathname.startsWith("/portal") || pathname.startsWith("/widget-customization")) {
    return getTrainingModule("dashboard");
  }
  const prefixes = [
    ["/pathways", "pathways"],
    ["/rc", "rc"],
    ["/ell", "ell"],
    ["/central-registration", "centralreg"],
  ];
  for (const [prefix, key] of prefixes) {
    if (pathname.startsWith(prefix)) return getTrainingModule(key);
  }
  return null;
};