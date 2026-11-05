// ── Reports portal training ────────────────────────────────────────────────
// One module covering the four report types, how a report is built and
// produced, and where the data inside it comes from.
// Steps point at the labels that are actually on the screens.

export const REPORTS_MODULES = [
  {
    key: "reports",
    title: "Reports Portal",
    shortTitle: "Reports",
    blurb: "Writing and producing Candora's reports: internal reporting, funder reports, special reports and the Annual General Report, plus the data across the portal that fills them.",
    path: "/reporting",
    steps: [
      {
        title: "Welcome to the Reports Portal",
        body: "This portal is where Candora accounts for its year — to itself, to funders and to the board. Every report is built, reviewed and produced from here, and the figures inside come from records already kept elsewhere in the staff portal. You are in Training Mode, so everything is simulated.",
        path: "/reporting"
      },
      {
        title: "Four numbers, one picture",
        body: "The dashboard counts Total Reports, then splits them: Drafts, In Progress and Completed. Those four tiles answer the question a manager actually asks — what is written, what is still being written, and what is out the door. Each one filters down to the reports behind the number.",
        path: "/reporting",
        target: { text: "Total Reports", scope: "main" }
      },
      {
        title: "Four kinds of report",
        body: "Report Types are the four shapes this work takes. Internal reports are for the organization's own review. Funder reports answer the deliverables a grant agreement requires. Special reports cover one topic or one request. The Annual General Report is the year's full account, built from sections. Each card opens its own workspace.",
        path: "/reporting",
        target: { text: "Report Types", scope: "main" }
      },
      {
        title: "Internal reports",
        body: "Internal Reports is the plain, recurring side: a report has a title, a period start and end, its content, and a status that moves draft, in progress, completed. Because the period is recorded, last quarter's report is easy to find and easy to compare against — which is the whole point of writing it.",
        path: "/reporting/internal",
        target: { text: "Internal Reports", scope: "main" }
      },
      {
        title: "Funder reports",
        body: "Funder Reports is the reporting owed in exchange for money. Each report belongs to a funder and carries the deliverables they expect, with the period it covers. This is where a late report becomes visible before it becomes a problem with the funder.",
        path: "/reporting/funder",
        target: { text: "Funder Reports", scope: "main" }
      },
      {
        title: "Special reports",
        body: "Special Reports is the catch-all for one-off requests — a board question, a partner's information request, an evaluation. Same structure, same statuses, no period requirement. When someone asks for a report that is not recurring, it belongs here rather than in a document on someone's desktop.",
        path: "/reporting/special",
        target: { text: "Special Reports", scope: "main" }
      },
      {
        title: "The Annual General Report",
        body: "The Annual General Report is the big one, and it is built rather than typed. Each annual report is a record with its own sections, and each section holds its narrative, the data behind it and any visuals it needs. That is what lets the same report be reused year over year instead of started from a blank page.",
        path: "/reporting/agr",
        target: { text: "Annual General Report", scope: "main" }
      },
      {
        title: "Writing a section",
        body: "Inside a report the editor works section by section: give the section a heading, write or generate the narrative, and check the data it quotes. Suggestions and drafts are there to get you moving, but the section is only finished when a person has read it — the report goes out under Candora's name.",
        path: "/reporting/agr"
      },
      {
        title: "Preview, print and analysis",
        body: "Preview shows the report as a reader will see it, paginated for print. From there the print view produces the finished document, and the analysis page reads the whole report back to you — themes, gaps and anything that looks inconsistent. Read the preview before you print; it is the last place a mistake is cheap.",
        path: "/reporting/agr"
      },
      {
        title: "Where the numbers come from",
        body: "Reports draw on data already kept in the portal: Casual Client Data from Job Lab, Pathways service and outcome figures, food-services revenue filed through Finance, EmpowerU and ELL participant records. Nothing here should be retyped from a spreadsheet — if a figure is missing, the fix belongs on the page that owns it.",
        path: "/reporting",
        target: { text: "Casual Client Data (Job Lab)", scope: "main" }
      },
      {
        title: "Time to practice",
        body: "That's the tour. Now create an internal report, create a special report, and open the Annual General Report to see how its sections are laid out — all on simulated data."
      }
    ],
    tasks: [
      {
        title: "Create an internal report",
        body: "Open Internal Reports and create one with a title and a period. Save it as a draft, then reopen it and read the fields.",
        hint: "Internal Reports → New Report → set the title and period.",
        path: "/reporting/internal",
        verify: { kind: "created", entity: "Report" }
      },
      {
        title: "Create a special report",
        body: "Open Special Reports and create one for a one-off request — something a board member or partner might ask for.",
        hint: "Special Reports → New Report → give it a clear title.",
        path: "/reporting/special",
        verify: { kind: "created", entity: "Report" }
      },
      {
        title: "Open the Annual General Report",
        body: "Open the Annual General Report and look at a report's sections, then preview it to see how the finished document reads.",
        hint: "Annual General Report → open a report → Preview.",
        path: "/reporting/agr",
        verify: { kind: "self" }
      }
    ]
  }
];