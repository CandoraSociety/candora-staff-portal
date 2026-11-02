// ── Mini-modules ──────────────────────────────────────────────────────────
// Short, single-page trainings that live in the "Mini-Modules" category of a
// portal's Resources tab. Each one stays on one page and can be finished in a
// few minutes, so it fits between conversations rather than taking an hour.
// Exported as MINI_MODULES and spread into TRAINING_MODULES.

export const MINI_MODULES = [
  {
    key: "pathways_resources",
    title: "Resources — career plans & job search",
    shortTitle: "Resources",
    blurb: "A few minutes on the Pathways Resources tab: building a career plan with a client, searching real job postings, and where the mini-modules live.",
    path: "/pathways/resources",
    steps: [
      {
        title: "What the Resources tab is for",
        body: "The Resources tab holds the two tools a career counsellor reaches for between appointments: Career Planning, which builds a route towards a target job with the client, and Job Search, which finds real postings for that job. Nothing on this page edits a client's file — it reads the file you already have and turns it into something you can talk through with the client.",
        target: { selector: '[data-tour="pw-resources-hero"]' }
      },
      {
        title: "One page, a few categories",
        body: "The categories run across the top. Career Planning is the default, Job Search sits beside it, and Mini-Modules collects the short trainings for this tab — including this one. Each category keeps its own tool on screen, so switching between them never loses what you were doing.",
        target: { selector: '[data-tour="pw-resources-tabs"]' }
      },
      {
        title: "Career Planning — start with the participant",
        body: "Every plan starts with who it is for and where they are heading. Pick the program participant first: choosing a client fills in their education, work history and skills from their Pathways file below, and you can still edit anything the file does not capture. Then set the Job Type / Career Goal and the location they are looking in — if the job they want is not on the list, choose Other and type it.",
        path: "/pathways/resources?tab=career",
        target: { selector: '[data-tour="pw-resources-career"]' }
      },
      {
        title: "Check the background before you generate",
        body: "The client background is what the plan is measured against, so read it before pressing the button. Education, work experience, skills and training all come across from the file; the career objective defaults to the job type. If the client has a resume on file, you will see the note that it gets read as part of the gap analysis — that is usually the richest source of what they have actually done. Leave the client blank and the same boxes work for someone who is not in the program yet.",
        path: "/pathways/resources?tab=career",
        target: { selector: '[data-tour="pw-resources-background"]' }
      },
      {
        title: "Generate the plan you will actually use",
        body: "Generate Career Plan returns the role requirements, the progression from where the client stands today, a gap analysis against their own background, and a step-by-step plan to close those gaps. Treat it as a draft for the conversation, not a verdict: the useful part is naming the gaps out loud and agreeing which one gets worked on first, then carrying that into the client's action plan and file notes.",
        path: "/pathways/resources?tab=career",
        target: { selector: '[data-tour="pw-resources-generate"]' }
      },
      {
        title: "Job Search — what is actually out there",
        body: "Job Search takes a job title and a location and comes back with real postings, direct links to the job boards for that search, and related titles worth showing the client. Search the title the client used themselves as well as the one the plan suggests — the difference between the two is often the conversation. Everything opens in a new tab, so you can keep the client's file on screen while you look.",
        path: "/pathways/resources?tab=jobs",
        target: { selector: '[data-tour="pw-resources-jobs"]' }
      },
      {
        title: "Time to practice",
        body: "That is the whole tab. Next up is a short practice: run one plan and one search with a client you are actually working with, so the tool is familiar before a client is sitting across from you.",
        path: "/pathways/resources?tab=career",
        target: { selector: '[data-tour="pw-resources-tabs"]' }
      }
    ],
    tasks: [
      {
        id: "pw-resources-plan",
        title: "Build a career plan for one client",
        body: "Pick a client you are working with, choose the job they are aiming at, check the background that carries over from their file, and generate the plan. Read the gap analysis — does it match what you know about them? Anything missing goes back into their file, not just into the plan.",
        path: "/pathways/resources?tab=career",
        verify: { kind: "self" }
      },
      {
        id: "pw-resources-search",
        title: "Search one job title and open a posting",
        body: "Choose the title your client uses for the work they want, add their location, and run the search. Open one posting and check it against the plan's requirements — this is what you will do live with a client, so it should take seconds.",
        path: "/pathways/resources?tab=jobs",
        verify: { kind: "self" }
      }
    ]
  },
];