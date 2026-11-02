// ── Facilitator training-day plans ─────────────────────────────────────────
// A day plan is the agenda for a live, in-room session: which modules are taken
// together, how long each block runs, what the room does in Test Mode while it
// happens, and what staff finish on their own afterwards.
// `module` keys reference TRAINING_MODULES in trainingModules.js.

export const PATHWAYS_TRAINING_DAY = {
  id: "pathways",
  kicker: "Facilitator plan",
  title: "Pathways Crew Training Day",
  audience: "Pathways case management staff, service navigators and supervisors",
  timing: "8:45 am – 4:10 pm · nine teaching blocks, two breaks and lunch",
  summary:
    "One day, in this order: find your way around the app, then the client journey end to end. Everything the crew doesn't strictly need before tomorrow moves to a follow-up list they finish on their own within the week.",
  setup: [
    "Projector running the facilitator's own session (presentation mode); everyone else follows in Test Mode on their own device.",
    "Test Mode switched on for the room before the first block — the ribbon at the top of the screen is the proof.",
    "A flip chart for parked questions, so the agenda keeps its shape.",
  ],
  outcomes: [
    "Open a client from the Master List and tell whose caseload it is",
    "Take a client from Intake through the determination and save an action plan",
    "Read Program Progress and move Program Status without breaking the flow",
    "Run an assessment: verify the file, record barriers, confirm the ERA",
    "Resolve a barrier with a note and raise an internal referral",
    "Find anyone in the central client database and add a note or a visit",
  ],
  blocks: [
    {
      type: "admin",
      time: "8:45 – 9:00",
      minutes: 15,
      title: "Arrival, sign-in, Test Mode check",
      activities: [
        "Everyone signed in and looking at their own Main Page.",
        "Test Mode ribbon visible on every screen — walk the room and check, don't ask.",
        "Name tags, seating: pair each less-confident user with someone from their own team.",
      ],
    },
    {
      type: "session",
      time: "9:00 – 9:20",
      minutes: 20,
      title: "One app, many workspaces",
      module: "welcome",
      why: "Nobody should spend the day lost in a workspace they can't name, and nobody needs to learn all twenty.",
      cue: "Say the two-name thing out loud: the app is the Candora Staff Portal, and the workspaces inside it are also called portals. Then name the three things they'll use all day — main page, sidebar, tab bar.",
      activities: [
        "Open Portals, open Pathways, then click back to your Main Page tab — twice, until the switch stops feeling new.",
        "Pin Pathways on your main page. If it isn't in your list it's an access question for your supervisor, not a fault.",
        "Leave the Training catalog open in a tab; it's the reference shelf for the rest of the day.",
      ],
    },
    {
      type: "session",
      time: "9:20 – 10:10",
      minutes: 50,
      title: "The Main Page and the app's own introduction",
      module: "dashboard",
      why: "This is the module with the narrated introduction to the whole app, and the only block where staff set up something real.",
      cue: "Warn them before the signature step: everything else today is simulated, this isn't. Then say once, out loud, that supervisor approvals land on this page.",
      activities: [
        "Watch the narrated introduction all the way through — it sets the tour's rules and the app's story.",
        "Set up your e-signature with a PIN. Real and permanent — pick a PIN you'll still know in a month.",
        "Upload a one-page PDF through Quick Files with a category and two keywords, then find it again with one keyword.",
        "Turn one widget on that you'll actually read, and one off that you won't.",
      ],
    },
    { type: "break", time: "10:10 – 10:25", minutes: 15, title: "Break" },
    {
      type: "session",
      time: "10:25 – 10:40",
      minutes: 15,
      title: "The widgets that earn their space",
      module: "dashboard_widgets",
      why: "Short block: only three widgets matter for casework, and the rest can wait for a quiet afternoon.",
      cue: "Don't tour every widget. Name the Personal Organizer, the How-To assistant and My Tasks, and say plainly that the rest are optional.",
      activities: [
        "Ask the How-To assistant a real question you've had about the app, and notice whether Candora's own answer or the AI fallback comes back.",
        "Add tomorrow's first task to the Personal Organizer, then a reminder for Friday.",
        "Look at the widgets you switched off and decide if any should come back.",
      ],
    },
    {
      type: "session",
      time: "10:40 – 11:25",
      minutes: 45,
      title: "Pathways foundations: your caseload and the Master List",
      module: "pathways",
      why: "Before any client journey, the crew needs to know where their own clients live and how the caseload is decided.",
      cue: "Land the difference between My Clients and the Master List first — half the room will confuse them at some point today. Caseloads route by email, so a missing client is an assignment question.",
      activities: [
        "Read your own caseload count off My Clients, then find one of those clients in the Master List and open the file.",
        "Find the Compass queue and note how many tasks are waiting. Don't action any of them yet.",
        "Use the Master List filters to answer one question out loud: how many clients are in DEA right now?",
      ],
    },
    {
      type: "session",
      time: "11:25 – 11:50",
      minutes: 25,
      title: "The Client Journey, part 1: intake to action plan",
      module: "pathways_journey",
      why: "The first half of the journey, while the room is still fresh — intake, assessment, determination, plan.",
      cue: "Slow down at the determination. Three roads out of one place is the concept the whole day rests on.",
      activities: [
        "On the demo client: run Intake, accept the duplicate check, record the determination, and save an action plan.",
        "Stop at the action plan and notice that the rest of the program flow only unlocks once it saves.",
      ],
    },
    { type: "break", time: "11:50 – 12:35", minutes: 45, title: "Lunch" },
    {
      type: "session",
      time: "12:35 – 1:30",
      minutes: 55,
      title: "The Client Journey, part 2: three roads and the 90-day close",
      module: "pathways_journey_part2",
      why: "The longest block of the day, straight after lunch: the three routes, Program Progress and the milestone that closes every road.",
      cue: "Keep the cursor moving and let them click with you. If time runs short, do the DEA road live and let them walk the other two in the practice time.",
      activities: [
        "Walk one demo client down each road: DEA, WD with an internal placement, WD with a work exposure placement.",
        "Open Program Progress for one of them and read the timeline aloud — plan items, barriers, placements.",
        "Move Program Status one stage and watch the roadmap update behind it.",
        "Open the 90-day follow-up and record it for a completed client.",
      ],
    },
    {
      type: "session",
      time: "1:30 – 2:00",
      minutes: 30,
      title: "The assessment",
      module: "pathways_assessment",
      why: "The navigator's half of the workflow, and the part new staff get wrong most often — barriers without action steps.",
      cue: "The barrier rule first: a barrier without action steps is only an observation. Then have two people say the Service Navigator question's answers out loud: yes assigns a navigator, no leaves the barriers with the counsellor.",
      activities: [
        "Press Assess on a client waiting in Awaiting Assessment, and verify the details before touching a barrier.",
        "Record two barriers with challenges and action steps, then confirm the ERA.",
        "Complete the assessment and watch the client land in Assessment Complete — Awaiting Assignment.",
        "Suggest one action plan item and know where the counsellor will see it.",
      ],
    },
    { type: "break", time: "2:00 – 2:15", minutes: 15, title: "Break" },
    {
      type: "session",
      time: "2:15 – 2:45",
      minutes: 30,
      title: "Service navigation: barriers and referrals",
      module: "pathways_service_nav",
      why: "Same client, the other seat at the table — whoever works barriers weekly needs this before they touch a live file.",
      cue: "Only the assigned navigator can edit barriers. Make the read-only lock visible on the projector so nobody thinks their screen is broken.",
      activities: [
        "As the navigator, resolve one barrier with an end date and a resolution note.",
        "Raise an internal referral and check it appears on the receiving program's dashboard.",
        "Set a review date on one barrier and find it on Program Progress.",
      ],
    },
    {
      type: "session",
      time: "2:45 – 3:25",
      minutes: 40,
      title: "The central client database",
      module: "central_database_basics",
      why: "Pathways feeds the central record and reads it back. One record per person is the promise the whole organization makes.",
      cue: "This is the habit that keeps Pathways clean: search the database before anyone types a new name. Say it, then have someone demonstrate the duplicate matcher on the projector.",
      activities: [
        "Search a demo client by name in Database, then narrow by program area and status.",
        "Add a note, then log a client visit, and point at where both land on the same file.",
        "Read the program strips on one file and name every program that already knows that person.",
      ],
    },
    {
      type: "session",
      time: "3:25 – 3:50",
      minutes: 25,
      title: "Workshops: attendance becomes progress",
      module: "pathways_workshops",
      why: "Short, practical finish: the crew runs workshops weekly and rarely realizes attendance ticks the plan.",
      cue: "Attendance is the deliverable here. One session, one roster, and let them watch the plan item tick.",
      activities: [
        "Create a Job Club session from the shortcut and take a roster.",
        "Complete the workshop and check that the plan item ticks on every client marked attended.",
      ],
    },
    {
      type: "admin",
      time: "3:50 – 4:10",
      minutes: 20,
      title: "Quizzes, follow-up list and close",
      activities: [
        "Each person finishes the quiz at the end of the modules they completed — 70% to pass, retakes are free.",
        "Everyone writes their own follow-up list: which modules they still owe and the day they'll do them.",
        "Answer the parked questions you can, and email the rest the next morning.",
        "Point supervisors at the Training Hub so they can see who finished what.",
      ],
    },
  ],
  followUp: [
    { module: "staffadmin", who: "Everyone", why: "Time off and timesheets — needed before the next pay period closes." },
    { module: "staffadmin_money", who: "Everyone", why: "Receipts and reimbursements, including the MasterCard monthly batch." },
    { module: "staffadmin_supervisor", who: "Supervisors", why: "The approvals that land on their main page: time off, timesheets, expenses." },
    { module: "filemanager", who: "Everyone", why: "Where documents live and how an upload gets filed so it can be found again." },
    { module: "central_database_advanced", who: "Service navigators and intensive-case staff", why: "Record ownership, linking, service logs and case management." },
  ],
};

export const TRAINING_DAY_PLANS = [PATHWAYS_TRAINING_DAY];

// The Pathways day as a saved-plan record (used by "Pathways template" on the
// planner page). Blocks keep only their length; times are derived on render.
export const pathwaysPlanSeed = () => ({
  title: PATHWAYS_TRAINING_DAY.title,
  audience_type: "group",
  audience: "Pathways crew",
  plan_date: "",
  start_time: "08:45",
  summary: PATHWAYS_TRAINING_DAY.summary,
  outcomes: PATHWAYS_TRAINING_DAY.outcomes,
  setup: PATHWAYS_TRAINING_DAY.setup,
  blocks: PATHWAYS_TRAINING_DAY.blocks.map(b => ({
    type: b.type,
    title: b.title,
    minutes: b.minutes,
    module_key: b.module || "",
    why: b.why || "",
    cue: b.cue || "",
    activities: b.activities || [],
  })),
  follow_up: PATHWAYS_TRAINING_DAY.followUp.map(f => ({ module_key: f.module, who: f.who, why: f.why })),
});