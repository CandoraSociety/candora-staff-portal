// ── EmpowerU training module ───────────────────────────────────────────────
// The financial literacy portal: cohorts (the classes), the people who apply
// into them, the waitlist while they wait for a seat, the ATB account each
// participant opens, the documents, and the funder workbook. Steps point at the
// labels that are actually on the screens so a learner recognises them live.

export const EMPOWERU_MODULES = [
  {
    key: "empoweru",
    title: "EmpowerU (financial literacy program)",
    shortTitle: "EmpowerU",
    blurb: "Ten-week financial literacy cohorts end to end: applications, seats, waitlist contact work, ATB account setup, documents and the funder workbook.",
    path: "/empoweru",
    steps: [
      {
        title: "Welcome to the EmpowerU portal",
        body: "Press Play to hear what the EmpowerU portal is for and what this module covers. Each scene stays on screen until its narration finishes. When you're ready, press Next below to continue training.",
        introExplainer: true
      },
      {
        title: "Four numbers that tell you where the program stands",
        body: "EmpowerU runs about two or three cohorts a year, so the dashboard answers four questions at once: how many cohorts are active, how many participants are enrolled, how many are waiting, and how far account setup has got across everyone. The last number is a fraction — completed over total — because that is the work that can stall quietly. Clicking any card takes you to the list behind it.",
        path: "/empoweru",
        target: { text: "EmpowerU Dashboard", scope: "main" }
      },
      {
        title: "Cohorts and account setups, side by side",
        body: "Below the counts, Active & Upcoming Cohorts shows each class with its dates, delivery mode, facilitator and status, soonest first. Account Setups In Progress is the follow-up list: anyone overdue on a next action date, or at three or more contact attempts, needs a phone call today. If the amber banner is showing above the counts, that is the same thing said louder.",
        path: "/empoweru",
        target: { text: "View all", scope: "main" }
      },
      {
        title: "Cohorts are the classes, not the people",
        body: "Every class is a cohort: its start and end dates, delivery mode, location, facilitator, capacity and status. Each card also shows enrolled against capacity, waitlist and registered counts, so you can see at a glance which class is full. A cohort in planning accepts registrations without showing up as active; one that is completed drops out of the active lists.",
        path: "/empoweru/cohorts",
        target: { text: "New Cohort", scope: "main" }
      },
      {
        title: "Setting a cohort up properly",
        body: "New Cohort asks for the name, the start and end dates, the delivery mode — in person, virtual or hybrid — the location or room, the capacity and the facilitator. Registration Open is the switch that decides whether the public application link works for this cohort at all, so it is the field people forget at the start of term.",
        path: "/empoweru/cohorts",
        target: { text: "New Cohort", scope: "main" }
      },
      {
        title: "Inside a cohort",
        body: "Click a cohort and you get its working page: delivery, capacity, waitlist and facilitator across the top; the applications panel underneath; then Participants, with the active count and how many are still outstanding on pre-program steps. Add Registration puts a known participant into this class, and Edit takes you back to the form.",
        path: "/empoweru/cohorts",
        target: { text: "Add Registration", scope: "main" }
      },
      {
        title: "Applications arrive through the link",
        body: "Each cohort has a registration link you can copy or preview. Someone fills it in, and their application lands in the cohort's Applications panel marked awaiting approval. Approve creates the participant and their registration; Reject closes it. Nothing is registered by someone filling out a form — a person on staff always approves the seat.",
        path: "/empoweru/cohorts",
        target: { text: "Approve", scope: "main" }
      },
      {
        title: "Participants — one record per person",
        body: "Participants is the roster of people, split into Active Participants and Past Participants, with a card carrying their cohort status, their account setup position and any follow-ups needed. Search by name or email before creating anyone: a second profile for the same person splits their registrations, service history and account setup across two files.",
        path: "/empoweru/participants",
        target: { text: "Active Participants", scope: "main" }
      },
      {
        title: "Inside a participant's file",
        body: "The participant page holds three tabs: Cohorts, every registration they have with its status and progress through the program steps; Account Setup, their ATB savings account journey; and Services, the service log with any follow-ups flagged. Refer to a program at the top sends them into another Candora program without retyping their details.",
        path: "/empoweru/participants"
      },
      {
        title: "The waitlist is contact work",
        body: "Waitlist lists everyone whose registration is waitlisted, oldest first or A to Z, with chips for each contact state — waiting, left message, application form sent, not interested, registered next session. Expand an entry to log the contact and set the next follow-up date. The personal registration link copies with their name pre-filled and locked, so it only ever works for that person.",
        path: "/empoweru/waitlist",
        target: { text: "Date Added", scope: "main" }
      },
      {
        title: "Account Setup — the ATB account",
        body: "Every enrolled participant needs a savings account, and Account Setup tracks that pipeline: not started, contacting, appointment scheduled, forms sent, forms done, account opened, completed. Each record shows the next action due date and how many contact attempts have happened. Use Log Contact to record an attempt and the advance button to move the status on — set it when the step actually happens, not at the end of the term.",
        path: "/empoweru/account-setup",
        target: { text: "ATB Account Setup", scope: "main" }
      },
      {
        title: "Program Documents",
        body: "Program Documents has two tabs. Participant Documents holds ID copies, assessments and signed forms, filed against a participant and optionally a cohort. Program Forms holds the program-wide material — the United Way facilitator submission and reference sheets. Both are searched the same way, by title, type, file name or the person and cohort they belong to.",
        path: "/empoweru/documents",
        target: { text: "Add Document", scope: "main" }
      },
      {
        title: "Funder Reports — the official workbook",
        body: "Funder Reports is a view onto each cohort's official EmpowerU Excel tracker, kept up to date on SharePoint from what the portal records; you can open it or download it. It is not where you do the work: register people, mark their progress and log services here, and the tracker follows. If a cohort's workbook needs rebuilding, the refresh option on that card does it.",
        path: "/empoweru/funder-reports",
        target: { text: "Funder Reports", scope: "main" }
      },
      {
        title: "One person, one file, across the whole organization",
        body: "EmpowerU participants are filed in the Candora Central Database like every other program. Match against the database before creating a participant — a linked record means other portals read the same person. Registration can also start upstream: a registration taken at the Central Registration desk or referred from another program creates the participant and registration records here, which is why the counts move without you typing anything.",
        path: "/empoweru/participants"
      },
      {
        title: "Time to practice",
        body: "That's the tour. Now you'll create a cohort, register a participant into it, work a waitlist entry, advance an account setup and upload a participant document."
      }
    ],
    tasks: [
      {
        id: "empoweru-cohort",
        title: "Create a cohort",
        body: "Set up a cohort with dates, delivery mode, capacity and a facilitator.",
        hint: "Open Cohorts, click New Cohort and fill in the name, start and end dates, delivery mode and capacity.",
        path: "/empoweru/cohorts",
        verify: { kind: "created", entity: "EmpowerUCohort" }
      },
      {
        id: "empoweru-registration",
        title: "Register a participant into a cohort",
        body: "Put an existing participant into a cohort as a registration.",
        hint: "Open Cohorts, click your cohort, then Add Registration — choose the participant, the cohort and the registration date.",
        path: "/empoweru/cohorts",
        verify: { kind: "created", entity: "EmpowerURegistration" }
      },
      {
        id: "empoweru-waitlist",
        title: "Work a waitlist entry",
        body: "Log a contact attempt on a waitlisted person and set the next follow-up date.",
        hint: "Open Waitlist, expand an entry and update its contact status, last contact and follow-up date.",
        path: "/empoweru/waitlist",
        verify: { kind: "self" }
      },
      {
        id: "empoweru-account",
        title: "Advance an account setup",
        body: "Move a participant's ATB account setup forward one step.",
        hint: "Open Account Setup, log a contact or use the advance button on a record to move it to the next status.",
        path: "/empoweru/account-setup",
        verify: { kind: "self" }
      },
      {
        id: "empoweru-document",
        title: "Upload a participant document",
        body: "Add a document against a participant — an ID copy, an assessment or a signed form.",
        hint: "Open Program Documents, click Add Document on Participant Documents, give it a title, pick the participant and attach the file.",
        path: "/empoweru/documents",
        verify: { kind: "created", entity: "EmpowerUDocument" }
      }
    ]
  },
];