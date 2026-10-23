// Candora's original uploaded organization logo, not the Staff Portal mark.
export const PORTAL_INTRO_LOGO = 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/8d587672d_Candoracirclelogo_noanniversary.png';

// Per-module intro "videos": scene slides + static, generated female narration.
// No generation calls or browser TTS at playback — each scene plays its MP3.
const INTRO_SCENES_BY_MODULE = {
  dashboard: [
    {
      kicker: 'Candora Staff Portal',
      title: 'This is where your workday begins.',
      body: 'Welcome to the Candora Staff Portal. This is the place you will log into at the beginning of your workday, your starting point for the tools, information, and administrative work you need.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/1d7159191_candora-portal-intro-1.mp3',
    },
    {
      kicker: 'One connected system',
      title: 'What is an ERP?',
      body: "ERP stands for Enterprise Resource Planning. In simple terms, it means one connected system for running an organization's day-to-day operations, rather than juggling lots of separate programs. The Candora Staff Portal is our complete ERP.",
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/b127131df_candora-portal-intro-2.mp3',
    },
    {
      kicker: 'Software, administration and workspace',
      title: 'More than an ERP.',
      body: 'It is also our software suite, administration centre, and everyday workspace. Client files, programs, human resources, finance, and training come together here. Almost all of our day-to-day administrative work will be completed in this portal.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/7f8ba2c3c_candora-portal-intro-3.mp3',
    },
    {
      kicker: 'Your tools, organized',
      title: 'A workspace for each part of the job.',
      body: 'Inside the Staff Portal, the work is organized into smaller portals, such as Pathways, the Resource Centre, and Finance. Think of each as a dedicated workspace, with its own tools, pages, and records for that part of your job.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/9dd142cd0_candora-portal-intro-4.mp3',
    },
    {
      kicker: 'One shared workspace',
      title: 'Built for our work. Still growing.',
      body: 'Some functions are still being built, so not everything is available yet. As those tools are finished, they will become part of this shared workspace. You do not need to learn everything at once. Start your day here, then open the portals you need for your work.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/930d34775_candora-portal-intro-5.mp3',
    },
  ],
  dashboard_widgets: [
    {
      kicker: 'Dashboard Widgets',
      title: 'Your home page, your choice.',
      body: 'The main page is made of widgets: optional panels you turn on or off yourself. A few are always there, like announcements, recent activity and upcoming events. The rest are entirely up to you.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/718750daf_candora-intro-1.mp3',
    },
    {
      kicker: 'The Add Functions page',
      title: "What's on the menu?",
      body: "The Add Functions page lists every widget you can use, from the Personal Organizer and the How-To search to tasks, notes and birthdays. Clicking a card turns it on or off, and changes save right away.",
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/885f7fa6f_candora-intro-2.mp3',
    },
    {
      kicker: 'This module',
      title: 'Make it yours.',
      body: 'This module walks through what each widget does, so you can decide which ones belong on your home page.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/b4e6fe947_candora-intro-3.mp3',
    },
  ],
  staffadmin: [
    {
      kicker: 'Time & Money — Mini-Module 1',
      title: 'Everyday time admin.',
      body: 'This module covers the everyday side of working at Candora: booking time off, logging sick or personal days, and submitting your timesheet each pay period.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/2781efe9f_candora-intro-4.mp3',
    },
    {
      kicker: 'Time & Money — Mini-Module 1',
      title: 'Requests and approvals.',
      body: 'Time off requests go straight to your supervisor, while sick and personal days are logged immediately. Approved time off then fills into your timesheet automatically.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/5260751c6_candora-intro-5.mp3',
    },
    {
      kicker: 'Time & Money — Mini-Module 1',
      title: 'Deadlines matter.',
      body: 'Finance uses your timesheet submissions to run payroll, so a late or missing timesheet means a late paycheque. The tour walks through each form step by step.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/5b867f51a_candora-intro-6.mp3',
    },
  ],
  staffadmin_money: [
    {
      kicker: 'Time & Money — Mini-Module 2',
      title: 'Getting paid back.',
      body: 'This module walks through a complete sample submission: uploading a receipt, checking what the autofill reads for you, and fixing anything it gets wrong by hand.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/cde13371a_candora-intro-7.mp3',
    },
    {
      kicker: 'Time & Money — Mini-Module 2',
      title: 'Two kinds of claims.',
      body: "Reimbursements cover expenses you paid out of pocket. MasterCard receipts record purchases made on the organization's card, which Finance matches against the monthly statement.",
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/adf685505_candora-intro-8.mp3',
    },
    {
      kicker: 'Time & Money — Mini-Module 2',
      title: 'The details matter.',
      body: 'Every entry needs the right program so the expense is paid from the right funding pot. The tour covers that, and the GST rules for food, step by step.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/daef86490_candora-intro-9.mp3',
    },
  ],
  staffadmin_supervisor: [
    {
      kicker: 'Time & Money — Supervisor Add-On',
      title: 'The other side of the counter.',
      body: "This optional module is for anyone who supervises staff. It shows where your team's requests and submissions land, and how to review and approve them.",
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/e6c4df132_candora-intro-10.mp3',
    },
    {
      kicker: 'Time & Money — Supervisor Add-On',
      title: 'Approvals come to you.',
      body: "Time off requests, timesheets and expense submissions arrive as banners right on your main dashboard, so you never have to hunt for them.",
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/716a702f4_candora-intro-11.mp3',
    },
    {
      kicker: 'Time & Money — Supervisor Add-On',
      title: 'Your signature keeps things moving.',
      body: 'Approving signs off with your e-signature. Approved time off and hours flow straight into payroll, and your staff member is notified the moment you act.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/8da623eeb_candora-intro-12.mp3',
    },
  ],
  pathways: [
    {
      kicker: 'Pathways Case Management',
      title: 'Employment case management.',
      body: "Pathways is Candora's employment portal. Everything about a client's journey lives here, from intake and barriers to action plans, placements and employment outcomes.",
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/135f2dd17_candora-intro-13.mp3',
    },
    {
      kicker: 'Pathways Case Management',
      title: 'Your caseload, your files.',
      body: 'Clients are assigned to you by email, the Master List holds every client in the program, and each profile gathers demographics, barriers, plans and notes in one place.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/dc1c86486_candora-intro-14.mp3',
    },
    {
      kicker: 'Pathways Case Management',
      title: "What you'll practice.",
      body: "In this module you'll add a client through Intake, open a full profile, complete a Compass task, and submit a purchase request, all on simulated data.",
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/4898d2db2_candora-intro-15.mp3',
    },
  ],
  rc: [
    {
      kicker: 'Resource Centre',
      title: 'The central client database.',
      body: "The Resource Centre holds Candora's central client database, the single source of truth for who our clients are and how the organization has supported them.",
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/3a607d45b_candora-intro-16.mp3',
    },
    {
      kicker: 'Resource Centre',
      title: 'Files, notes and alerts.',
      body: 'Every client file holds contact details, case notes, needs, visits and referrals, with safety alerts shown prominently at the top.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/cdb6fb830_candora-intro-17.mp3',
    },
    {
      kicker: 'Resource Centre',
      title: "What you'll practice.",
      body: "You'll register a client through Intake, add a note, and log a service, the records that feed our funder reporting.",
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/05dfd244a_candora-intro-18.mp3',
    },
  ],
  ell: [
    {
      kicker: 'English Language Learning',
      title: 'The ELL portal.',
      body: 'The ELL portal manages the whole program: learner rosters, classes and courses, the waitlist, and CLB assessments.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/e77cc4fe8_candora-intro-19.mp3',
    },
    {
      kicker: 'English Language Learning',
      title: 'From waitlist to classroom.',
      body: "Learners move from the waitlist to a class with its own schedule, room and instructor, and CLB levels track each learner's progress over time.",
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/129d9c506_candora-intro-20.mp3',
    },
    {
      kicker: 'English Language Learning',
      title: "What you'll practice.",
      body: "You'll register a demo learner, work a waitlist entry through its contact states, and record a CLB assessment with before and after levels.",
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/f605fd8af_candora-intro-21.mp3',
    },
  ],
  centralreg: [
    {
      kicker: 'Central Registration',
      title: 'One place to register.',
      body: 'Central Registration signs participants into any Candora program from one place, so every program\u2019s roster and waitlist stay consistent.',
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/6b0ee2b00_candora-intro-22.mp3',
    },
    {
      kicker: 'Central Registration',
      title: 'Programs, waitlists and requests.',
      body: "You'll manage program capacity, approve or decline registrations, offer waitlisted seats in fair order, and review sign-ups from QR self-registration.",
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/3021b7d10_candora-intro-23.mp3',
    },
    {
      kicker: 'Central Registration',
      title: "What you'll practice.",
      body: "You'll register a demo participant, review a self-registration request, and check a full program's waitlist order.",
      audioUrl: 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/139e42d35_candora-intro-24.mp3',
    },
  ],
};

export function getModuleIntroScenes(moduleKey) {
  return INTRO_SCENES_BY_MODULE[moduleKey] || null;
}