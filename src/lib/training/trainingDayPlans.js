// ── Facilitator training-day plans ─────────────────────────────────────────
// A day plan is the agenda for a live, in-room session: which modules are taken
// together, how long each block runs, what the room does in Test Mode while it
// happens, and what staff finish on their own afterwards.
// `module` keys reference TRAINING_MODULES in trainingModules.js.
//
// The default day: settle from 9:30, hard start at 10:00, all taught content but
// one block finished before lunch, and the afternoon in practice, live client
// work and portal improvements.

export const PATHWAYS_TRAINING_DAY = {
  id: "pathways",
  kicker: "Facilitator plan",
  title: "Pathways Crew Training Day",
  audience: "Pathways case management staff, service navigators and supervisors",
  timing: "9:30 am – 4:30 pm · settle at 9:30, hard start at 10:00, one carry-over block after lunch",
  summary:
    "Hours, in this order: settle from 9:30, hard start at 10:00, and every taught module except one finished before lunch. After lunch: one carry-over block, then the afternoon in Test Mode practice, then live work (new clients onto our lists and into the system), then time on improving the portals themselves.",
  setup: [
    "Projector running the facilitator's own session (presentation mode); everyone else follows in Test Mode on their own device.",
    "Test Mode switched on for the room before 10:00 — the ribbon at the top of the screen is the proof.",
    "A flip chart for parked questions, so the agenda keeps its shape — the afternoon improvement block works from it.",
    "Live work in the afternoon needs Test Mode off, and access to the waiting list and Intake.",
  ],
  outcomes: [
    "Open a client from the Master List and tell whose caseload it is",
    "Take a client from Intake through the determination to a saved action plan without help",
    "Walk one client down each of the three roads and read Program Progress",
    "Get new clients onto the right list and into the system — duplicate-checked, with a counsellor and a stream",
    "Work a live client file with Test Mode off, without breaking another program's record",
    "Name what needs improving in the portals and log it as a change request",
  ],
  blocks: [
    {
      type: "admin",
      time: "9:30 – 10:00",
      minutes: 30,
      title: "Arrival, settle, sign-in, Test Mode check",
      why: "The settle half hour is for coffee, screens and pairing up — no content, so the hard start at 10:00 is honest.",
      cue: "Say the hard start out loud at 9:55, then begin at 10:00 whether or not everyone is sitting. The people who arrived early get the slower start; the room gets a day that ends on time.",
      activities: [
        "Everyone signed in and looking at their own Main Page.",
        "Test Mode ribbon visible on every screen — walk the room and check, don't ask.",
        "Pair each less-confident user with someone from the same team, and agree who shares a screen.",
        "Write any question you already have on the flip chart — it gets answered in the improvement block, not now.",
      ],
    },
    {
      type: "session",
      time: "10:00 – 10:20",
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
      time: "10:20 – 11:00",
      minutes: 40,
      title: "The Main Page and the app's own introduction",
      module: "dashboard",
      why: "The module with the narrated introduction to the whole app, and the only morning block where staff set up something real.",
      cue: "Warn them before the signature step: everything else today is simulated, this isn't. Then say once, out loud, that supervisor approvals land on this page.",
      activities: [
        "Watch the narrated introduction — it sets the tour's rules and the app's story.",
        "Set up your e-signature with a PIN. Real and permanent — pick a PIN you'll still know in a month.",
        "Upload a one-page PDF through Quick Files with a category and two keywords, then find it again with one keyword.",
        "Turn one widget on that you'll actually read, and one off that you won't.",
      ],
    },
    { type: "break", time: "11:00 – 11:15", minutes: 15, title: "Break" },
    {
      type: "session",
      time: "11:15 – 11:30",
      minutes: 15,
      title: "The widgets that earn their space",
      module: "dashboard_widgets",
      why: "Short block: only three widgets matter for casework, and the rest can wait for a quiet afternoon.",
      cue: "Don't tour every widget. Name the Personal Organizer, the How-To assistant and My Tasks, and say plainly that the rest are optional.",
      activities: [
        "Ask the How-To assistant a real question you've had about the app.",
        "Add tomorrow's first task to the Personal Organizer, and the portfolio time you're protecting this week.",
      ],
    },
    {
      type: "session",
      time: "11:30 – 12:10",
      minutes: 40,
      title: "Pathways foundations: your caseload and the Master List",
      module: "pathways",
      why: "Before any client journey, the crew needs to know where their own clients live and how the caseload is decided.",
      cue: "Land the difference between My Clients and the Master List first — half the room will confuse them at some point. Caseloads route by email, so a missing client is an assignment question.",
      activities: [
        "Read your own caseload count off My Clients, then find one of those clients in the Master List and open the file.",
        "Find the Compass queue and note how many tasks are waiting. Don't action any of them yet.",
        "Use the Master List filters to answer one question out loud: how many clients are in DEA right now?",
      ],
    },
    {
      type: "session",
      time: "12:10 – 12:35",
      minutes: 25,
      title: "The Client Journey, part 1: intake to action plan",
      module: "pathways_journey",
      why: "The last taught block before lunch, and the one the afternoon's live work depends on.",
      cue: "Slow down at the determination. Three roads out of one place is the concept the whole day rests on, and the action plan is what unlocks the road.",
      activities: [
        "On the demo client: run Intake, accept the duplicate check, record the determination, and save an action plan.",
        "Stop at the action plan and notice that the rest of the program flow only unlocks once it saves.",
      ],
    },
    { type: "break", time: "12:35 – 1:20", minutes: 45, title: "Lunch" },
    {
      type: "session",
      time: "1:20 – 2:00",
      minutes: 40,
      title: "Carry-over: the three roads and the 90-day close",
      module: "pathways_journey_part2",
      why: "The one taught block after lunch, on purpose: the routes only make sense once intake and the plan are already in the room.",
      cue: "Keep the cursor moving and let them click with you. Do the DEA road live and let them walk the other two during practice — the assessment, navigation and central database modules are follow-up now.",
      activities: [
        "Walk one demo client down each road: DEA, WD with an internal placement, WD with a work exposure placement.",
        "Open Program Progress for one of them and read the timeline aloud — plan items, barriers, placements.",
        "Open the 90-day follow-up and record it for a completed client.",
      ],
    },
    { type: "break", time: "2:00 – 2:15", minutes: 15, title: "Break" },
    {
      type: "session",
      time: "2:15 – 3:00",
      minutes: 45,
      title: "Practice in Test Mode — the whole day, unaided",
      why: "Practice while the projector is still on: the room does the work and the facilitator walks, so mistakes are caught here and not on a real file.",
      cue: "Stop teaching. Nothing new goes on the screen — walk the room, watch hands, and let them get it wrong once in a sandbox.",
      activities: [
        "Take a demo client from Intake through the determination to a saved action plan, without following along with anyone.",
        "Move one client's Program Status and read the roadmap that updates behind it.",
        "Record two barriers with action steps and confirm the ERA on the client waiting in Awaiting Assessment.",
        "Resolve one barrier with an end date and a note, and raise an internal referral.",
        "Finish the quizzes for the modules taught today — 70% passes, retakes are free.",
      ],
    },
    {
      type: "session",
      time: "3:00 – 3:45",
      minutes: 45,
      title: "Live work: new clients onto the lists and into the system",
      why: "The day pays for itself here — the waiting clients get real files instead of a demonstration, and the crew gets the intake habit with a facilitator in the room.",
      cue: "Test Mode off, and say it: this is live data now, there is no undo. Duplicate check first, every time, before anyone types a new name.",
      activities: [
        "Switch Test Mode off and confirm the ribbon has gone before touching a real name.",
        "Work the waiting clients: search the central database for each one first, then open Intake and either link the existing file or create the record.",
        "Assign the counsellor and the program stream, and set each new client's program status so they leave the holding section.",
        "Record the first contact attempt on anyone who can't be reached, so the list stays honest.",
        "Log today's visits for the drop-ins you saw at the desk, so the file matches what happened.",
      ],
    },
    {
      type: "session",
      time: "3:45 – 4:15",
      minutes: 30,
      title: "Improving the portals",
      why: "The room has spent six hours finding the friction; this block turns it into improvements instead of complaints.",
      cue: "Every problem needs an owner and a next step, or it becomes next year's complaint. Change requests get logged in the app, not mentioned in the hallway.",
      activities: [
        "Work down the flip chart: for each parked question decide whether it's training, an access fix, or a change to the app.",
        "Submit a change request for the app improvements you actually need, with the screen and the outcome described.",
        "Fix the access ones now: missing portals, wrong supervisor, absent client list.",
        "Agree who owns each remaining item and the date it gets looked at again.",
      ],
    },
    {
      type: "admin",
      time: "4:15 – 4:30",
      minutes: 15,
      title: "Follow-up list and close",
      activities: [
        "Everyone writes their own follow-up list: which modules they still owe and the day they'll do them.",
        "Name the three modules this crew owes before touching a live file: the assessment, service navigation, the central database.",
        "Point supervisors at the Training Hub so they can see who finished what.",
      ],
    },
  ],
  followUp: [
    { module: "pathways_assessment", who: "Everyone who assesses clients", why: "The navigator's half of the workflow — barriers without action steps are only observations." },
    { module: "pathways_service_nav", who: "Service navigators", why: "Barrier work, resolution notes and internal referrals — before the first live file." },
    { module: "central_database_basics", who: "Everyone", why: "One record per person, and the duplicate habit the live-work block started." },
    { module: "pathways_workshops", who: "Whoever runs Job Club", why: "Attendance is the deliverable: one session, one roster, plan items tick." },
    { module: "staffadmin", who: "Everyone", why: "Time off and timesheets — needed before the next pay period closes." },
    { module: "staffadmin_money", who: "Everyone", why: "Receipts and reimbursements, including the MasterCard monthly batch." },
    { module: "staffadmin_supervisor", who: "Supervisors", why: "The approvals that land on their main page: time off, timesheets, expenses." },
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
  start_time: "09:30",
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