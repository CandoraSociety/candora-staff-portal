// Candora's original uploaded organization logo, not the Staff Portal mark.
export const PORTAL_INTRO_LOGO = 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/8d587672d_Candoracirclelogo_noanniversary.png';

// Per-module intro "videos": scene slides + static, generated female narration.
// No generation calls or browser TTS at playback — each scene plays its MP3.
const INTRO_SCENES_BY_MODULE = {
  dashboard: [
    {
      kicker: 'Candora Staff Portal',
      title: 'Welcome to the Candora Staff Portal.',
      body: 'Welcome to the Candora Staff Portal. This is the place you will log into at the beginning of your workday, your starting point for the tools, information, and administrative work you need.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/bd9cda51d_speech.mp3',
    },
    {
      kicker: 'One connected system',
      title: 'What is an ERP?',
      body: "ERP stands for Enterprise Resource Planning. In simple terms, it means one connected system for running an organization's day-to-day operations, rather than juggling lots of separate programs. The Candora Staff Portal is our complete ERP.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/3e2406fe0_speech.mp3',
    },
    {
      kicker: 'Software, administration and workspace',
      title: 'More than an ERP.',
      body: 'It is also our software suite, administration centre, and everyday workspace. Client files, programs, human resources, finance, and training come together here. Almost all of our day-to-day administrative work will be completed in this portal.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/5295e6733_speech.mp3',
    },
    {
      kicker: 'Your tools, organized',
      title: 'A workspace for each part of the job.',
      body: 'Inside the Staff Portal, the work is organized into smaller portals, such as Pathways, the Resource Centre, and Finance. Think of each as a dedicated workspace, with its own tools, pages, and records for that part of your job.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/799abe3d3_speech.mp3',
    },
    {
      kicker: 'One shared workspace',
      title: 'Built for our work. Still growing.',
      body: 'Some functions are still being built, so not everything is available yet. As those tools are finished, they will become part of this shared workspace. You do not need to learn everything at once. Start your day here, then open the portals you need for your work.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/3b8821909_speech.mp3',
    },
  ],
  dashboard_widgets: [
    {
      kicker: 'Dashboard Widgets',
      title: 'Welcome to Dashboard Widgets.',
      body: 'Welcome to Dashboard Widgets. Your main page is made of widgets: optional panels you turn on or off yourself. A few are always there, like announcements, recent activity and upcoming events. The rest are entirely up to you.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/f3745a22f_speech.mp3',
    },
    {
      kicker: 'The Add Functions page',
      title: "What's on the menu?",
      body: "The Add Functions page lists every widget you can use, from the Personal Organizer and the How-To search to tasks, notes and birthdays. Clicking a card turns it on or off, and changes save right away.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/2e3749df9_speech.mp3',
    },
    {
      kicker: 'This module',
      title: 'Make it yours.',
      body: 'This module walks through what each widget does, so you can decide which ones belong on your home page.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/975fda409_speech.mp3',
    },
  ],
  staffadmin: [
    {
      kicker: 'Time & Money',
      title: 'Welcome to Time & Money.',
      body: "This module covers the everyday time side of working at Candora: requesting time off, logging sick time and personal days, submitting your timesheet each pay period, and checking the team schedule. Let's walk through each one.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/c6838ace1_speech.mp3',
    },
    {
      kicker: 'Time & Money',
      title: 'Requesting time off.',
      body: 'Vacation and other time off is booked on the Vacation and Time Off Request page. Fill in your dates, submit, and your request goes straight to your supervisor for approval, with its status tracked right on the page.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/b020f6e9f_speech.mp3',
    },
    {
      kicker: 'Time & Money',
      title: 'Sick time and personal days.',
      body: 'Sick time and personal days are logged on their own page. They need no approval: record the day and it is logged immediately, and like approved time off, it fills into the Paid Leave column of your timesheet automatically.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/cacfabe7f_speech.mp3',
    },
    {
      kicker: 'Time & Money',
      title: 'Submitting your timesheet.',
      body: 'Each pay period you enter your regular hours, plus any additional hours beyond your schedule, then submit for your supervisor to approve. Finance uses these submissions to run payroll.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/cec3e016a_speech.mp3',
    },
    {
      kicker: 'Time & Money',
      title: 'The team schedule.',
      body: "The team schedule shows everyone's approved absences side by side, so you can plan your time off around coverage. And whenever a request is approved, a notification appears automatically on your main dashboard.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/f8697d962_speech.mp3',
    },
  ],
  staffadmin_money: [
    {
      kicker: 'Time & Money — Receipts & Reimbursements',
      title: 'Welcome back to Time & Money.',
      body: "Welcome back to Time and Money. This module walks through a complete sample submission: uploading a receipt, checking what the autofill reads for you, and fixing anything it gets wrong by hand.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/36c2f97d9_speech.mp3',
    },
    {
      kicker: 'Time & Money — Receipts & Reimbursements',
      title: 'Two kinds of claims.',
      body: "Reimbursements cover expenses you paid out of pocket. MasterCard receipts record purchases made on the organization's card, which Finance matches against the monthly statement.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/9720d5929_speech.mp3',
    },
    {
      kicker: 'Time & Money — Receipts & Reimbursements',
      title: 'The details matter.',
      body: 'Every entry needs the right program so the expense is paid from the right funding pot. The tour covers that, and the GST rules for food, step by step.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/1b5bc6db2_speech.mp3',
    },
  ],
  staffadmin_supervisor: [
    {
      kicker: 'Time & Money — Supervisor Add-On',
      title: 'Welcome to the Supervisor add-on.',
      body: "Welcome to the Time and Money Supervisor add-on. This optional module is for anyone who supervises staff. It shows where your team's requests and submissions land, and how to review and approve them.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/4e4fa3f56_speech.mp3',
    },
    {
      kicker: 'Time & Money — Supervisor Add-On',
      title: 'Approvals come to you.',
      body: "Time off requests, timesheets and expense submissions arrive as banners right on your main dashboard, so you never have to hunt for them.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/f788d97f7_speech.mp3',
    },
    {
      kicker: 'Time & Money — Supervisor Add-On',
      title: 'Your signature keeps things moving.',
      body: 'Approving signs off with your e-signature. Approved time off and hours flow straight into payroll, and your staff member is notified the moment you act.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/54006eb7f_speech.mp3',
    },
  ],
  pathways: [
    {
      kicker: 'Pathways Case Management',
      title: 'Welcome to Pathways.',
      body: "Welcome to Pathways Case Management. Pathways is Candora's employment portal. Everything about a client's journey lives here, from intake and barriers to action plans, placements and employment outcomes.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/6256fdf84_speech.mp3',
    },
    {
      kicker: 'Pathways Case Management',
      title: 'Your caseload, your files.',
      body: 'Clients are assigned to you by email, the Master List holds every client in the program, and each profile gathers demographics, barriers, plans and notes in one place.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/41f9a8b2b_speech.mp3',
    },
    {
      kicker: 'Pathways Case Management',
      title: "What you'll practice.",
      body: "In this module you'll add a client through Intake, open a full profile, complete a Compass task, and submit a purchase request, all on simulated data.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/ca5d476c6_speech.mp3',
    },
  ],
  pathways_journey: [
    {
      kicker: 'Pathways Client Journey',
      title: 'Welcome to the Client Journey.',
      body: "Welcome to the Pathways Client Journey. This is the supplementary Pathways module. Journeys start two ways: a self-filled intake form on the job lab computers, or an intake we complete manually for a Compass referral. From there the program has different trajectories, and this module walks three of them from intake to outcome, inside real demo files.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/496e2835d_speech.mp3',
    },
    {
      kicker: 'Pathways Client Journey',
      title: 'Three routes, one starting point.',
      body: "You will follow Jordan Example on the DEA road, the fast track straight to employment. Sam Specimen on the WD road, with an internal placement inside Candora. And Casey Sample on the WD road, with a work exposure placement at an external employer. All three begin at intake.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/cd85a7a96_speech.mp3',
    },
    {
      kicker: 'Pathways Client Journey',
      title: 'How this module works.',
      body: "Each route opens that client's demo file and walks it from intake onward. Click along inside the file as you go. The tour follows you, and nothing you touch is real data.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/6372a3dfb_speech.mp3',
    },
  ],
  rc: [
    {
      kicker: 'Resource Centre',
      title: 'Welcome to the Resource Centre.',
      body: "Welcome to the Resource Centre, home of Candora's central client database. Resource Centre staff are the database's primary day-to-day users, but it belongs to the whole organization: the program portals that manage participants, such as Pathways, ELL, EmpowerU and the others, feed their client information into the central client database, and in some cases pull information back from it. It is the single source of truth for who our clients are and how the organization has supported them.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/fd2b76bc3_speech.mp3',
    },
    {
      kicker: 'Resource Centre',
      title: 'Files, notes and alerts.',
      body: 'Every client file holds contact details, case notes, needs, visits and referrals, with safety alerts shown prominently at the top.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/0c67b0e6d_speech.mp3',
    },
    {
      kicker: 'Resource Centre',
      title: "What you'll practice.",
      body: "You'll register a client through Intake, add a note, and log a service, the records that feed our funder reporting.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/8d360cfda_speech.mp3',
    },
  ],
  ell: [
    {
      kicker: 'English Language Learning',
      title: 'Welcome to ELL.',
      body: 'Welcome to English Language Learning. The ELL portal manages the whole program: learner rosters, classes and courses, the waitlist, and CLB assessments.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/006f84ea2_speech.mp3',
    },
    {
      kicker: 'English Language Learning',
      title: 'From waitlist to classroom.',
      body: "Learners move from the waitlist to a class with its own schedule, room and instructor, and CLB levels track each learner's progress over time.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/45526745e_speech.mp3',
    },
    {
      kicker: 'English Language Learning',
      title: "What you'll practice.",
      body: "You'll register a demo learner, work a waitlist entry through its contact states, and record a CLB assessment with before and after levels.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/41adbbc6a_speech.mp3',
    },
  ],
  centralreg: [
    {
      kicker: 'Central Registration',
      title: 'Welcome to Central Registration.',
      body: 'Welcome to Central Registration. Central Registration signs participants into any Candora program from one place, so every program\u2019s roster and waitlist stay consistent.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/7a0f62b19_speech.mp3',
    },
    {
      kicker: 'Central Registration',
      title: 'Programs, waitlists and requests.',
      body: "You'll manage program capacity, approve or decline registrations, offer waitlisted seats in fair order, and review sign-ups from QR self-registration.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/a1191caa1_speech.mp3',
    },
    {
      kicker: 'Central Registration',
      title: "What you'll practice.",
      body: "You'll register a demo participant, review a self-registration request, and check a full program's waitlist order.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/cb872b578_speech.mp3',
    },
  ],
  pathways_assessment: [
    {
      kicker: 'Pathways Assessment',
      title: 'Welcome to the Assessment.',
      body: "Welcome to the Assessment module. This is where a new client's file is read properly, the barriers behind their employment situation are recorded, and the file is handed on to a career counsellor with a plan already taking shape.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/9271e6839_speech.mp3',
    },
    {
      kicker: 'Pathways Assessment',
      title: 'The BIT and the ERA.',
      body: 'Two pieces of work sit inside the assessment. The Barrier Identification Tool records each barrier, the challenges behind it, and the action steps that address it. The Employment Readiness Assessment is completed in Compass, and the portal records that it is done.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/2e1bc598f_speech.mp3',
    },
    {
      kicker: 'Pathways Assessment',
      title: "What you'll practice.",
      body: "In this module you will open a demo client's assessment, record a barrier with its action steps, suggest action plan items for the counsellor, and complete the assessment. Nothing you touch is real data.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/65fa2cecb_speech.mp3',
    },
  ],
  pathways_service_nav: [
    {
      kicker: 'Pathways Service Navigation',
      title: 'Welcome to Service Navigation.',
      body: "Welcome to Service Navigation. Once a client is assigned to you as their navigator, the barrier work in their file becomes yours, week to week, alongside the career counsellor's employment plan on that same file.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/2e69f4880_speech.mp3',
    },
    {
      kicker: 'Pathways Service Navigation',
      title: 'Barriers are the work.',
      body: 'Barriers arrive from the assessment as editable cards. You move them to in progress when the work starts, and to resolved only when the need is genuinely met, with an end date and a note that records what worked.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/a64c9d010_speech.mp3',
    },
    {
      kicker: 'Pathways Service Navigation',
      title: "What you'll practice.",
      body: "In this module you will open a demo client as their navigator, move a barrier to in progress, resolve another with its resolution note, and send an internal referral. Nothing you touch is real data.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/72f5c078f_speech.mp3',
    },
  ],
  pathways_workshops: [
    {
      kicker: 'Pathways Workshops & Job Club',
      title: 'Welcome to Workshops & Job Club.',
      body: "Welcome to Workshops and Job Club. Workshops are the group activities the action plan points at, and they live inside Pathways so that the attendance you take reaches each client's file.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/9afafaa07_speech.mp3',
    },
    {
      kicker: 'Pathways Workshops & Job Club',
      title: 'One click marks many files.',
      body: 'Completing a workshop does more than change a badge. Every client marked as attended has the matching workshop item on their action plan marked complete.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/543db2221_speech.mp3',
    },
    {
      kicker: 'Pathways Workshops & Job Club',
      title: "What you'll practice.",
      body: "In this module you will create a workshop, take the roster for one session, and complete the workshop. Nothing you touch is real data.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/be7b1fe85_speech.mp3',
    },
  ],
};

export function getModuleIntroScenes(moduleKey) {
  return INTRO_SCENES_BY_MODULE[moduleKey] || null;
}