// ── Welcome & app tour training module ─────────────────────────────────────
// The first module everyone takes: a friendly orientation to the whole
// Candora Staff Portal — the portals themselves, how they connect, the layout
// and the few moves that apply everywhere. It explains each portal in a
// sentence or two rather than teaching any one of them in depth, and tells
// learners, repeatedly, that they are not expected to remember any of it.

export const WELCOME_MODULES = [
  {
    key: "welcome",
    title: "Welcome to the Candora Staff Portal",
    shortTitle: "Welcome & App Tour",
    blurb: "Start here. An orientation to the whole app: the portals and what each area of Candora does, how those portals feed each other, the sidebar, your main page — and why you only need to remember a few things today.",
    path: "/",
    steps: [
      {
        title: "Welcome to the Candora Staff Portal",
        body: "Press Play to hear the orientation: what this app is, the workspaces inside it, and the three parts of the screen that never move. Each scene stays on screen until its narration has finished. Nothing here is graded, and everything you see in training is simulated. When you're ready, press Next below to walk the app itself.",
        introExplainer: true,
        path: "/"
      },
      {
        title: "Start here — nothing to memorise",
        body: "Welcome to Candora. This is the first training module, and it's deliberately gentle: a tour of the app and how it's laid out, not a test. Nothing here is graded, and nothing you click during training touches real client or staff records — it all runs on simulated demo data. The single aim today is familiarity: by the end you'll recognise the parts of the screen and know where to go back to when you need something. You are not expected to remember the details.",
        target: { selector: '[data-tour="dashboard-hero"]' }
      },
      {
        title: "One app, many workspaces",
        body: "The Candora Staff Portal is one application. Inside it, each area of work has its own portal — Pathways for employment case management, the Resource Centre for the central client database, ELL for language classes, Finance, Reception, the File Manager, and more. A portal is simply a workspace with its own pages and records, not a separate program to install. And nobody has all of them: your access decides which portals appear for you, which is why your list can look different from a co-worker's. That's normal.",
        target: { selector: '[data-tour="dashboard-portals"]' }
      },
      {
        title: "Every portal, in one list",
        body: "Portals is the full list of workspaces your access allows, and it's worth a look even now. You can search it, and the category tabs narrow it down. Because the list is built from your permissions, yours is shorter than a colleague's — that's by design, not a gap. Open any card and it becomes a tab, ready whenever you come back to it.",
        path: "/portal",
        target: { selectors: ['[data-tour="portal-filters"]', '[data-tour="portal-cards"]'] }
      },
      {
        title: "Client work: the core programs",
        body: "Five portals carry most of the client work. Pathways CM is employment case management: intake, assessments, barrier action plans, placements, 90-day follow-ups and billing. The Candora Central Database is the shared client record — intake, appointments with reminders, notes and referrals. ELL runs English language classes, learners, CLB assessments and waitlists. EmpowerU runs 10-week financial cohorts with waitlists and ATB savings account setup. Digital Literacy is the volunteer-led, PALS-partnered program whose progress syncs into Pathways.",
        path: "/portal",
        target: { selectors: [
          '[data-tour="portal-card-pathways"]',
          '[data-tour="portal-card-rc"]',
          '[data-tour="portal-card-ell"]',
          '[data-tour="portal-card-empoweru"]',
          '[data-tour="portal-card-digilit"]'
        ] }
      },
      {
        title: "Community, family and childminding",
        body: "Four portals look after groups and families. Community Programs covers occasional volunteer-run groups such as Sewing Group, Seniors Circle and Music Mental Health — participants, sessions, attendance and facilitator evaluations. FRN Programs handles targeted family intake, referrals and assessments like Connect Parent and Nobody's Perfect. PHAC runs drop-in programs for children from birth to six, tracking sessions, attendance and registered families. Childminding registers children, tracks schedules and exports billing.",
        path: "/portal",
        target: { selectors: [
          '[data-tour="portal-card-community"]',
          '[data-tour="portal-card-frn"]',
          '[data-tour="portal-card-phac"]',
          '[data-tour="portal-card-childminding"]'
        ] }
      },
      {
        title: "The shared front door",
        body: "Two portals receive people. Central Registration is the shared front door for every program: sessions and capacity, registrations, waitlists, volunteer applications and the self-registration requests that come in by QR code. Reception is the front desk — appointments, drop-ins, the staff directory with click-to-call, program registration with approval, the resource finder and urgent alerts.",
        path: "/portal",
        target: { selectors: [
          '[data-tour="portal-card-central-registration"]',
          '[data-tour="portal-card-reception"]'
        ] }
      },
      {
        title: "People, staff and learning",
        body: "Four portals look after the people side. HR Management holds employee records, performance reviews, incidents, corrective actions, contracts, legal cases, pay grids and training records. The Volunteer Manager runs volunteers end to end — positions, events, shifts, hours, training, recognition and approvals. The Learning Management System authors and delivers your own training modules and programs. Outlook brings mail and calendar into the app.",
        path: "/portal",
        target: { selectors: [
          '[data-tour="portal-card-nexushr"]',
          '[data-tour="portal-card-volunteermgr"]',
          '[data-tour="portal-card-lms"]',
          '[data-tour="portal-card-outlook"]'
        ] }
      },
      {
        title: "Money, services and growth",
        body: "Five portals run the business. Finance is payroll, Pathways payables and invoices, reimbursements, MasterCard receipts, budgets and cash flow. Food Services covers menus, orders, inventory, recipes, catering and customers. The Events, Projects and Programs Manager tracks events, programs, projects and contacts. Marketing & Fundraising handles campaigns, brand assets, email, social, SEO and requests. The Grant & Proposal Manager tracks funders, proposals and reporting deadlines.",
        path: "/portal",
        target: { selectors: [
          '[data-tour="portal-card-finance"]',
          '[data-tour="portal-card-food"]',
          '[data-tour="portal-card-eventsmgr"]',
          '[data-tour="portal-card-marketing"]',
          '[data-tour="portal-card-grants"]'
        ] }
      },
      {
        title: "Oversight, numbers and history",
        body: "Five more for oversight. The Executive Director Portal holds strategy, KPIs, projects, budgets, the org chart and board reporting. The Candora Board portal runs meetings, agendas, minutes, motions, documents and member onboarding. The Reports Portal generates internal, funder and annual reports from data across the app. Candora Archives keeps the timeline, biographies, stories and historical documents. The Admin Console manages cards, widgets, users and access.",
        path: "/portal",
        target: { selectors: [
          '[data-tour="portal-card-ed"]',
          '[data-tour="portal-card-board"]',
          '[data-tour="portal-card-reporting"]',
          '[data-tour="portal-card-archives"]',
          '[data-tour="portal-card-admin"]'
        ] }
      },
      {
        title: "Every portal files into one vault",
        body: "One more worth seeing now. The File Manager is the document vault behind the whole app. A receipt attached in Purchases, a signed timesheet, a document uploaded from any portal's dashboard — they all land in the same place, sorted into folders by portal and protected by access levels. You may almost never open this portal and still use it every week.",
        path: "/portal",
        target: { selectors: ['[data-tour="portal-card-filemanager"]'] }
      },
      {
        title: "One person, one record",
        body: "Now the important part: these portals are not separate islands. A person who joins English Language Learning, EmpowerU, the Family Resource Network or a community program is matched to the same file in the central client database, so one person is one record everywhere. That's what lets any program see the whole picture instead of only its own slice of it.",
        path: "/rc/clients",
        target: { selector: '[data-tour="page-content"]' }
      },
      {
        title: "Referrals travel between portals",
        body: "Referrals are the second connection. When a Pathways client needs language classes, digital skills or family support, the counsellor refers them to that Candora program from the client's file. The referral appears on the receiving program's own dashboard with the client's name and who sent it, and its progress is tracked back on the original file. Nothing is retyped or emailed.",
        path: "/pathways/dashboard",
        target: { selector: '[data-tour="page-content"]' }
      },
      {
        title: "Your staff record ties it together",
        body: "The staff side works the same way. Your employee record carries your supervisor, which is why a vacation request, a timesheet or an expense you submit reaches the right person's dashboard on its own. Approve the vacation and it fills into your timesheet. Approve the timesheet and Finance can run payroll from it. One record, one chain, no chasing.",
        path: "/time-off/vacation-request",
        target: { selector: '[data-tour="page-content"]' }
      },
      {
        title: "The sidebar is your map",
        body: "Down the left side of every page is the sidebar, and it never changes on you. It holds your main page, Portals, Add functions, E-Signature and Staff Portal Training, plus the items most staff use — Purchases and Time & Attendance, which expand on hover. If your role carries admin duties, an Admin section appears at the bottom of this same list. Every portal you're inside has its own internal menu too, so the sidebar is for moving between areas, and the portal's own menu is for moving within one.",
        path: "/",
        target: { selector: '[data-tour="sidebar-nav"]' }
      },
      {
        title: "Portals open as tabs",
        body: "Open a portal from the Portals list, or from the + button at the right end of this bar, and it opens as a tab along the top of the screen — the same idea as tabs in a web browser. Each tab returns you to the exact page you left, so you can move between workspaces without losing your place. The x closes a tab when you're finished with it, and your Main Page tab always stays. Closing a tab doesn't sign you out of the portal: open it again from + whenever you need it.",
        path: "/",
        target: { selector: '[data-tour="global-tabbar"]', additionalSelectors: ['[data-tour="tabbar-add"]'] }
      },
      {
        title: "Your main page is home base",
        body: "Every sign-in starts on your main page, and it's the same page you return to all day. The top band carries announcements for everyone, and under your shortcut cards sit the alerts that involve you personally — a timesheet waiting for approval, a reimbursement or payment update, something that needs a decision. If you supervise a team, their requests arrive here too. Nothing needs checking: anything that needs you shows up in this space on its own.",
        path: "/",
        target: { selector: '[data-tour="dashboard-notifications"]', additionalSelectors: ['[data-tour="dashboard-announcements"]', '[data-tour="dashboard-hero"]'] }
      },
      {
        title: "Make the page yours",
        body: "Two things on your page belong to you alone. The shortcut cards are the portals you use most — chosen in Add functions — so your three or four regular workspaces are always one click away. And the panels below are optional widgets you switch on or off, so your page can be short or full depending on what you like. Changing either one only affects your own view; nobody else's page moves.",
        path: "/",
        target: { selector: '[data-tour="dashboard-customize"]', additionalSelectors: ['[data-tour="dashboard-portals"]'] }
      },
      {
        title: "The widgets you'll actually use",
        body: "You don't need to try all of these today. Two earn their place on almost everyone's page: Quick Files stores and finds documents without leaving your main page, and the How-To Knowledge Base answers plain-language questions about using the app. Others — such as the personal organizer, translate or recent activity — are there if they suit the way you work.",
        path: "/",
        target: { selector: '[data-tour="dashboard-quickfiles"]', additionalSelectors: ['[data-tour="dashboard-howto"]'] }
      },
      {
        title: "Everyday staff items",
        body: "Two sidebar groups carry the requests and records every employee touches, whichever portal their role lives in. Purchases holds reimbursement requests and MasterCard receipts. Time & Attendance holds vacation and time-off requests, sick and personal days, and your timesheets. Hover either group to see its pages — they stay in the sidebar no matter which portal you're working in, so you never have to go hunting for them.",
        path: "/",
        target: { selector: '[data-tour="sidebar-purchases"]', additionalSelectors: ['[data-tour="sidebar-time-attendance"]'] }
      },
      {
        title: "Where the training lives",
        body: "Staff Portal Training is the catalog: every module for the portals you have access to, listed in one place, and your progress saves itself as you go. Treat it as a reference shelf rather than homework. There's a module for each portal and for everyday staff tasks, and you can start, pause and come back to any of them whenever the work comes up. The one you're in now is simply the first in the list.",
        path: "/staff-training",
        target: { selector: '[data-tour="training-catalog"]' }
      },
      {
        title: "Search, your account, and getting help",
        body: "The search field at the top looks across the tools available to you. Your name at the top right opens your own settings — profile and photo, e-signature, preferences — and the way to sign out. And when you're unsure how to do something, start with the How-To Knowledge Base on your main page: it answers in plain language from the staff how-to guide. For anything about your access, ask your supervisor or an administrator.",
        path: "/",
        target: { selector: '[data-tour="topbar-profile"]', additionalSelectors: ['[data-tour="topbar-search"]'] }
      },
      {
        title: "What to remember today",
        body: "Three things, and that's enough: your main page is where you start; the Portals list or the + button opens a workspace; and the sidebar and top bar go with you everywhere. Everything else can wait until the work calls for it. Most people settle into two or three portals and never open the rest — that is completely normal here, and no one expects you to know the others."
      },
      {
        title: "Time to practice",
        body: "That's the tour. The practice checklist has three small, no-pressure tasks: open a portal and come back, pin the portal you'll use most, and open the training catalog. Any of them can be skipped or done later — nothing in this module stands between you and starting the training that matters for your own role."
      }
    ],
    tasks: [
      {
        id: "welcome-portal",
        title: "Open a portal, then come back",
        body: "Open any portal from the Portals list or the + button, then click your Main Page tab to return.",
        hint: "Click Portals in the sidebar (or + at the right end of the tab bar), choose any portal, then click the Main Page tab at the top left to come back.",
        path: "/portal",
        verify: { kind: "self" }
      },
      {
        id: "welcome-pin",
        title: "Pin the portal you'll use most",
        body: "Hover a shortcut card on your main page and pin the portal you expect to open every day.",
        hint: "On your main page, hover over a portal card and click the pin that appears in its corner. It then gets a banner at the top of your page.",
        path: "/",
        verify: { kind: "self" }
      },
      {
        id: "welcome-catalog",
        title: "Visit the training catalog",
        body: "Open Staff Portal Training and find the module for the portal your role actually uses.",
        hint: "Click Staff Portal Training in the sidebar and look down the list for the portal you work in most. You don't have to start it now.",
        path: "/staff-training",
        verify: { kind: "self" }
      }
    ]
  }
];