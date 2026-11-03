// ── Childminding training module ───────────────────────────────────────────
// Childcare that runs while a parent or guardian is in a program. Two things
// carry the day and both are taught deliberately here: sessions are set up
// ahead of time (normally by the program assistant), and every child is signed
// in and out as one intake record whose times drive the hours and the billing.

export const CHILDMINDING_MODULES = [
  {
    key: "childminding",
    title: "Childminding (childcare services)",
    shortTitle: "Childminding",
    blurb: "Sessions, sign-in and sign-out, hours and Pathways billing, and the monthly records export.",
    path: "/childminding",
    steps: [
      {
        title: "Welcome to the Childminding portal",
        body: "Press Play to hear what the Childminding portal is for and what this module covers. Each scene stays on screen until its narration finishes. When you're ready, press Next below to continue training.",
        introExplainer: true
      },
      {
        title: "Childcare while a parent is in a program",
        body: "Childminding is the childcare that runs alongside Candora's programs. A parent attending a Pathways class, an ELL class or a workshop can leave their child here, and the portal records the session, the child, the hours and — for Pathways — the billing. It is the same service whether the parent is upstairs in a classroom or down the hall in a workshop.",
        path: "/childminding",
        target: { text: "Childminding Dashboard", scope: "main" }
      },
      {
        title: "Sessions come first",
        body: "A session is the block of time childcare is offered: a date, a start and end time, a location and a capacity. Children are attached to a session, so a session has to exist before anyone can be signed in. If you are signing a child in and there is no session for today, stop and set one up rather than recording the child loose.",
        path: "/childminding",
        target: { text: "Create Session", scope: "main" }
      },
      {
        title: "Usually the program assistant's job",
        body: "Creating sessions is normally the program assistant's work, and it happens ahead of time — a week or a month of blocks entered in one sitting, matching the program timetable. Whoever is working the childcare room then opens the session that already exists and signs children in and out of it. Only create a session yourself when one is genuinely missing: a one-off workshop needs childcare, or someone changed the room at short notice.",
        path: "/childminding/schedule",
        target: { text: "Childminding Schedule", scope: "main" }
      },
      {
        title: "Setting a session up",
        body: "Create Session asks for a title, the date, the start and end times, a location and a capacity in children. Capacity is the total for the room, across every program running that morning — not per program. Status is Scheduled, Completed or Cancelled, so a cancelled morning can be kept and marked rather than deleted. Notes is where a staffing change or a room move belongs.",
        path: "/childminding/schedule",
        target: { text: "Create Session", scope: "main" }
      },
      {
        title: "Reading the calendar",
        body: "The schedule is a month at a time. Use Today and the arrows to move around; each day shows its sessions in teal and any standalone records in the program colour. Below the calendar, the month's sessions are listed with their times and location, and below that the individual records that are not attached to a session. The line at the top counts sessions, individual records and total hours for the month.",
        path: "/childminding/schedule",
        target: { text: "Today", scope: "main" }
      },
      {
        title: "Inside a session",
        body: "Click a session and it opens: children signed in against the capacity, the total hours for the morning, and the Pathways billing owed against it. Intake Records underneath is who is in the room — each row showing the child, the parent or guardian, the hours and the program. New Intake adds a child to this session, and Edit reopens the session details.",
        path: "/childminding/schedule",
        target: { text: "Session (click to open)", scope: "main" }
      },
      {
        title: "Signing a child in",
        body: "Signing in is one intake record: the child's first name, the parent or guardian's first and last name, the date, the check-in time, and the program the parent is attending. Fill in check-out at the same time if you already know it — otherwise add it at pickup. Choose Other and name the program if it is not Pathways or ELL. Notes holds allergies, who is allowed to collect the child, and anything the next staff member must know.",
        path: "/childminding/intake",
        target: { text: "New Childminding Registration", scope: "main" }
      },
      {
        title: "Signing a child out",
        body: "At pickup, find the record in Records — search by the child's or the parent's name — and open the pencil to add the check-out time. The moment both times are in, hours are calculated and rounded up to the next fifteen minutes, and the billing amount follows. Never leave a child's record without a check-out: an open record means no hours, no bill, and no answer for a parent who asks when they were collected.",
        path: "/childminding/records",
        target: { text: "Childminding Records", scope: "main" }
      },
      {
        title: "Hours and billing",
        body: "Pathways children are billed at twenty dollars per child per hour; ELL and other programs are recorded but not charged. Hours come from the times, rounded up in fifteen-minute steps, and the amount recalculates whenever a time or program changes. Billing status moves from Unbilled to Billed to Paid as finance picks it up — don't mark something Paid because a parent said they would settle it.",
        path: "/childminding/records",
        target: { text: "Billing", scope: "main" }
      },
      {
        title: "Records with and without a session",
        body: "Every child's visit is a record, session or not. Records taken inside a session appear in that session's detail; standalone records — a drop-in with no session that day — show on the calendar and in the same Records table. Records is therefore the complete history: filter it by month, year or program before quoting a family or reconciling a bill.",
        path: "/childminding/records",
        target: { text: "Program", scope: "main" }
      },
      {
        title: "End of month",
        body: "Before the month closes, filter Records to the month and check two things: no record is missing a check-out time, and every Pathways record carries the right billing status. Then Export PDF builds the summary sheet — sessions, total hours, Pathways hours and Pathways billing — with the table behind it, which is the version finance and funders read.",
        path: "/childminding/records",
        target: { text: "Export PDF", scope: "main" }
      },
      {
        title: "Who does what",
        body: "The program assistant sets sessions up ahead of time, matching the program timetable. Childcare staff sign children in and out as they arrive and leave, and keep the notes current. The coordinator checks hours and billing weekly, works the childminding referrals panel on the dashboard, and closes the month with the export. Finance bills from the Pathways totals.",
        path: "/childminding"
      },
      {
        title: "Time to practice",
        body: "That's the tour. Now you'll create a session, sign a child in, sign a child out, record a Pathways child and check the billing, and export the month's records."
      }
    ],
    tasks: [
      {
        id: "childminding-session",
        title: "Create a session",
        body: "Set up a session with a date, times, location and a capacity in children.",
        hint: "Open Schedule, click Create Session and fill in the title, date, start and end times and capacity.",
        path: "/childminding/schedule",
        verify: { kind: "created", entity: "ChildmindingSession" }
      },
      {
        id: "childminding-signin",
        title: "Sign a child in",
        body: "Create an intake record for a child arriving: child, parent or guardian, date and check-in time.",
        hint: "Open Childminding Intake (or New Intake inside a session) and fill in the child, the parent or guardian, the date, the check-in time and the program.",
        path: "/childminding/intake",
        verify: { kind: "created", entity: "ChildmindingRecord" }
      },
      {
        id: "childminding-signout",
        title: "Sign a child out",
        body: "Add a check-out time to a child's record and watch the hours calculate.",
        hint: "Open Records, click the pencil on a record and enter the check-out time. The calculated hours show under the time fields.",
        path: "/childminding/records",
        verify: { kind: "self" }
      },
      {
        id: "childminding-billing",
        title: "Record a Pathways child and check the billing",
        body: "Sign in a Pathways child and confirm the billing amount and status on their record.",
        hint: "Sign the child in with program Pathways, then find the record in Records — the Billing column should show $20/hour against the hours, with status Unbilled.",
        path: "/childminding/records",
        verify: { kind: "self" }
      },
      {
        id: "childminding-export",
        title: "Export the month's records",
        body: "Filter Records to the current month and export the PDF summary.",
        hint: "Open Records, set the month filter, then click Export PDF. Allow popups when the browser asks.",
        path: "/childminding/records",
        verify: { kind: "self" }
      }
    ]
  },
];