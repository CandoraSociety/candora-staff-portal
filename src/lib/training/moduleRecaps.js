// ── "What we've learned" wrap-up per training module ──────────────────────
// Every module ends with a short narrated recap (a scene that plays like the
// intro video: the narration is the clock, static MP3s, same female voice)
// plus a short quiz. The quiz is optional per module — a module without a
// `quiz` array simply skips straight to practice.
//
// recap:  { kicker, title, body, audioUrl, takeaways[] }
// quiz:   [{ question, options[], answer, explain }]
//         answer = index of the correct option.
export const MODULE_RECAPS = {
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

  rc: {
    kicker: "What we've learned",
    title: "One record per person.",
    body: "To bring it together: the Resource Centre is our central client database. The dashboard gives you the overview, and Clients holds every file. Inside a file you will find contact details, notes, needs, visits and referrals, with safety alerts at the top that you always read first. New clients are registered through Intake, where the duplicate matcher stops us creating two records for one person. Referrals are tracked in both directions, and complex files get the deeper support of intensive case management.",
    audioUrl: "https://media.base44.com/files/public/6a249282cb496579542673b7/a48c51e2b_speech.mp3",
    takeaways: [
      "The Resource Centre is the central client database — every client file lives in Clients.",
      "A file holds contact details, notes, needs, visits and referrals.",
      "Safety alerts sit at the top of a file and are read before any sensitive conversation.",
      "Intake's duplicate matcher keeps one record per person; link an existing file instead of creating a new one.",
      "Referrals are tracked in both directions, and complex files move to intensive case management.",
    ],
    quiz: [
      {
        question: "Where does every client file in the central client database live?",
        options: ["Clients", "Referrals", "Intensive case management", "The dashboard"],
        answer: 0,
        explain: "Clients is the central client database; the other pages read from those files.",
      },
      {
        question: "What must you read first when opening a client file?",
        options: ["Service logs", "Safety alerts at the top", "Referral history", "The visit list"],
        answer: 1,
        explain: "Safety alerts appear prominently at the top and should always be read before discussing sensitive matters.",
      },
      {
        question: "What does Intake's duplicate matcher prevent?",
        options: ["Missing notes", "Two records for the same person", "Late services", "Lost referrals"],
        answer: 1,
        explain: "It finds an existing file before a new one is created, so nobody ends up with two records.",
      },
      {
        question: "Which files get service plans, stages, goals and risks?",
        options: ["All files", "Files in intensive case management", "Only new intakes", "Referrals"],
        answer: 1,
        explain: "Intensive case management is the deeper workspace for clients who need more than a single visit.",
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
        options: ["Registrations", "Self-registration requests", "Waitlists", "The calendar"],
        answer: 1,
        explain: "People who scan a program's QR code land in Self-registration requests for you to approve or decline.",
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
};

export const getModuleRecap = (key) => MODULE_RECAPS[key] || null;
export const getModuleQuiz = (key) => MODULE_RECAPS[key]?.quiz || [];