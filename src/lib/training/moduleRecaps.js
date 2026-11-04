// ── "What we've learned" wrap-up per training module ──────────────────────
// Every module ends with a short narrated recap (a scene that plays like the
// intro video: the narration is the clock, static MP3s, same female voice)
// plus a short quiz. The quiz is optional per module — a module without a
// `quiz` array simply skips straight to practice.
//
// recap:  { kicker, title, body, audioUrl, takeaways[] }
// quiz:   [{ question, options[], answer, explain }]
//         answer = index of the correct option.
import { JOBLAB_RECAP } from '@/lib/training/recapVideos/jobLabRecap';

export const MODULE_RECAPS = {
  joblab: JOBLAB_RECAP,
  welcome: {
    kicker: "What we've learned",
    title: "Familiar, not fluent — and that's the point.",
    body: "Let's bring the tour together. The Candora Staff Portal is one app made of many workspaces, and you only see the ones your role opens. Your main page is home base: announcements, alerts and your own shortcut cards. A portal opens from the Portals list or the plus button, and each one takes its place as a tab that remembers where you were. The sidebar and top bar stay with you on every page. And the portals are not islands: one central client database holds one record per person, referrals arrive on another program's dashboard, documents land in one vault, and an approved timesheet flows on to Finance. Nothing here needs memorising — training is a reference shelf you come back to when the work calls for it.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/99abaa5ce_speech.mp3",
    takeaways: [
      "One app, many workspaces: client programs, registration, operations, people and money, oversight and the file vault all sit inside the same staff portal.",
      "Your main page is home base — announcements, alerts and the portals you use most.",
      "Open a portal from the Portals list or the + button, and it becomes a tab that keeps your place.",
      "The portals are connected: one person is one record in the central client database, referrals travel to the receiving program, and every document files into one vault.",
      "On the staff side your employee record does the routing — approvals reach your supervisor, and approved time off and timesheets flow on to Finance.",
    ],
    quiz: [
      {
        question: "How many of the app's portals are you expected to learn in your first week?",
        options: ["All of them, so you can cover for anyone", "The two or three your role actually uses", "One a week until you've seen them all", "Only the ones you're shown in a meeting"],
        answer: 1,
        explain: "Most staff settle into a small handful of portals. The rest can wait until the work calls for them.",
      },
      {
        question: "How do you open a portal?",
        options: ["Only from the sidebar's Admin section", "From the Portals list, or the + button on the tab bar", "From your e-signature settings", "Each portal has its own separate website"],
        answer: 1,
        explain: "Both the Portals list and the + on the tab bar open the same picker of portals you have access to.",
      },
      {
        question: "You open a portal, then click back to your Main Page tab. What happens to the portal's tab?",
        options: ["It closes and the page is lost", "It stays open and keeps your place", "It signs you out of the portal", "It resets to that portal's first page"],
        answer: 1,
        explain: "Tabs behave like browser tabs — they stay open and return you to the exact page you were on.",
      },
      {
        question: "Someone isn't sure how to do something in the app. Where should they start?",
        options: ["Ask a colleague to do it for them", "The How-To Knowledge Base on their main page", "Reinstall the app", "Wait for the next training session"],
        answer: 1,
        explain: "The How-To Knowledge Base answers plain-language questions from the staff how-to guide, right on the main page.",
      },
    ],
  },
  dashboard: {
    kicker: "What we've learned",
    title: "The Main Page, in one place.",
    body: "Let's bring it all together. The Main Page is where your day starts: portal shortcuts you choose yourself, alerts that need your attention, and the widgets you turn on. Portals open from the Portals list or the plus button, and each one keeps its place as a tab at the top of the screen. Quick Files stores and finds documents without leaving the page. Two things here are real: your e-signature, protected by a PIN, and the Microsoft connection that brings Outlook and Teams into the portal.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/4beb1bcc5_speech.mp3",
    takeaways: [
      "Training Mode simulates everything — except your e-signature and PIN, which are real.",
      "Portals open from the Portals list or the + button, and each opens as a tab that keeps its place.",
      "Shortcut cards are the portals you chose as favourites, and a pinned one sits at the top.",
      "Widgets are turned on and off on the Add Functions page; Quick Files uploads and searches the vault.",
      "Outlook and Teams connect once with your Microsoft sign-in.",
    ],
    quiz: [
      {
        question: "What is the one part of this module that stays on your account afterwards?",
        options: ["The demo clients you created", "Your portal shortcuts", "Your e-signature and its PIN", "The widgets you turned on"],
        answer: 2,
        explain: "Training Mode simulates everything else, but the PIN and signature you set up are real and stay with your account.",
      },
      {
        question: "When you open a second portal, what happens?",
        options: ["It replaces your main page", "It opens in a separate browser window", "It opens as a tab at the top and keeps its place", "You must close the first one"],
        answer: 2,
        explain: "Portals open like browser tabs, and each tab returns you to the exact page you were on.",
      },
      {
        question: "Where do you turn dashboard widgets on and off?",
        options: ["Each widget's own menu", "The Add Functions page, reached from Customize", "Admin settings", "The Portals tab"],
        answer: 1,
        explain: "Add Functions lists every widget as a card; clicking a card turns it on or off and saves right away.",
      },
      {
        question: "What can you do with Quick Files straight from the dashboard?",
        options: ["Email a file to a client", "Upload and search the file vault", "Edit a PDF", "Share a file publicly"],
        answer: 1,
        explain: "Quick Files is for putting a document away and finding it again — it searches by name, description and keywords.",
      },
    ],
  },

  dashboard_widgets: {
    kicker: "What we've learned",
    title: "A home page built for you.",
    body: "To recap: your home page is built from widgets, and every one of them is optional except announcements. On the Add Functions page you click a card to turn a widget on or off, and the change saves straight away. The Personal Organizer is your private to-do space. The How-To assistant answers from Candora's own how-to knowledge first, and falls back to AI when it hasn't been asked before. My Tasks shows work assigned to you, My Reminders shows deadlines you set, and the rest cover notes, birthdays and the clients you touched last.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/20806609b_speech.mp3",
    takeaways: [
      "Widgets are optional panels, except announcements, which everyone sees.",
      "Add Functions is where widgets are switched on and off; changes save immediately.",
      "The Personal Organizer is private to you and follows you across devices.",
      "The How-To assistant answers from Candora's own knowledge first, then AI.",
      "My Tasks lists work assigned to you; My Reminders holds deadlines you set yourself.",
    ],
    quiz: [
      {
        question: "Which widget is always on for everyone?",
        options: ["Quick Notes", "Announcements", "Personal Organizer", "Recent Clients"],
        answer: 1,
        explain: "Announcements is the organization-wide ribbon; the rest are optional panels you choose.",
      },
      {
        question: "How do you turn a widget on or off?",
        options: ["Click its card on the Add Functions page", "Ask an administrator", "Edit your employee file", "Drag it off the dashboard"],
        answer: 0,
        explain: "Every widget appears as a card on Add Functions; clicking it toggles the widget and saves automatically.",
      },
      {
        question: "Where does the How-To assistant look for an answer first?",
        options: ["A general internet search", "Candora's own how-to knowledge", "The central client database", "Your email"],
        answer: 1,
        explain: "It answers from Candora's how-to knowledge first, and only falls back to AI when it hasn't been asked before.",
      },
      {
        question: "What is the difference between My Tasks and My Reminders?",
        options: ["Nothing, they are the same widget", "My Tasks shows work assigned to you; My Reminders shows deadlines you set yourself", "My Tasks is for supervisors only", "My Reminders is shared with your team"],
        answer: 1,
        explain: "My Tasks gathers Compass tasks and to-dos assigned to you; My Reminders is your own list of deadlines.",
      },
    ],
  },

  staffadmin: {
    kicker: "What we've learned",
    title: "Time off and timesheets.",
    body: "What we've learned. Time off is requested on the vacation page, approved by your supervisor, and then fills into the Paid Leave column of your timesheet automatically. Sick and personal days are recorded and need no approval. Your timesheet covers one pay period: enter your start and end times each day, and the totals calculate themselves. Never type in the vacation, sick or personal columns, they fill in for you. Additional hours have their own table. Plan around coverage using the team schedule, and watch your dashboard for approvals and payments.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/37c3de902_speech.mp3",
    takeaways: [
      "Vacation is requested on the time-off page and approved by your supervisor.",
      "Approved time off fills into the Paid Leave column of your timesheet by itself.",
      "Sick and personal days are recorded without approval and feed the same balances.",
      "Enter start, end and break each day — Total Paid Hours calculates; additional hours have their own table.",
      "The team schedule shows approved absences, and approvals appear as dashboard notifications.",
    ],
    quiz: [
      {
        question: "What happens to approved vacation on your timesheet?",
        options: ["You type it into the Vacation column", "It fills into Paid Leave automatically", "Your supervisor enters it for you", "It only appears after payroll runs"],
        answer: 1,
        explain: "Approved time off is filled in and highlighted for you — the time-off columns are never typed by hand.",
      },
      {
        question: "Which of these needs no approval?",
        options: ["A week of vacation", "Submitting a timesheet", "Recording a sick day or personal day", "Claiming a reimbursement"],
        answer: 2,
        explain: "Sick time and personal days are recorded immediately; vacation, timesheets and expenses need approval.",
      },
      {
        question: "Who approves your timesheet?",
        options: ["Finance", "Your supervisor, taken from your employee file's Reports To", "The Executive Director", "You do"],
        answer: 1,
        explain: "Your supervisor comes from your employee file, which is why keeping Reports To current matters.",
      },
      {
        question: "Where do you check who else is off before booking time?",
        options: ["The team schedule", "Your inbox", "The Master List", "Payroll"],
        answer: 0,
        explain: "The team schedule shows everyone's approved absences side by side, so you can plan around coverage.",
      },
    ],
  },

  staffadmin_money: {
    kicker: "What we've learned",
    title: "Receipts, reimbursements and the card.",
    body: "Here is the whole flow. Every claim starts with Add Receipt Entry. Attach the receipt and the autofill fills in the date, supplier and total, or you type them by hand when the read fails. Choose the program, answer the food question, and enter the total with GST. Use the scissors to take personal items off the claim. Saved entries wait in the queue, and Submit for Reimbursement turns them all into one form. Candora MasterCard receipts use the same steps, submitted as one monthly batch to Finance.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/75f621fb2_speech.mp3",
    takeaways: [
      "Every claim starts with Add Receipt Entry, then the paperclip to attach the receipt.",
      "Autofill fills the date, supplier and total — check them, or type them in when the read fails.",
      "The Program field routes the expense to the right funding pot and cannot be skipped.",
      "Food? must be answered; the scissors exclude personal items before GST.",
      "Entries queue up and submit as one form — reimbursements per claim, card receipts as a monthly batch.",
    ],
    quiz: [
      {
        question: "Which field routes an expense to the right funding pot?",
        options: ["Supplier", "Program", "Food?", "Date"],
        answer: 1,
        explain: "The Program dropdown decides which funding pot the expense comes from — it's the one field you can't skip.",
      },
      {
        question: "What does the scissors control do?",
        options: ["Deletes the receipt", "Excludes a personal item from the claim", "Splits the total across programs", "Crops the receipt photo"],
        answer: 1,
        explain: "The scissors subtract a personal item from the claim so only the work portion is reimbursed.",
      },
      {
        question: "How is GST handled when the answer is Food = No?",
        options: ["You type it from the receipt", "It calculates automatically at 5% Alberta GST", "GST never applies", "Finance adds it later"],
        answer: 1,
        explain: "Non-food claims calculate 5% Alberta GST automatically; for food, you enter the GST shown on the receipt.",
      },
      {
        question: "How do several receipts get submitted?",
        options: ["One form per receipt", "All queued entries compile into one form", "They submit automatically", "By email to Finance"],
        answer: 1,
        explain: "Everything waiting in the Not Submitted queue compiles into a single submission.",
      },
    ],
  },

  staffadmin_supervisor: {
    kicker: "What we've learned",
    title: "Approvals, start to finish.",
    body: "To pull it together: approvals come to you. Time-off requests, timesheets and expense submissions all arrive as alerts on your main dashboard, so you never have to go hunting. Approve time off and it books itself into the timesheet. Approve a timesheet and you sign off the pay period, which is what lets Finance run payroll. Approve expenses and they continue on to Finance. Before deciding on time off, look at the team schedule to make sure the days can be covered. Your staff see the outcome on their own dashboard.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/8cfbca8c0_speech.mp3",
    takeaways: [
      "Requests arrive as alerts on your main dashboard — there's nothing to hunt for.",
      "Approving time off books it and fills the staff member's Paid Leave column.",
      "Approving a timesheet signs off the pay period with your e-signature, which lets Finance run payroll.",
      "Expense submissions need your approval before Finance can process them.",
      "Check the team schedule for coverage, and remember your approval is the first step, not the last.",
    ],
    quiz: [
      {
        question: "Where do approval requests appear?",
        options: ["In your email only", "As alerts on your main dashboard", "In the Finance portal", "In the client's file"],
        answer: 1,
        explain: "Banners appear on your dashboard only while something is actually waiting on you.",
      },
      {
        question: "What should you check before approving time off?",
        options: ["The team schedule, for coverage", "The program budget", "The client's action plan", "Nothing, approval is automatic"],
        answer: 0,
        explain: "The team schedule shows everyone's approved absences, so you can judge whether the days can be covered.",
      },
      {
        question: "What does approving a timesheet do?",
        options: ["It pays the employee immediately", "It signs off the pay period so Finance can run payroll", "It creates a new pay period", "It books vacation"],
        answer: 1,
        explain: "Your approval signs off the pay period with your e-signature; Finance uses it to run payroll.",
      },
      {
        question: "What happens to an expense submission once you approve it?",
        options: ["It is paid by you", "It continues on to Finance", "It is archived", "It returns to the staff member"],
        answer: 1,
        explain: "Approved expenses move on to Finance for processing, and the staff member is notified.",
      },
    ],
  },

  pathways: {
    kicker: "What we've learned",
    title: "Your caseload and the Master List.",
    body: "Let's review. Pathways is where you manage your caseload. Home summarizes your day, and My Clients is exactly the people assigned to you by email. The tabs across the top switch between your caseload, the Compass queue, purchase requests and monthly reporting. The Master List holds every client in Pathways. New clients come in through Intake, which checks for duplicates and can link to an existing central database file. Compass tasks track the funder reporting steps, and the client journey, from intake to the action plan and beyond, has its own module.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/d7aa1f3ce_speech.mp3",
    takeaways: [
      "Home summarizes your day; My Clients is the caseload assigned to you by email.",
      "Tabs across the top switch between My Clients, Compass Queue, Purchase Requests and the monthly report.",
      "The caseload folds into DEA, WD, Casual and Rejected sections.",
      "The Master List holds every client — search, filter and open any file from there.",
      "Intake checks for duplicates as you type and syncs the new client automatically once saved.",
    ],
    quiz: [
      {
        question: "Where does every Pathways client live, whatever their stream?",
        options: ["My Clients", "The Master List", "The Compass queue", "Monthly reports"],
        answer: 1,
        explain: "My Clients is only your caseload; the Master List holds every client in Pathways.",
      },
      {
        question: "How is your caseload decided?",
        options: ["You pick clients manually", "Clients assigned to you by email", "Your supervisor's team list", "Alphabetical order"],
        answer: 1,
        explain: "Clients are assigned to you by email, which is why your list is exactly the people you're working with.",
      },
      {
        question: "What does Intake do as you type a new client's name?",
        options: ["Checks their Compass HSID", "Checks for duplicates and can link an existing central database file", "Checks their timesheet", "Checks their employer"],
        answer: 1,
        explain: "Intake matches against the central client database so one person never gets two records.",
      },
      {
        question: "Which module covers intake, the assessment, action plans and placements?",
        options: ["Pathways Case Management", "The Client Journey", "Resource Centre", "Central Registration"],
        answer: 1,
        explain: "The client journey is its own module because it is the most complex part of Pathways.",
      },
    ],
  },

  pathways_journey: {
    kicker: "What we've learned",
    title: "One intake, many roads.",
    body: "What we've learned in Part 1. Every client journey begins at Intake, whether an attendant completes it in the Job Lab or the client fills it out themselves. Next comes the assessment: the Service Navigator works the Barrier Identification Tool and confirms the Employment Readiness Assessment, which is completed in Compass. The determination then sends the client down one of three roads: WD, DEA, or not eligible. For clients who continue, the Employment Action Plan is built from the plan items, and saving it is what unlocks the rest of the program flow.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/ecb94776f_speech.mp3",
    takeaways: [
      "Every journey starts at Intake — completed by the Job Lab attendant or by the client.",
      "The Service Navigator works the Barrier Identification Tool and confirms the ERA.",
      "The ERA is completed in Compass, not in the portal; the portal records the confirmation.",
      "The determination sends the client to WD, DEA, or not eligible.",
      "The Employment Action Plan is built from plan items, and saving it unlocks the rest of the flow.",
    ],
    quiz: [
      {
        question: "Where does every client journey begin?",
        options: ["The action plan", "Intake", "The 90-day follow-up", "A workshop"],
        answer: 1,
        explain: "Intake is the single entry point; everything after it hangs off that record.",
      },
      {
        question: "Who works the Barrier Identification Tool at assessment?",
        options: ["The career counsellor", "The Service Navigator", "The client", "Finance"],
        answer: 1,
        explain: "Barriers are the Service Navigator's part of the assessment; the counsellor picks them up in the plan.",
      },
      {
        question: "Where is the ERA completed?",
        options: ["In the Pathways portal", "In Compass", "On paper", "In the action plan"],
        answer: 1,
        explain: "The Employment Readiness Assessment is done in Compass — the portal records that it was completed.",
      },
      {
        question: "What are the possible determinations?",
        options: ["WD, DEA or not eligible", "Casual, internal or external", "Pending or closed", "Eligible or waitlisted"],
        answer: 0,
        explain: "The determination decides the stream: Workforce Development, Disability Employment, or not eligible.",
      },
    ],
  },

  pathways_journey_part2: {
    kicker: "What we've learned",
    title: "Three routes, one map.",
    body: "To recap Part 2. There are three routes through the program: DEA, WD with an internal placement, and WD with a work exposure placement. The Program Progress tab shows the whole journey on one timeline, and Program Status moves the file through its stages. Placements are updated from the client's file. Referrals widen the circle when another program or agency does part of the work. One milestone closes every road regardless of the route: the 90-Day Follow-Up.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/573505229_speech.mp3",
    takeaways: [
      "Three routes: DEA, WD with an internal placement, WD with a work exposure placement.",
      "Program Progress puts the whole journey — plan items, barriers and placements — on one timeline.",
      "Program Status moves the file through its stages; the action plan drives the milestones.",
      "Placements live on the client's file, and updating one flows through to the related records.",
      "The 90-Day Follow-Up closes every road, whichever route the client took.",
    ],
    quiz: [
      {
        question: "Where do you see a client's whole journey on one timeline?",
        options: ["Program Status", "Program Progress", "The Intake Summary", "Compass"],
        answer: 1,
        explain: "Program Progress lays the plan items, barrier windows and placements out against dates.",
      },
      {
        question: "Which tab moves the file through its stages?",
        options: ["Program Progress", "Program Status", "Referrals", "Employment"],
        answer: 1,
        explain: "Program Status is where the file officially moves from one stage of the program to the next.",
      },
      {
        question: "Which milestone closes every road, whatever the route?",
        options: ["The action plan", "The internal placement", "The 90-Day Follow-Up", "The ERA"],
        answer: 2,
        explain: "Every route ends at the 90-Day Follow-Up — it is the last milestone on all three roads.",
      },
      {
        question: "What do referrals do?",
        options: ["Delete a barrier", "Hand part of the work to another program or agency", "Change the client's stream", "Close the file"],
        answer: 1,
        explain: "Referrals widen the circle: an internal Candora program or an outside agency takes on part of the work.",
      },
    ],
  },

  reception: {
    kicker: "What we've learned",
    title: "The desk, in three moves.",
    body: "To bring it together: find the person, record the visit, and send them to the right place. Appointments holds the day's bookings and lets you check a visitor in the moment they arrive; drop-ins record everyone who walks in, and checking them out keeps the building count honest. Client Visit is where a visit actually becomes a record, whether it was bus tickets handed over or a casework conversation, and Program Registration signs people up without a second list. When the answer isn't one of our programs, Resource Finder finds the outside support. And on a busy shift, Simple mode leaves three cards and three tabs, so nothing gets in the way of the person standing at the desk.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/905251bda_speech.mp3",
    takeaways: [
      "Find the person first: search the central client database before typing a new name.",
      "Appointments are booked, checked in and updated from the one list — visitor and client tabs separate them.",
      "A drop-in records every walk-in; check them out when they leave so the dashboard stays true.",
      "Client Visit turns a visit into a record — grab-and-go resources or a casework conversation with its service category.",
      "Program Registration signs people into any Candora program, and Resource Finder covers the help we don't run ourselves.",
      "Simple mode trims the desk to three cards and three tabs: Appointments, Drop-Ins and Program Registration.",
    ],
    quiz: [
      {
        question: "Someone walks in with no appointment. What do you record?",
        options: ["A visitor appointment for now", "A drop-in with their arrival time and who they're seeing", "A program registration", "Nothing until their worker arrives"],
        answer: 1,
        explain: "Walk-ins are drop-ins: they record arrival, purpose and staff member, and get checked out when they leave.",
      },
      {
        question: "A visitor with a booking has just arrived. What's the one action that matters most?",
        options: ["Check them in on their appointment row", "Create a second appointment", "Log a client visit", "Email the staff member"],
        answer: 0,
        explain: "Checking in marks them attended, so the staff member knows their visitor is in the building.",
      },
      {
        question: "Where does what you record during a client visit end up?",
        options: ["In a reception-only list", "On that client's file in the central client database", "In an email to the caseworker", "Nowhere until Finance reconciles it"],
        answer: 1,
        explain: "Visits are written into the client's service history, which caseworkers and funder reporting read.",
      },
      {
        question: "What does Simple mode do to Reception?",
        options: ["Hides the client's personal information", "Leaves three cards and three tabs: Appointments, Drop-Ins, Program Registration", "Turns off program registration", "Shares your dashboard with other staff"],
        answer: 1,
        explain: "It trims your own view to the three front desk moves, and only affects your account.",
      },
    ],
  },

  ell: {
    kicker: "What we've learned",
    title: "Learners, classes and the waitlist.",
    body: "In summary, the ELL portal covers the language program in five places. Learners holds the roster with each person's CLB level, status and class. Classes carry the schedule, room and instructor, and inside a class you manage attendance, lesson plans and notes. Courses are the curriculum offerings across terms. The waitlist tracks the contact state of everyone waiting for a seat, which is what keeps it manageable. Assessments record CLB levels before and after, so progress over time is visible.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/3798ddf20_speech.mp3",
    takeaways: [
      "Learners shows each person's CLB level, enrollment status and class assignment.",
      "Classes carry schedule, room and instructor; open a class for attendance, lesson plans and notes.",
      "Courses are the curriculum offerings learners are placed into across terms.",
      "The waitlist tracks each person's contact state — keeping it current is what makes it manageable.",
      "Assessments record CLB levels before and after, showing progress over time.",
    ],
    quiz: [
      {
        question: "Where do you manage attendance, lesson plans and notes?",
        options: ["Learners", "Inside a class", "Courses", "Assessments"],
        answer: 1,
        explain: "Open a class to reach its attendance, lesson plans and notes for that group.",
      },
      {
        question: "What else does the waitlist keep track of, besides who is waiting?",
        options: ["Test scores", "Each person's contact state", "Classroom capacity", "Instructor availability"],
        answer: 1,
        explain: "States like waiting, contacted or assessment booked are what make the waitlist workable.",
      },
      {
        question: "What do assessments record?",
        options: ["Attendance hours", "CLB levels before and after", "Payment status", "Transportation needs"],
        answer: 1,
        explain: "Recording the level before and after is what makes each learner's progress visible.",
      },
      {
        question: "What are courses?",
        options: ["Individual learner files", "The curriculum offerings learners can be placed into across terms", "Completed classes", "Waitlist groups"],
        answer: 1,
        explain: "Courses describe what is taught; learners are placed into them term by term.",
      },
      {
        question: "An instructor isn't showing up in a class's instructor list — why?",
        options: ["They teach a different CLB level", "They have not been added here, or their status is not active", "Only managers can choose instructors", "The class has no room set"],
        answer: 1,
        explain: "An instructor must exist on the Instructors page and be active before a class can name them.",
      },
      {
        question: "A learner says they were already registered at the front desk. What do you do first?",
        options: ["Add them as a new learner", "Search the roster and update the existing learner", "Put them on the waitlist", "Ask Central Registration to delete the registration"],
        answer: 1,
        explain: "Central Registration can create the learner record here, so search first — one person, one learner record.",
      },
    ],
  },

  centralreg: {
    kicker: "What we've learned",
    title: "The shared front door.",
    body: "What we've learned. Central Registration is the shared front door for programs. The dashboard shows registrations, capacity and requests across all programs. Programs and their sessions, with capacity controls, live in Programs. Registrations carries every participant with its status, and approving one can create the participant record in the program's own portal. When a program is full, registrations land on the waitlist with a position. Self-registration requests arrive from program QR codes for approval, and the calendar shows what is running where.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/e105ed4bd_speech.mp3",
    takeaways: [
      "The dashboard shows registrations, capacity and requests across every program.",
      "Programs and their sessions, with capacity controls, live in Programs.",
      "Approving a registration can create the participant record in the program's own portal.",
      "Full programs send registrations to the waitlist with a numbered position.",
      "QR self-registrations arrive for approval, and the calendar shows sessions by day and room.",
    ],
    quiz: [
      {
        question: "Where do QR self-registrations arrive?",
        options: ["All Registrations", "Registration Requests", "Waitlists", "The Calendar"],
        answer: 1,
        explain: "People who scan a program's QR code land in Registration Requests for you to approve, waitlist or decline.",
      },
      {
        question: "What happens when a program is full?",
        options: ["The registration is declined", "It lands on the waitlist with a position", "It creates a new session", "It goes to Finance"],
        answer: 1,
        explain: "Waitlisted registrations keep their position so seats can be offered in a fair order.",
      },
      {
        question: "What can approving a registration do?",
        options: ["Email the participant's employer", "Create the participant record in the program's portal", "Book a room", "Change the program's capacity"],
        answer: 1,
        explain: "Approving a registration can automatically create the participant record in that program's own portal.",
      },
      {
        question: "Where do you check what is running in which room?",
        options: ["Programs", "Registrations", "The calendar", "Waitlists"],
        answer: 2,
        explain: "The calendar lays sessions out by day and room — the fastest answer to 'what's running when'.",
      },
      {
        question: "What happens when a program area is already full?",
        options: ["Registration is blocked entirely", "The Register button adds the person to the waitlist instead", "A new area is created", "The capacity maximum is raised automatically"],
        answer: 1,
        explain: "A full area turns the same Register button into Add to Waitlist, so nobody is lost — they keep a queued place.",
      },
      {
        question: "Where do volunteer applications get approved?",
        options: ["The Volunteer Manager only", "Volunteer Registration in Central Registration", "Programs & Registration", "Registration Requests"],
        answer: 1,
        explain: "Volunteer Registration processes applications, and every decision updates the same Volunteer record the Volunteer Manager uses.",
      },
      {
        question: "A program shows no sessions scheduled — what does that mean?",
        options: ["It is closed for the year", "Register is disabled until a session is created", "It only accepts volunteers", "Waitlists are not available"],
        answer: 1,
        explain: "Registrations need a date to belong to. Create Session adds one, and Register becomes available again.",
      },
      {
        question: "Once someone is enrolled, whose job is their attendance and progress?",
        options: ["Central Registration", "The program's own portal", "The Volunteer Manager", "Finance"],
        answer: 1,
        explain: "Central Registration keeps the registration; the program's portal takes over once the person is in.",
      },
      {
        question: "If a program is set to register instantly, where does a QR sign-up go?",
        options: ["Straight into the program with no review", "Still into Registration Requests, already approved", "Nowhere until the person calls", "Straight to the waitlist"],
        answer: 1,
        explain: "The request still lands in Registration Requests — it just arrives already approved instead of waiting on you.",
      },
      {
        question: "Who gets offered a seat first when one opens?",
        options: ["The most recent sign-up", "Position one on the waitlist", "Whoever calls that morning", "Whoever a counsellor chooses"],
        answer: 1,
        explain: "Positions are offered in order and contact attempts are recorded, so nobody is quietly skipped.",
      },
    ],
  },

  pathways_assessment: {
    kicker: "What we've learned",
    title: "The assessment, start to finish.",
    body: "Let's review the assessment. It begins on the Intake page, where a client waits in Awaiting Assessment until you press Assess. You verify the client information first, before any barriers. Then the Barrier Identification Tool records each barrier with its challenges and action steps, and the ERA is confirmed, completed in Compass, with the form uploaded. You can suggest action plan items for the counsellor and explain them in your notes. Finally you answer the Service Navigator question, and completing the assessment sends the client on to assignment.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/ef1c3119b_speech.mp3",
    takeaways: [
      "Press Assess on the Intake page — it opens the client's details first, not the barriers.",
      "Verify the client information before recording anything in the BIT.",
      "The BIT records each barrier with its challenges and action steps; a barrier without steps is only an observation.",
      "The ERA is completed in Compass — confirm it, upload the form and write your notes.",
      "Suggested action plan items and the Service Navigator question finish the assessment, which sends the client to assignment.",
    ],
    quiz: [
      {
        question: "What does pressing Assess show first?",
        options: ["The Barrier Identification Tool", "The client's details, to verify", "The action plan", "Compass"],
        answer: 1,
        explain: "The assessment opens on the client overview so the file can be checked before barriers are recorded.",
      },
      {
        question: "Where is the ERA actually completed?",
        options: ["In the Pathways portal", "In Compass", "In a Word document", "By Finance"],
        answer: 1,
        explain: "The ERA is completed in Compass; the portal records the confirmation and keeps the uploaded form.",
      },
      {
        question: "What does the Service Navigator question decide?",
        options: ["The client's stream", "Whether a Service Navigator is assigned to work the barriers", "The client's billing code", "The intake date"],
        answer: 1,
        explain: "Yes assigns a navigator to the barrier work; No leaves the barriers with the career counsellor's plan.",
      },
      {
        question: "Where does the client go once the assessment is complete?",
        options: ["Closed", "Assessment Complete — Awaiting Assignment", "Straight to their action plan", "The waitlist"],
        answer: 1,
        explain: "Completing the assessment is the handoff — the stream and counsellor are chosen on the Intake page.",
      },
    ],
  },

  pathways_service_nav: {
    kicker: "What we've learned",
    title: "Barriers and referrals.",
    body: "To recap service navigation. Once you are assigned as navigator, the barrier work in the file is yours, week to week. Barriers arrive from the BIT as editable cards, and only you can change them. A barrier is moved to resolved only when the need is genuinely met, with an end date and a note recording what worked. Review dates and barrier windows sit on the timeline beside the counsellor's plan items. Internal referrals hand a barrier to another Candora program and raise an open referral on that program's dashboard. The assessment itself stays on the file as the record of why.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/de463369a_speech.mp3",
    takeaways: [
      "Barriers arrive from the BIT as editable cards — the barrier work is the navigator's step.",
      "Only the assigned Service Navigator can edit barriers; everyone else sees them read-only.",
      "Resolving a barrier requires an end date and a note explaining how it was resolved.",
      "Barrier windows and review dates sit on Program Progress beside the counsellor's plan items.",
      "Internal referrals raise an open referral on the receiving program's dashboard; external ones stay on the file.",
    ],
    quiz: [
      {
        question: "Who can edit a client's barriers?",
        options: ["Any Pathways staff member", "Only the assigned Service Navigator", "The counsellor", "Supervisors"],
        answer: 1,
        explain: "Everyone else sees the same cards read-only, with a lock note beside the heading.",
      },
      {
        question: "What must accompany a barrier marked resolved?",
        options: ["Just the status change", "An end date and a note on how it was resolved", "A referral", "A Compass task only"],
        answer: 1,
        explain: "The resolution note is the record of what worked — it's what a teammate reads months later.",
      },
      {
        question: "Where do the items you suggested at assessment show up?",
        options: ["On the client's profile header", "Inside the counsellor's Employment Action Plan step", "On the dashboard", "In the BIT / ERA tab"],
        answer: 1,
        explain: "Your ticks and notes wait in the counsellor's plan, so the plan starts from what the BIT revealed.",
      },
      {
        question: "What happens when you save a new internal referral?",
        options: ["Nothing until the program contacts you", "It raises an open referral on that program's dashboard", "It emails the client", "It closes the barrier"],
        answer: 1,
        explain: "The receiving Candora program sees the client's name and who sent it, so you don't have to chase it.",
      },
    ],
  },

  pathways_workshops: {
    kicker: "What we've learned",
    title: "Workshops feed the plan.",
    body: "In summary, workshops live inside Pathways because attendance feeds the action plan. All Workshops holds the active ones as cards, Schedule lays the sessions out by date, and Completed keeps the history. Capacity is what the roster counts against. Job Club has its own shortcut with the weekly details already filled in. Rosters are taken per session date, not per workshop. And completing a workshop marks the matching action plan item complete on every client marked as attended.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/2bb51cd38_speech.mp3",
    takeaways: [
      "Three views: All Workshops (cards), Schedule (by date) and Completed (history).",
      "Capacity is what the roster counts sign-ups against — it isn't decoration.",
      "Job Club has its own shortcut with the standing weekly details pre-filled.",
      "A roster belongs to one session date, not to the workshop in general.",
      "Completing a workshop marks the matching action plan item complete for everyone marked attended.",
    ],
    quiz: [
      {
        question: "Which workshop has a shortcut with the details pre-filled?",
        options: ["Every new workshop", "Job Club", "Community Lunch", "Internal Training"],
        answer: 1,
        explain: "Job Club is the standing weekly session, so its form opens already filled in.",
      },
      {
        question: "What is a roster attached to?",
        options: ["The workshop in general", "One specific session date", "The facilitator", "The action plan"],
        answer: 1,
        explain: "A weekly workshop has a different room of people each week, so the roster is per session date.",
      },
      {
        question: "What does completing a workshop do?",
        options: ["Archives it", "Marks the matching action plan item complete on every client marked attended", "Emails the roster", "Bills the funder"],
        answer: 1,
        explain: "Attendance you took becomes progress on each client's roadmap without anyone updating files by hand.",
      },
      {
        question: "What is capacity used for?",
        options: ["Room booking", "Counting sign-ups against the roster", "Payroll", "Billing"],
        answer: 1,
        explain: "Each card shows how many of the capacity are already signed up for the next session.",
      },
    ],
  },

  filemanager: {
    kicker: "What we've learned",
    title: "One vault, many doors.",
    body: "Let's review the File Manager. It is the document vault behind the whole portal: the Quick Files widget on your home page, the upload card on every portal dashboard, receipts and signed documents all land in it, so you already use it without opening it. When you do upload, the details are the work — a display name, a category, an access level, a description and keywords. Access level is the setting you cannot fix later on behalf of someone who cannot see the file, so choose the least open level that still does the job. And the rest you reach for when the day calls for it: bulk import for a stack, collections for a package, and notes to keep the context with the document.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/fa8603833_speech.mp3",
    takeaways: [
      "The vault is behind the whole portal — dashboard Quick Files, portal upload cards, receipts and signed documents all file here.",
      "Uploading well means a display name, a category, an access level, a description and keywords.",
      "Access level is set by clicking its card while you upload — personal, universal, manager, finance or corporate — and some cards only appear for the roles they belong to. You only see what you're allowed to open.",
      "Each portal files into its own folder, so an ELL document and a Finance document never mix.",
      "Bulk Import, Collections, My Workspace and Notes are there when a single upload isn't enough.",
    ],
    quiz: [
      {
        question: "A file is uploaded from a portal's dashboard upload card. Where does it land?",
        options: ["In My Files, as personal", "In that portal's own folder in the vault", "In the dashboard, not the vault", "In an email attachment"],
        answer: 1,
        explain: "Each portal files into its own SharePoint folder, which shows as a sub-folder under All Files.",
      },
      {
        question: "What does a file's access level control?",
        options: ["Which folder it sits in", "Who is allowed to open it", "What the file is called", "How large it can be"],
        answer: 1,
        explain: "It's the gate on the file. Which level is right depends on what the file is and who needs it, so pick the narrowest one that still does the job.",
      },
      {
        question: "A file you expect isn't showing in All Files. What do you check first?",
        options: ["The access filter and your permissions", "The storage-used count", "Whether the file is a PDF", "The dashboard counters"],
        answer: 0,
        explain: "The vault only returns files you're authorized to see — the access filter explains most missing files.",
      },
      {
        question: "What are keywords for?",
        options: ["They rename the file", "They're what the searches match on later", "They set the access level", "They replace the category"],
        answer: 1,
        explain: "Quick Files and the vault search both match keywords — they're how a file gets found months later.",
      },
    ],
  },
  filemanager_advanced: {
    kicker: "What we've learned",
    title: "Keeping a vault usable at scale.",
    body: "Let's bring the advanced side together. Finding a file you only half remember is the search page's job, because it matches the display name, the original name, the description, the summary and the keywords, and it only returns what you are allowed to open. The amber banner is the sorting queue, one file at a time, and an empty queue is what keeps the categories trustworthy. Collections group existing files for one hand-over without copying them, and your workspace groups the files of one piece of work without moving them. The editor annotates a document and saves it as a new file, leaving the original alone, and notes keep the context searchable. Sharing never bypasses permissions, and folders are created and secured in Users and Access.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/95c7f7331_speech.mp3",
    takeaways: [
      "The search page matches description, summary and keywords too, then narrows by category and access level.",
      "The amber banner is the sorting queue: one file at a time, a category each, and the banner clears when it's empty.",
      "A collection is a hand-over set of existing files — nothing is copied, and deleting it never deletes the files.",
      "The editor annotates a document and saves it as a new file, so the original stays untouched.",
      "A shared link never bypasses permissions, and folders are created or renamed in Users and Access.",
    ],
    quiz: [
      {
        question: "A file you know exists doesn't come back from the search page. What is the most likely reason?",
        options: ["The search only covers names", "You don't have its access level", "The file is a PDF", "Search skips older files"],
        answer: 1,
        explain: "Search reads every field but only returns files you're allowed to open, so permissions are the usual answer.",
      },
      {
        question: "What happens to the files inside a collection when you delete the collection?",
        options: ["They're deleted with it", "They move to My Files", "They stay where they're filed", "They become unsorted"],
        answer: 2,
        explain: "A collection is only a grouping — the files themselves are never copied, moved or deleted with it.",
      },
      {
        question: "You annotate and sign a PDF in the File Editor and save it. What happens to the original?",
        options: ["It's overwritten", "It's moved to the sorting queue", "It stays untouched", "It's deleted after a week"],
        answer: 2,
        explain: "The marked-up version is saved into the vault as a new file; the original is left exactly as it was.",
      },
    ],
  },
  central_database_basics: {
    kicker: "What we've learned",
    title: "One file, read and written by every program.",
    body: "Let's bring it together. The central database holds one file per person, and every Candora program works from it. You find someone in Database and narrow the list by program area, status, funder or demographics. Inside the file the header gives you the facts, the program strips tell you which portals are already involved, and the safety alerts are read before any conversation. Add Note and Client Visit are the two records you will write most, and both land on this one file. The habit that keeps all of it working is simple: look for the existing file before you create a new one.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/800ad4dbe_speech.mp3",
    takeaways: [
      "Every person has one file here, however many programs they walk through.",
      "Database searches the name or email; program area, status, funder and demographics answer the real questions.",
      "The header gives the facts, the program strips show which portals are involved, and safety alerts are read first.",
      "Add Note and Client Visit both write to this one file, and every program reads it back.",
      "Session registration in another portal adds a condensed profile and its program strip here automatically.",
    ],
    quiz: [
      {
        question: "Where does every client file in the central database live?",
        options: ["Referrals", "Case Management", "Database", "The dashboard"],
        answer: 2,
        explain: "Database is the full list of client files; the other pages read from the records it holds.",
      },
      {
        question: "What do the coloured strips on a client file show?",
        options: ["Their payment history", "Which Candora programs the person is already part of", "Their attendance at workshops", "Their assigned worker's other clients"],
        answer: 1,
        explain: "Each program that knows the person writes its own strip, so you see every involvement at a glance.",
      },
      {
        question: "Someone is registered in the ELL portal. What happens to their central file?",
        options: ["A new central file is created every time", "A condensed profile and an ELL strip are added to the same file", "Nothing until staff copy it over by hand", "The file is locked until ELL closes it"],
        answer: 1,
        explain: "The program portal syncs a condensed profile and its participation strip into the central record.",
      },
      {
        question: "What should you always do before creating a client record?",
        options: ["Ask the client to fill the form twice", "Search for an existing file and link it", "Check the finance portal", "Create two so one can be deleted"],
        answer: 1,
        explain: "The intakes and this portal both look for an existing file first; linking keeps one complete history.",
      },
    ],
  },

  central_database_advanced: {
    kicker: "What we've learned",
    title: "Stewardship: links, logs and the truth of the file.",
    body: "To recap the advanced side. The central record owns identity and case work, while each program portal owns its own program detail, and the sync only writes the participation strip. A confirmed link is what makes a program's next sync update this file instead of searching for a match, so a name variant or a missing email is exactly how duplicates appear. Referrals have to be moved on, service logs carry the funder category that reporting counts, and Case Management is where needs, priorities and the intensive workspace live. Every program that works with the person reads this file, so write what a colleague needs and nothing more.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/924180f6b_speech.mp3",
    takeaways: [
      "The central record owns identity and case work; program portals own their own program detail.",
      "Program strips are written by the programs — a missing strip means that program has never recorded them.",
      "A confirmed link makes future syncs update this record; without one, matching falls back to email then name and date of birth.",
      "Referrals need their status moved on, and service logs with duration and funder category are what reporting counts.",
      "Case Management holds needs, priorities and the intensive workspace; write only what a colleague needs.",
    ],
    quiz: [
      {
        question: "Who owns a client's Pathways plan, barriers and placements?",
        options: ["The central database", "The Pathways portal", "Finance", "Whoever last edited the central file"],
        answer: 1,
        explain: "Program detail stays in the program portal; the central record keeps identity and case work.",
      },
      {
        question: "What does a confirmed link between a program record and a central file do?",
        options: ["Copies the whole file into the program portal", "Makes that program's future syncs update the central record", "Locks the central file from editing", "Moves the client out of other programs"],
        answer: 1,
        explain: "With a link the sync updates the known record instead of searching, which is what prevents duplicates.",
      },
      {
        question: "What are the funder reports built from?",
        options: ["Notes typed on the dashboard", "Service logs with type, duration and funder category", "The program strips", "The referral list"],
        answer: 1,
        explain: "Service logs are the reporting layer, which is why a loosely logged visit becomes a number nobody can defend.",
      },
      {
        question: "A referral has been sitting at the same status for weeks. What does that mean?",
        options: ["The referral is complete", "It is an unfinished piece of work", "It was declined automatically", "Nothing, status is optional"],
        answer: 1,
        explain: "Referrals record progress between us and the receiving party; a status that never moves means nobody followed up.",
      },
    ],
  },
  frn: {
    kicker: "What we've learned",
    title: "A referral is a promise, and a session is the proof.",
    body: "Bringing the FRN portal together. A participant record holds the person and a referral holds the request into a program, so one person stays one file however many groups they attend. Programs carry the coordinator, capacity, schedule and documents; sessions carry the date, room, facilitator and who actually attended. Assessments record the starting picture, progress notes and goals live on the participant's own file, and when part of the work belongs to another Candora program you refer the person onward from that file. Referrals into FRN arrive on the FRN dashboard, which is why the status has to move.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/a8c4baeb9_speech.mp3",
    takeaways: [
      "A participant holds the person; a referral holds the request — program, source, date and status.",
      "Match against the Candora Central Database before creating a participant, so one person stays one record.",
      "Programs carry the coordinator, capacity, schedule and their documents.",
      "Sessions are the dates a program meets, and attendance is marked per participant per date.",
      "Assessments, goals and progress notes live on the participant's file, not in an email.",
      "Refer onward from the file — the receiving program sees it on their own dashboard.",
    ],
    quiz: [
      {
        question: "A family has been referred to Connect Parent Group. Where does the request itself live?",
        options: ["As a note on the participant record", "In a referral carrying the program, source, referrer and status", "In the program's description", "In an email to the facilitator"],
        answer: 1,
        explain: "The referral is the request; the participant is the person. Keeping them separate is what lets someone be referred to two programs without duplicating the person.",
      },
      {
        question: "What does the participant record hold, as opposed to a referral?",
        options: ["Only attendance", "The person and everything about them across programs", "The program's capacity", "The session schedule"],
        answer: 1,
        explain: "One participant, one record. Every referral, goal, note and attendance mark hangs off it.",
      },
      {
        question: "You mark a session's attendance. Where does it show up next?",
        options: ["Only on that session", "On each participant's attendance history", "Nowhere until the session is completed", "On the program card as a document"],
        answer: 1,
        explain: "Attendance is stored per participant per date, which is why marking it on the day is worth the two minutes.",
      },
      {
        question: "A program is renamed after sessions were already scheduled. What happens to those sessions?",
        options: ["They are orphaned", "They carry forward, because each session holds its program by name", "They must all be rescheduled", "They are deleted"],
        answer: 1,
        explain: "Sessions and referrals hold the program name, so renaming carries forward instead of breaking the link.",
      },
    ],
  },
  phac: {
    kicker: "What we've learned",
    title: "Drop-in work still leaves a record.",
    body: "Bringing PHAC together. It is drop-in work: families register rather than waiting on an approval, and every program states its age range, category, schedule and capacity across a September to June season. Sessions are the record of a real date — time, room, repeat pattern and attendance marked family by family, with the adults, children and total headcount alongside. The family file is what you return to: child and guardian details, emergency contact, every session attended, and the progress notes that say what you saw and what happens next.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/fa38d505c_speech.mp3",
    takeaways: [
      "PHAC is drop-in: families register, and there is no referral to approve.",
      "Every program states its age range, category, schedule and capacity — and pauses July and August.",
      "Sessions carry the date, room, facilitator and a repeat pattern instead of being retyped weekly.",
      "Attendance is marked per family per date, with adults, children and total attendees recorded.",
      "Progress notes hold the observation, a rating and the next steps for whoever picks the family up next.",
      "Link the Central Database record, or the child appears twice with half their history in each place.",
    ],
    quiz: [
      {
        question: "A parent asks whether PHAC has room for their two-year-old. What answers that first?",
        options: ["The referrals list", "The program's age range, capacity and status on its card", "The progress notes", "The Central Database"],
        answer: 1,
        explain: "Age range, capacity and status decide whether a family can walk into a program — that is what the program card is for.",
      },
      {
        question: "Sessions run every Tuesday from September to June. How do you set that up?",
        options: ["Create each Tuesday by hand", "Create one session and set Repeats to weekly with a Repeat Until date", "Write it in the program's description", "Mark attendance weekly"],
        answer: 1,
        explain: "One session with a repeat pattern creates the run, so anyone planning around it sees the dates.",
      },
      {
        question: "A child attended three sessions. Where is that visible?",
        options: ["On the program card", "In the family's attendance history", "Only in that session's notes", "In the Central Database program strip"],
        answer: 1,
        explain: "Each attendance mark lands on the family's file, which is how engagement is shown rather than claimed.",
      },
      {
        question: "You notice a caregiver making real progress. What is the right record?",
        options: ["A note in your own notebook", "A progress note with the observation, a rating and next steps", "An email to a colleague", "Set the family's status to inactive"],
        answer: 1,
        explain: "The progress note is the shared record: what you saw, what it means, and what happens next.",
      },
    ],
  },
  rworker: {
    kicker: "What we've learned",
    title: "A smaller door, the same record.",
    body: "Bringing the Resource Worker portal together. It is a smaller door into the same central client database, and that is the whole point: you see your caseload and the actions you take on it, not every record in the organization. Case Management opens on My Clients, with intensive services, general clients and caregiver capacity for children under six beside it, and each row carries the worker, the visit count and the case status. Opening a file gives you the person, the notes the next worker must see, and the service history, appointments and referrals underneath. Edit Client writes straight to the shared record, Log Visit / Service records what happened, Schedule books the next conversation, and Referral sends the need on to a program or an outside agency. Client Visit runs the same drop-in and scheduled flow the front desk uses, without Grab and Go. Resource Finder answers what our own programs cannot. And an intensive case still lives in the Central Database — the banner on the file takes you there, while the day-to-day history stays on the client record.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/f808ee8b6_speech.mp3",
    takeaways: [
      "This portal edits the same client records as the Central Database — there is no copy and no sync to wait for.",
      "Case Management opens on My Clients; intensive services, general clients and caregiver capacity sit beside it.",
      "Edit Client saves to the shared record, so corrections show everywhere at once.",
      "Log Visit / Service is the history supervisors, caseworkers and funders read — write it specifically.",
      "Appointments and referrals are recorded against the file, not remembered in a message.",
      "Client Visit offers drop-in casework and scheduled visits; Grab and Go stays at the front desk.",
    ],
    quiz: [
      {
        question: "You correct a client's phone number in this portal. Where is that change visible?",
        options: ["Only in the Resource Worker portal", "On the shared client record, so the Central Database shows it immediately", "Only after the nightly sync", "In the client's service history"],
        answer: 1,
        explain: "Both portals read and write the same record — saving in Edit Client updates the client itself.",
      },
      {
        question: "Which tab opens first in Case Management, and what does it show?",
        options: ["Intensive Services, showing every family in the organization", "My Clients, showing the open files assigned to you", "General Clients, showing all drop-ins", "Caregiver Capacity, showing every child under six"],
        answer: 1,
        explain: "Case Management opens on your own caseload; the categories beside it widen the view when you need to look further.",
      },
      {
        question: "A client walks in with no appointment. Which do you record?",
        options: ["Grab and Go Resources", "Drop-In Casework", "Scheduled Visit", "An intensive case note"],
        answer: 1,
        explain: "This portal's visit flow offers Drop-In Casework and Scheduled Visit; Grab and Go belongs to the front desk.",
      },
      {
        question: "Where does an intensive case plan live?",
        options: ["In the Resource Worker portal, under Case Management", "In the Central Database portal, opened from the client's case banner", "In the service log", "In the resource finder"],
        answer: 1,
        explain: "The plan, stages and tasks are a bigger file than this portal holds — the case banner takes you to it, while the history stays on the client record.",
      },
    ],
  },
  childminding: {
    kicker: "What we've learned",
    title: "A session first, then a child at a time.",
    body: "Childminding runs while a parent or guardian is in a program, and it has two halves that must not be confused. Sessions are the containers: a date, a start and end time, a location and a capacity in children, set up ahead of time — normally by the program assistant, matching the program timetable — so nobody at the desk has to invent one first thing in the morning. Inside a session each child is signed in as one intake record: the child, the parent or guardian, the date, the check-in time and the program the parent is attending. At pickup the check-out time is added, hours calculate and round up to the next fifteen minutes, and the billing amount follows the program. Pathways is the billable one at twenty dollars a child per hour; ELL and other programs are recorded but not charged. Keep the check-outs current, because a record without one is a child with no hours and a bill nobody can send.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/0327c5f8b_speech.mp3",
    takeaways: [
      "A session holds the date, times, location and capacity — and a child cannot be signed in without one.",
      "Sessions are normally created ahead of time by the program assistant, not improvised at drop-off.",
      "Capacity is the whole room across every program, not one program's share of it.",
      "Each visit is one intake record: child, parent or guardian, date, check-in, check-out and program.",
      "Hours come from the times and round up to the next fifteen minutes; Pathways bills $20/child/hour.",
      "Export the month from Records, after checking no record is missing its check-out.",
    ],
    quiz: [
      {
        question: "It is 8:55 am and there is no session for today. What comes first?",
        options: ["Sign the child in as an individual record and fix it later", "Create the session, then sign children into it", "Send the parent home", "Add the child's hours after lunch"],
        answer: 1,
        explain: "A session is the container children are signed into, so it has to exist first — usually the program assistant has already set it up ahead of time.",
      },
      {
        question: "Who normally creates sessions, and when?",
        options: ["Childcare staff, at drop-off", "The program assistant, ahead of time against the program timetable", "Finance, at month end", "The parent, on the registration form"],
        answer: 1,
        explain: "Sessions are set up in advance by the program assistant; whoever runs the room opens an existing one.",
      },
      {
        question: "A child is picked up at 11:20 after a 9:05 sign-in. What does the record show?",
        options: ["2 hours, as typed", "2.5 hours — rounded up to the next fifteen minutes", "3 hours", "Nothing until finance edits it"],
        answer: 1,
        explain: "Hours are calculated from the times and rounded up to the next fifteen-minute increment.",
      },
      {
        question: "Which children are billed for childminding?",
        options: ["All of them at $20/hour", "Pathways children at $20/child/hour; ELL and other programs are not charged", "Only ELL children", "None — childminding is always free"],
        answer: 1,
        explain: "Pathways is the billable program; other programs are recorded for reporting only.",
      },
    ],
  },
  empoweru: {
    kicker: "What we've learned",
    title: "A cohort is a class, and a seat is a promise.",
    body: "Bringing the EmpowerU portal together. Cohorts are the classes: dates, delivery mode, location, facilitator and capacity, two or three a year. People arrive either through the cohort's registration link, where staff approve or reject the application, or as a referral, and each one becomes a registration — registered, waitlisted or enrolled — hanging off a cohort. While they wait, the waitlist tracks the contact. Once enrolled, Account Setup follows them through to an ATB savings account, and Program Documents holds the paperwork against the person. Funder Reports is a view of the official workbook, not the place the work happens, so do the work in the portal and let the tracker follow.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/067d022c4_speech.mp3",
    takeaways: [
      "A cohort holds the dates, delivery mode, location, facilitator and capacity — two or three run each year.",
      "Registrations hang off a cohort: registered, waitlisted, enrolled, withdrawn, completed or declined.",
      "Applications arrive through the cohort's link and staff approve or reject them; approving creates the person.",
      "The waitlist is contact work — a contact state, the last contact and the next follow-up date.",
      "Account Setup is the ATB pipeline, advanced step by step as it actually happens.",
      "Funder Reports shows the official workbook; the portal stays the place the work is done.",
    ],
    quiz: [
      {
        question: "Two people ask how many seats are left in a cohort. Where does that answer come from?",
        options: ["The funder workbook", "The cohort's capacity against its enrolled registrations", "The waitlist status chips", "The participant's service log"],
        answer: 1,
        explain: "Capacity belongs to the cohort, and the enrolled registrations against it are what staff read off the card.",
      },
      {
        question: "Someone fills out the registration link. What has actually happened to their seat?",
        options: ["They are enrolled immediately", "An application is awaiting approval on the cohort's page", "They are added to the waitlist automatically", "Nothing at all"],
        answer: 1,
        explain: "The form creates an application; staff approve it, which creates the participant and the registration.",
      },
      {
        question: "A participant is waiting for a seat. What does the waitlist actually track?",
        options: ["Their attendance", "Their contact state, last contact and follow-up date", "Their savings balance", "Their documents"],
        answer: 1,
        explain: "The waitlist is contact work — who was reached, how and when the next follow-up is due.",
      },
      {
        question: "Where does the ATB savings account step belong?",
        options: ["In the program description", "In Account Setup, advanced as each step happens", "In the funder workbook only", "In a document upload"],
        answer: 1,
        explain: "Account Setup is the pipeline that shows where each enrolled participant is in opening their account.",
      },
    ],
  },
};

export const getModuleRecap = (key) => MODULE_RECAPS[key] || null;
export const getModuleQuiz = (key) => MODULE_RECAPS[key]?.quiz || [];