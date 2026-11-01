// ── Welcome & app tour training module ─────────────────────────────────────
// The first module everyone takes: a friendly orientation to the whole
// Candora Staff Portal — the layout, the language and the few moves that
// apply everywhere. It deliberately teaches no portal in depth and tells
// learners, repeatedly, that they are not expected to remember any of it.

export const WELCOME_MODULES = [
  {
    key: "welcome",
    title: "Welcome to the Candora Staff Portal",
    shortTitle: "Welcome & App Tour",
    blurb: "Start here. A short orientation to how the whole app is laid out — the sidebar, the portals, your main page — and why you only need to remember a few things today.",
    path: "/",
    steps: [
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