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
        body: "This training runs in Training Mode: every record you see and touch is simulated demo data, so explore freely — nothing you change affects real client or staff information. This main page is your home base every time you sign in.",
        target: { selector: '[data-tour="dashboard-hero"]' }
      },
      {
        title: "Announcements",
        body: "Organization-wide announcements live in this ribbon. The bell shows how many you haven't seen yet, and new titles scroll across it. Click the ribbon to open the full list, and use the Clear button to mark everything as seen.",
        target: { selector: '[data-tour="dashboard-announcements"]' }
      },
      {
        title: "Your portals",
        body: "These cards are your doorways into each portal you have access to — Pathways, the Resource Centre, Finance, and so on. Only portals relevant to your role appear. Click one to jump straight into it.",
        target: { selector: '[data-tour="dashboard-portals"]' }
      },
      {
        title: "Pinning your favourites",
        body: "Hover over any portal card and a pin appears in its corner — use it to pin your most-used portal, and it gets a banner right at the top of your dashboard so it's always one click away.",
        target: { selector: '[data-tour="dashboard-pin"]' }
      },
      {
        title: "Your employee card and settings",
        body: "This card shows your position and contact details as the organization has them on file. The highlighted Customize button opens your settings, where you can update your profile, photo and personal preferences.",
        target: { selector: '[data-tour="dashboard-employee"]' }
      },
      {
        title: "Notifications and approvals",
        body: "Alerts — like timesheets waiting for your approval, or reimbursement updates — appear at the top of your dashboard so nothing slips by unnoticed.",
        path: "/",
        revealWidget: "notifications",
        target: { selector: '[data-tour="dashboard-notifications"]' }
      },
      {
        title: "Turning widgets on and off",
        body: "Your dashboard is customizable. On this page, click any widget to turn it on or off — like the Personal Organizer, the How-To knowledge base and the translator — so your home page shows exactly what you use.",
        path: "/widget-customization",
        target: { selector: '[data-tour="widget-list"]' }
      },
      {
        title: "Your personal organizer",
        body: "The organizer is your private to-do space: set today's focus, list your priorities, and track your tasks. It follows you every time you sign in, on any device.",
        path: "/",
        revealWidget: "organizer",
        target: { selector: '[data-tour="dashboard-organizer"]' }
      },
      {
        title: "How-To knowledge base",
        body: "Anywhere in the app, ask the How-To search how to do something — from submitting a timesheet to logging a client visit — and get a step-by-step answer in plain language.",
        path: "/",
        revealWidget: "howto",
        target: { selector: '[data-tour="dashboard-howto"]' }
      },
      {
        title: "Set up your e-signature — protect it first",
        body: "Candora signs documents digitally, so let's actually set yours up now. In the E-Signature portal, choose a 4-digit PIN or a password, type it into both fields, and press Save & continue. This is the code you'll enter every time you sign a timesheet approval, reimbursement or document — so pick something you'll remember.",
        path: "/e-signature",
        target: { selector: '[data-tour="esign-security"]' }
      },
      {
        title: "Now create your signature",
        body: "Right below, give your signature a name, then choose how to make it: type your name and try the fonts, colours and effects; draw it with your mouse; or upload an image — the background is removed automatically. The preview shows exactly what it will look like on a signed document, verification ID and all. Go ahead and make one now.",
        target: { selector: '[data-tour="esign-editor"]' }
      },
      {
        title: "Save it and make it active",
        body: "Press Save signature. Saving also makes it your active signature — it appears in My signatures with the Active badge, and that's the one used whenever something needs your approval. You can create as many as you like and switch the active one anytime. Until this is done, a reminder to set up your signature stays on your dashboard.",
        target: { selector: '[data-tour="esign-save"]' }
      },
      {
        title: "Connect your Outlook account",
        body: "Next, connect your Candora email. On the Outlook page, click Connect Outlook and complete the Microsoft sign-in in the window that opens — the page refreshes on its own once you're done. If your administrator hasn't enabled the Microsoft connection for the organization yet, the button will tell you; just come back and do this step once it's switched on.",
        path: "/outlook",
        target: { selector: '[data-tour="outlook-connect"]' }
      },
      {
        title: "Your inbox, calendar and compose",
        body: "Once connected, everything lives under these tabs: Inbox to read and reply, Calendar for the next two weeks of events, and Compose to send. Try it — send yourself a quick test email so you've been through the whole flow.",
        target: { selector: '[data-tour="outlook-tabs"]' }
      },
      {
        title: "Teams, one click away",
        body: "Teams chats and channels are always at hand in the ribbon docked to the right edge of the screen. Click the Teams button here, then press Connect Teams in the panel that slides out — the same Microsoft sign-in as Outlook, so you only do it once each. After that, this button is your way into Teams from any page.",
        path: "/",
        target: { selector: '[data-tour="ms-ribbon-teams"]' }
      },
      {
        title: "Time to practice",
        body: "That's the tour! Next you'll try a few things yourself with the practice checklist. Remember: you're in Training Mode, so nothing you do here is real. When you finish this module, the Time & Money series is next — two mini-modules covering time off and timesheets, then receipts and reimbursements."
      }
    ],
    tasks: [
      {
        id: "dash-pin",
        title: "Pin a portal you'll use most",
        body: "Use the pin control on one of your portal cards to pin it to your dashboard.",
        hint: "Hover over a portal card on your main page and click the pin icon that appears in its corner.",
        verify: { kind: "self" }
      },
      {
        id: "dash-todo",
        title: "Add a to-do to your organizer",
        body: "Open the personal organizer and add a task for yourself.",
        hint: "On your main page, open the Personal Organizer, type your task in the add box and press Enter.",
        verify: { kind: "self" }
      },
      {
        id: "dash-howto",
        title: "Search the How-To knowledge base",
        body: "Ask the How-To search: \"How do I submit a timesheet?\"",
        hint: "Type your question into the How-To search box on your main page and press Enter to get the step-by-step answer.",
        verify: { kind: "self" }
      },
      {
        id: "dash-esign",
        title: "Set up your e-signature",
        body: "Open the E-Signature portal and create your demo signature — draw it, type it, or upload an image. This is how you'll sign real documents later.",
        hint: "Go to E-Signature, set up your PIN or password first if you haven't, then use the editor (type, draw or upload) and press Save signature to make it active.",
        path: "/e-signature",
        verify: { kind: "self" }
      }
    ]
  },
  {
    key: "staffadmin",
    title: "Time & Money — Mini-Module 1: Time Off & Timesheets",
    shortTitle: "Time Off & Timesheets",
    blurb: "Time & Money mini-module 1: booking time off, logging sick/personal days, submitting timesheets, and the team schedule.",
    path: "/time-off/vacation-request",
    steps: [
      {
        title: "Welcome to Part 2",
        body: "This is the Time & Money training, mini-module 1 of 2: the everyday time admin — booking time off, logging sick or personal days, and submitting your timesheet. (Receipts and reimbursements are mini-module 2.) As before, you're in Training Mode — nothing you submit here is real.",
        target: { selector: '[data-tour="sidebar-time-attendance"]' }
      },
      {
        title: "Booking time off",
        body: "Request vacation or other time off here. Fill in your dates, submit, and the request goes straight to your supervisor for approval — you'll see its status move from pending to approved right on this page.",
        revealNav: "/time-off/vacation-request",
        target: { selector: '[data-tour="sidebar-time-attendance"]', additionalSelectors: ['[data-tour-path="/time-off/vacation-request"]'] },
        path: "/time-off/vacation-request"
      },
      {
        title: "Fill in your vacation request",
        body: "Here's the actual form. Pick your first and last day off (the last day auto-follows the first if you leave it), and set hours per day — it defaults to 8. If your supervisor is on file they're already selected to approve it; if you have no supervisor on file, the request is recorded automatically with no approval needed. Add a note if there's anything they should know.",
        target: { selector: '[data-tour="vacation-form"]' }
      },
      {
        title: "Submit it",
        body: "Press Submit Request when the dates look right. The request lands with your supervisor as pending — you'll get a notification on your dashboard the moment it's approved.",
        target: { text: "Submit Request" }
      },
      {
        title: "Track it under My Requests",
        body: "Below the form, every request you've made is listed with its status — pending, approved or declined. Once a request is approved, those days automatically fill into the Paid Leave column of your timesheet for that pay period, so you never enter vacation hours by hand on a timesheet.",
        target: { text: "My Requests" }
      },
      {
        title: "Sick time and personal days",
        body: "Sick days and personal days are logged here instead of a vacation request. They follow the same approval flow and feed the same balances, so your time-off record stays accurate in one place.",
        revealNav: "/time-off/sick-personal",
        target: { selector: '[data-tour="sidebar-time-attendance"]', additionalSelectors: ['[data-tour-path="/time-off/sick-personal"]'] },
        path: "/time-off/sick-personal"
      },
      {
        title: "Log a sick day or personal day",
        body: "Pick the type — Sick Time or Personal Day — then the date, and an Until date if it spans several days. Set hours per day if it's not a full 8. Unlike vacation, these need no approval: press Record and they're logged immediately for HR, and they fill into the Paid Leave column of your timesheet for that pay period. Your recent records are listed below the form.",
        target: { selector: '[data-tour="sick-form"]' }
      },
      {
        title: "Submitting your timesheet",
        body: "Your hours go in here each pay period. Fill out the form and submit — your supervisor approves it, and Finance uses these submissions to run payroll, so a late or missing timesheet means a late paycheque.",
        revealNav: "/time-off/timesheets",
        target: { selector: '[data-tour="sidebar-time-attendance"]', additionalSelectors: ['[data-tour-path="/time-off/timesheets"]'] },
        path: "/time-off/timesheets"
      },
      {
        title: "The pay period and your supervisor",
        body: "The pay period is filled in for you automatically, and your supervisor comes from your employee file's Reports To. Submissions through the Wednesday after a period ends still count for that period — that's the real deadline to keep in mind.",
        target: { text: "Pay Period" }
      },
      {
        title: "Enter your regular hours",
        body: "Each day of the pay period has its own row. Type your Start Time and End Time plus any Break, and the Total Paid Hours calculates itself — you can also type the total by hand if your shift doesn't fit the pattern. Totals add up at the bottom as you go.",
        target: { text: "Regular Scheduled Hours" }
      },
      {
        title: "Vacation, sick and personal columns",
        body: "You don't type in these three columns: any approved vacation, sick time or personal day for that date is filled in automatically and highlighted — notice it matches the time off you just practiced requesting. The small numbers under each header show how many hours you still have available.",
        target: { text: "Vacation" }
      },
      {
        title: "Additional hours and submitting",
        body: "Hours beyond your regular schedule — an evening event, an extra shift — go in the Additional Hours table; use Add Row for each one. Then press Submit Timesheet: it goes to your supervisor as pending, and everything you've submitted is listed below under My Submissions.",
        target: { text: "Submit Timesheet" }
      },
      {
        title: "The team schedule",
        body: "Want to know who's off before you book your own time off? The team schedule shows everyone's approved absences side by side — plan your requests around coverage instead of guessing.",
        target: { selector: '[data-tour="sidebar-time-attendance"]' },
        path: "/time-off/team"
      },

      {
        title: "Where approvals and payments show up",
        body: "You don't need to check any of these pages for updates: when a supervisor approves your timesheet or time off, or Finance pays your reimbursement, a notification appears automatically on your main dashboard.",
        revealWidget: "notifications",
        target: { selector: '[data-tour="dashboard-notifications"]' },
        path: "/"
      },
      {
        title: "Time to practice",
        body: "That's the tour for this mini-module! Now try it yourself: request a day off, log a sick day, and submit a timesheet — all on simulated data. When you're ready, mini-module 2 walks you through receipts, reimbursements and MasterCard submissions step by step."
      }
    ],
    tasks: [
      {
        id: "tm-vacation",
        title: "Request time off",
        body: "Submit a vacation or time-off request for a future date.",
        hint: "Open Time & Attendance → Vacation / Time Off Request, pick your first day off and press Submit Request.",
        path: "/time-off/vacation-request",
        verify: { kind: "created", entity: "TimeOffRecord" }
      },
      {
        id: "tm-sick",
        title: "Log a sick or personal day",
        body: "Record a sick time or personal day entry for yourself.",
        hint: "Open the Sick Time / Personal Day page, choose Sick Time or Personal Day, pick a date and press Record.",
        path: "/time-off/sick-personal",
        verify: { kind: "self" }
      },
      {
        id: "tm-timesheet",
        title: "Submit a timesheet",
        body: "Fill out and submit a timesheet for the current pay period.",
        hint: "Open Timesheets, enter Start/End times (and any break) for a few days, then press Submit Timesheet at the bottom.",
        path: "/time-off/timesheets",
        verify: { kind: "created", entity: "Timesheet" }
      },
    ]
  },

  {
    key: "staffadmin_money",
    title: "Time & Money — Mini-Module 2: Receipts & Reimbursements",
    shortTitle: "Receipts & Reimb.",
    blurb: "Time & Money mini-module 2: a full sample submission — uploading a receipt and the autofill, entering details by hand when autofill doesn't work, and submitting reimbursements and MasterCard receipts.",
    path: "/reimbursement-requests",
    steps: [
      {
        title: "Welcome to Receipts & Reimbursements",
        body: "This mini-module walks through a complete sample submission, exactly as you'd do it for real: starting with uploading a receipt and letting the app read it for you, then what to do — field by field — when the autofill doesn't work properly. It covers both getting paid back for out-of-pocket expenses and recording Candora MasterCard receipts. You're still in Training Mode, so every receipt you enter here is simulated.",
        revealNav: "/reimbursement-requests",
        target: { selector: '[data-tour="sidebar-purchases"]', additionalSelectors: ['[data-tour-path="/reimbursement-requests"]'] },
        path: "/reimbursement-requests"
      },
      {
        title: "Start with Add Receipt Entry",
        body: "Every claim starts the same way: click Add Receipt Entry. A new row opens in the table below — that blank row is your workspace for this whole tour, and it's where the receipt upload happens.",
        target: { text: "Add Receipt Entry" }
      },
      {
        title: "Upload the receipt",
        body: "Attach the receipt photo or PDF with the paperclip at the left of the row. The app reads the file and fills in the date, supplier and total for you — that's the autofill. Give it a few seconds to finish, and always give the results a quick once-over against the actual receipt: on a blurry photo or a multi-item receipt it can misread."
      },
      {
        title: "What the autofill filled in",
        body: "After the read, the Date, Supplier and Total fields are filled automatically and the paperclip icon lights up to show the attachment is saved. Check each one against the receipt: the date is when you spent the money, the supplier is who you paid, and the total is the full amount you were charged. If anything's missing, that's the next step's territory."
      },
      {
        title: "When autofill doesn't work",
        body: "If the photo is too blurry to read, nothing fills in, or a field comes back wrong — don't start over, just type it in. Click into the Date field and pick or type the date, enter the Supplier name by hand, and type the Total with GST yourself. Autofill is a convenience, not a requirement: what matters to Finance is that the numbers are right."
      },
      {
        title: "Choose the program",
        body: "Pick which program the purchase relates to from the Program dropdown — this routes the expense to the right funding pot, so it's the one field you can't skip. If none of the options fits, choose Other and type the program name.",
        target: { text: "Program" }
      },
      {
        title: "Answer the food question",
        body: "Click Yes or No for Food? Food gets special GST treatment, so this needs an answer either way — it can't be left blank. It's about the items on the receipt, not where you bought them: groceries are food even from a big-box store."
      },
      {
        title: "Enter the total — and the GST",
        body: "Enter the receipt total with GST — the full amount you actually paid. If you answered Food = No, the GST calculates itself at 5% Alberta GST. If you answered Food = Yes, type the GST amount from the receipt yourself (enter 0 if none was charged), because not all food is charged GST."
      },
      {
        title: "Excluding personal items — the scissors",
        body: "Bought something personal on the same receipt? Use the scissors control to exclude it from the claim: enter the personal item's price before GST and a short description. The scissors subtract it from what you're claiming and handle its GST automatically, so your claim is only the Candora portion."
      },
      {
        title: "Save the entry",
        body: "Press the check mark to save the entry into the table, then repeat — Add Receipt Entry — for each separate receipt. You can edit or delete a saved entry before submitting, and the totals at the bottom keep a running count of everything waiting to be claimed.",
        target: { text: "Add Receipt Entry" }
      },
      {
        title: "Submit for Reimbursement",
        body: "When your entries are ready, press Submit for Reimbursement: they go together as one form, and the total at the bottom of the table is what you're claiming. It travels to your supervisor and then Finance, and once it's paid you're e-transferred the total. You can watch its progress on this page under Submitted Reimbursements — pending, approved, then Paid.",
        target: { text: "Submit for Reimbursement" }
      },
      {
        title: "Now the Candora MasterCard",
        body: "Card purchases work exactly the same way, on the Candora MasterCard Receipts page — with one big difference: you're not claiming this money back, it was spent on the organization's card. What matters is that each receipt is recorded accurately, because Finance matches them against the monthly MasterCard statement line by line — a missing receipt here is what holds up the card reconciliation.",
        revealNav: "/candora-cc-receipts",
        target: { selector: '[data-tour="sidebar-purchases"]', additionalSelectors: ['[data-tour-path="/candora-cc-receipts"]'] },
        path: "/candora-cc-receipts"
      },
      {
        title: "Enter each card receipt",
        body: "Same flow as before: Add Receipt Entry, attach the receipt with the paperclip so the autofill fills in the date, supplier and total — or type them by hand if the read doesn't work — pick the program, answer the food question and enter the total with GST. The scissors apply here too, if the receipt mixed in anything personal.",
        target: { text: "Add Receipt Entry" }
      },
      {
        title: "Submit Receipts to Finance",
        body: "Press Submit Receipts to Finance when your entries are done — they go as one monthly batch, and Finance reconciles each receipt against the statement. If a receipt arrives after you've already submitted, just add it and submit again next time.",
        target: { text: "Submit Receipts to Finance" }
      },
      {
        title: "Where approvals and payments show up",
        body: "You never need to check these pages for updates: when your supervisor approves your submission, or Finance pays your reimbursement, a notification appears automatically on your main dashboard.",
        revealWidget: "notifications",
        target: { selector: '[data-tour="dashboard-notifications"]' },
        path: "/"
      },
      {
        title: "Time to practice",
        body: "That's the tour! Now try the whole flow yourself: add an entry with an attached receipt, check what the autofill filled in (and fix anything by hand), and submit it for reimbursement — then do the same with a MasterCard receipt. All on simulated data."
      }
    ],
    tasks: [
      {
        id: "tm-reimb",
        title: "Submit a reimbursement",
        body: "Add an expense entry (attach a receipt if you like) and submit a reimbursement request for it.",
        path: "/reimbursement-requests",
        hint: "Open Reimbursement Requests, click Add Receipt Entry, fill in and save the entry with the check mark, then press Submit for Reimbursement.",
        verify: { kind: "created", entity: "StaffReimbursementRequest" }
      },
      {
        id: "tm-cc",
        title: "Upload a MasterCard receipt",
        body: "Upload a receipt for a purchase made on the Candora MasterCard.",
        path: "/candora-cc-receipts",
        hint: "Open Candora MasterCard Receipts, click Add Receipt Entry, fill in the details and press Submit Receipts to Finance.",
        verify: { kind: "created", entity: "CCReceiptSubmission" }
      }
    ]
  },

  {
    key: "staffadmin_supervisor",
    title: "Time & Money — Supervisor Add-On",
    shortTitle: "Supervising",
    blurb: "Optional add-on for supervisors: the other side of the Time & Money flows — approving your team's time off, timesheets, receipts and reimbursements from your dashboard.",
    path: "/",
    supervisorOnly: true,
    steps: [
      {
        title: "Welcome to the supervisor add-on",
        body: "This optional module is for anyone who supervises staff. The Time & Money mini-modules showed how your team requests time off, submits timesheets and claims expenses — this tour shows where those land for you, and how to review and approve them. You're still in Training Mode: the pending requests you see are simulated, so practice freely.",
        target: { selector: '[data-tour="dashboard-notifications"]' },
        path: "/"
      },
      {
        title: "Where approvals arrive",
        body: "You never have to hunt for requests: when a direct report submits something that needs your sign-off, a banner appears right here on your main dashboard. Banners only show while something is actually waiting — when your queue is empty, they disappear.",
        target: { selector: '[data-tour="supervisor-timeoff-alerts"]' },
        path: "/"
      },
      {
        title: "Approve or decline time off",
        body: "Each request shows who's asking and which days. Approve it and the time off is booked; their Paid Leave column fills in automatically on the next timesheet — no double entry. If coverage doesn't work, press Reject and give a short reason: it goes straight back to them.",
        target: { selector: '[data-tour="supervisor-timeoff-alerts"]' },
        path: "/"
      },
      {
        title: "Approving timesheets",
        body: "Submitted timesheets wait here with the hours already totalled. Approving signs off the pay period with your e-signature, and Finance uses your approval to run payroll — so a timesheet sitting unanswered here is what delays someone's paycheque. Reject with a reason if hours look wrong.",
        target: { selector: '[data-tour="supervisor-timesheet-alerts"]' },
        path: "/"
      },
      {
        title: "Approving reimbursements",
        body: "Expense submissions — reimbursements and Candora MasterCard receipts — wait for your approval before Finance can process them. Open the details, check the entries against the receipts, then Approve with your e-signature. Once you approve a reimbursement, Finance takes it from there and e-transfers your staff member.",
        target: { selector: '[data-tour="supervisor-reimbursement-alerts"]' },
        path: "/"
      },
      {
        title: "Check coverage before you decide",
        body: "Before approving time off, glance at the team schedule: it shows everyone's approved absences side by side, so you can see whether the team can cover the days being requested.",
        revealNav: "/time-off/team",
        target: { selector: '[data-tour="sidebar-time-attendance"]', additionalSelectors: ['[data-tour-path="/time-off/team"]'] },
        path: "/time-off/team"
      },
      {
        title: "What happens after you approve",
        body: "You're the first step, not the last: approved time off and timesheet hours flow straight into payroll records, approved expenses continue on to Finance, and your staff member gets a dashboard notification the moment you act. Nothing else is needed from you.",
        revealWidget: "notifications",
        target: { selector: '[data-tour="dashboard-notifications"]' },
        path: "/"
      },
      {
        title: "Time to practice",
        body: "That's the tour! Now try the supervisor side yourself: approve a time-off request, sign off a timesheet, and approve a reimbursement — all on simulated data."
      }
    ],
    tasks: [
      {
        id: "sup-timeoff",
        title: "Approve a pending time-off request",
        body: "From your dashboard, approve (or reject with a reason) the pending time-off request from your demo staff member.",
        hint: "Find the pending time-off banner on your main dashboard, open Sam Staff's request and press Approve — or Reject with a short reason.",
        path: "/",
        verify: { kind: "self" }
      },
      {
        id: "sup-timesheet",
        title: "Approve a submitted timesheet",
        body: "Review the pending timesheet and approve it with your e-signature.",
        hint: "Open the submitted timesheet from the dashboard banner, check the hours, then Approve — you'll be asked for your e-signature code.",
        path: "/",
        verify: { kind: "self" }
      },
      {
        id: "sup-reimb",
        title: "Approve an expense submission",
        body: "Open the pending reimbursement, check its entries, and approve it with your e-signature.",
        hint: "Open the pending expense submission from the dashboard banner, review its entries and press Approve with your e-signature.",
        path: "/",
        verify: { kind: "self" }
      },
      {
        id: "sup-team",
        title: "Check the team schedule",
        body: "Open the team schedule and see who's off around the time-off request you just reviewed.",
        hint: "In the sidebar, open Time & Attendance → Team Schedule to see everyone's approved absences side by side.",
        path: "/time-off/team",
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
        hint: "Go to Intake, fill in the required fields — the duplicate matcher checks for existing files as you type — then save.",
        path: "/pathways/intake",
        verify: { kind: "created", entity: "Client" }
      },
      {
        id: "pw-profile",
        title: "Open a client's full profile",
        body: "From the Master List, search for a client and open their profile. Explore the barriers, action plan and employment sections.",
        hint: "Go to the Master List, type a name in the search box and click the client's row to open their full file.",
        path: "/pathways/master",
        verify: { kind: "self" }
      },
      {
        id: "pw-compass",
        title: "Complete a Compass task",
        body: "Open Compass and mark one of the pending demo tasks as completed.",
        hint: "Open Compass, pick a pending demo task and toggle or mark it as completed.",
        path: "/pathways/compass",
        verify: { kind: "self" }
      },
      {
        id: "pw-purchase",
        title: "Submit a purchase request",
        body: "Submit a purchase or exposure-course request for one of your demo clients.",
        hint: "From your dashboard or a client profile, open Purchase Requests and fill in a new request for one of your clients.",
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
        hint: "Go to Intake, search for duplicates first, then complete the registration and save.",
        path: "/rc/intake",
        verify: { kind: "created", entity: "RCClient" }
      },
      {
        id: "rc-note",
        title: "Add a note to a client file",
        body: "Open a demo client and add a note. Try marking it as a safety alert to see how it stands out.",
        hint: "Open a client file from Clients, click Add Note and try the safety-alert toggle.",
        path: "/rc/clients",
        verify: { kind: "created", entity: "RCClientNote" }
      },
      {
        id: "rc-service",
        title: "Log a service",
        body: "Log a service for one of your demo clients — services are what feed our funder reporting.",
        hint: "Open a client file and use Log Service to record a service for them.",
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
        hint: "Go to Learners, click Add Learner and fill in their first language, country of origin and CLB level.",
        path: "/ell/learners",
        verify: { kind: "created", entity: "ELLLearner" }
      },
      {
        id: "ell-waitlist",
        title: "Work a waitlist entry",
        body: "Open the waitlist, contact a waiting learner and update their contact state with a note.",
        hint: "Open the Waitlist, pick a waiting learner and use the contact buttons to update their state with a note.",
        path: "/ell/waitlist",
        verify: { kind: "self" }
      },
      {
        id: "ell-assess",
        title: "Record a CLB assessment",
        body: "Record an assessment for one of the demo learners, showing their before and after levels.",
        hint: "Open Assessments and record a new CLB assessment with the before and after levels.",
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
        hint: "Go to Registrations, use the register/new-registration button and pick a program and participant.",
        path: "/central-registration/registrations",
        verify: { kind: "created", entity: "ProgramRegistration" }
      },
      {
        id: "cr-request",
        title: "Review a self-registration request",
        body: "Approve or decline one of the pending QR self-registration requests.",
        hint: "Open Self-Registration Requests and use Approve or Decline on one of the pending requests.",
        path: "/central-registration/requests",
        verify: { kind: "self" }
      },
      {
        id: "cr-waitlist",
        title: "Check a program's waitlist",
        body: "Open the waitlists view and find the position order of a full program.",
        hint: "Open Waitlists, pick a full program and look at the numbered waitlist positions.",
        path: "/central-registration/waitlists",
        verify: { kind: "self" }
      }
    ]
  }
];

// Which portal a training module belongs to — used to show each staff member
// only the training for portals they can actually access (null = everyone).
export const TRAINING_MODULE_ACCESS = {
  dashboard: null,
  staffadmin: null,
  staffadmin_money: null,
  staffadmin_supervisor: null,
  pathways: "pathways",
  rc: "rc",
  ell: "ell",
  centralreg: "central-registration",
};

export const getTrainingModule = (key) => TRAINING_MODULES.find(m => m.key === key) || null;

export const moduleForPath = (pathname) => {
  if (!pathname) return null;
  if (pathname === "/" || pathname.startsWith("/portal") || pathname.startsWith("/widget-customization")) {
    return getTrainingModule("dashboard");
  }
  const prefixes = [
    ["/e-signature", "dashboard"],
    ["/time-off", "staffadmin"],
    ["/reimbursement-requests", "staffadmin_money"],
    ["/candora-cc-receipts", "staffadmin_money"],
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