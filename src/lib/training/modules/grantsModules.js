// ── Grants & Proposals portal training ─────────────────────────────────────
// The whole grant lifecycle in one workspace: finding a funder, building the
// proposal, submitting it, then reporting back on the money that was awarded.
// Steps point at the labels that are actually on the screens.

export const GRANTS_MODULES = [
  {
    key: "grants",
    title: "Grants & Proposals Portal",
    shortTitle: "Grants",
    blurb: "Finding funders, building proposals, tracking submissions and reporting back on awarded grants — the funder database, files and knowledge base that support all of it.",
    path: "/grants",
    steps: [
      {
        title: "Welcome to Grants & Proposals",
        body: "This portal follows a grant from the first idea to the final report. A funder is found in the Funder Database, a proposal is built as a project, the submission is tracked, and once the money is awarded the reporting deadlines live here too. You are in Training Mode, so everything you touch is simulated.",
        path: "/grants"
      },
      {
        title: "The dashboard tells you what is due",
        body: "The top of the dashboard counts your active proposals, submissions waiting on a decision, awards received and reporting deadlines coming up. Under it, Recent Projects shows the work in progress, and the report calendar lays every deadline on a timeline — the place to look when someone asks what is due this month.",
        path: "/grants",
        target: { text: "Recent Projects", scope: "main" }
      },
      {
        title: "One project per application",
        body: "Proposals is the working list: every application Candora is building, grouped and filterable by status, group and tag. Open a card and you are inside the project — its funder, the amount requested, the deadline, the objectives, the tasks and the documents that go with it. One application, one project, everything attached to it.",
        path: "/grants/projects",
        target: { text: "Proposals", scope: "main" }
      },
      {
        title: "Starting a new proposal",
        body: "New Proposal asks for the shape of the application first: the title, the funder, the amount, the deadline and which group it belongs to. From there the project detail page is where the writing happens — objectives, tasks with owners and due dates, and each document filed against the project so nothing lives in someone's email.",
        path: "/grants/projects"
      },
      {
        title: "Submissions, and what came back",
        body: "Submissions Archive holds everything already sent, grouped by the month it went out, with its outcome — submitted, awarded or declined. It is the institutional memory of the grants program: when a similar funder comes up, you can see what was asked for last time and how it landed.",
        path: "/grants/proposals",
        target: { text: "Submissions Archive", scope: "main" }
      },
      {
        title: "The Funder Database",
        body: "The Funder Database is the list of who gives money and how they prefer to be approached, grouped by type and relationship. Each funder keeps its own history, contact details and notes, including who has asked not to be contacted. Check here before a proposal is written, not after.",
        path: "/grants/funding-db",
        target: { text: "Funder Database", scope: "main" }
      },
      {
        title: "Reporting back on awarded money",
        body: "Reports is the after-award side: each hub carries the deliverables and deadlines owed to a funder, and shows how far along the reporting is. An awarded grant is not finished work — this is the page that keeps Candora in good standing with the funders who renew.",
        path: "/grants/reports",
        target: { text: "Reports", scope: "main" }
      },
      {
        title: "Files and the Knowledge Base",
        body: "Files gathers every project document and submitted report in one place — funder agreements, signed contracts and past reports. The Knowledge Base is the grant-writing memory: guidance, precedent language and answers pulled from what has been written before, so a new proposal starts from Candora's own best material.",
        path: "/grants/files",
        target: { text: "Files", scope: "main" }
      },
      {
        title: "Grants are not written alone",
        body: "A proposal draws on the rest of the portal: program numbers from Pathways and EmpowerU, food-services revenue from Finance, the year's story from the Annual General Report, and approved documents from the file vault. When a funder asks what the money achieved, the Reports portal already holds the answer.",
        path: "/grants/knowledge",
        target: { text: "Knowledge Base", scope: "main" }
      },
      {
        title: "Time to practice",
        body: "That's the tour. Now create a proposal, add a funder to the database and look at what a reporting hub expects — all on simulated data."
      }
    ],
    tasks: [
      {
        title: "Create a proposal",
        body: "Open Proposals and start a new one with a title, a funder, an amount and a deadline. Then open it and look at the objectives and tasks area.",
        hint: "Proposals → New Proposal → fill in the title and deadline.",
        path: "/grants/projects",
        verify: { kind: "created", entity: "Project" }
      },
      {
        title: "Add a funder",
        body: "Add a funder to the Funder Database with its type and relationship, so the next proposal can be matched to it.",
        hint: "Funder Database → add a funder → save.",
        path: "/grants/funding-db",
        verify: { kind: "created", entity: "PotentialFunder" }
      },
      {
        title: "Read a reporting hub",
        body: "Open Reports and look at one hub: which deliverables are owed, what the deadlines are, and how the progress is measured.",
        hint: "Reports → open a hub → read the deliverables.",
        path: "/grants/reports",
        verify: { kind: "self" }
      }
    ]
  }
];