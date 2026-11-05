// ── Jim & Carla — focused process training ────────────────────────────────
// A deliberately short (and deliberately silly) module that opens the
// focused training for the two of them, then sets out what the sessions are
// actually for: learning the portals that are theirs, and taking real time to
// straighten out the admin processes underneath Finance, HR and File
// Management — including where work should flow to them from other portals.

export const JIM_CARLA_MODULES = [
  {
    key: "jim_carla",
    title: "Jim & Carla's Super Duper Awesome Fun, Extra Special Staff Portal Training",
    shortTitle: "Jim & Carla",
    blurb: "The welcome, the why, and the plan: role-specific portals plus real time spent refining finance, HR and file management processes — and deciding what should flow to you as a workflow instead of an email.",
    path: "/",
    steps: [
      {
        title: "Welcome to Jim & Carla's Super Duper Awesome Fun, Extra Special Staff Portal Training™",
        body: "That is now the official name. It will be on the agenda, and quite possibly on a badge. There are two of you, there are about seven slides, and there will be snacks — so pace yourselves. Everything in this module runs in Training Mode, which means every record you open and every button you press is simulated: you cannot break anything, and nothing here touches a real client, staff or finance record.",
        path: "/"
      },
      {
        title: "Two jobs in one room",
        body: "This training is doing two things at once, and it is worth naming them out loud. The first is straightforward: the two of you get the portals that are specifically yours — Finance, HR Management, the File Manager behind both — properly walked through, at your pace, with someone in the room instead of a help document. The second is less tidy and more valuable: taking actual time to pull apart the administrative processes underneath that work, including the ones nobody has ever written down, and putting them back together in a shape that holds.",
        path: "/"
      },
      {
        title: "The portals that are actually yours",
        body: "The Finance portal covers payroll, Pathways billing, staff reimbursements, Mastercard reconciliation, budgets, food services, e-signatures, invoice generation and cash-flow planning. HR Management covers employee records, performance reviews, incidents, documents, contracts, corrective actions, legal files, the pay grid, time logs, timesheets, recognition and onboarding. Both sit inside the same staff portal you already sign into — no separate app, no second password.",
        path: "/",
        target: { selector: '[data-tour="dashboard-portals"]' }
      },
      {
        title: "The other half: processes, not screens",
        body: "A screen is easy to teach — it has buttons and they do things. A process is what happens between the screens, and that is where the friction actually lives: the reimbursement that gets approved but never signed, the new hire whose employee record is created after their first pay period, the file that lives in three folders. So part of every session is simply walking one process end to end, as it is really done today, and writing down the steps that currently only exist in somebody's head.",
        path: "/"
      },
      {
        title: "Where the work should be coming to you",
        body: "This is the part worth being greedy about. A great deal of work arrives by email, by hallway conversation, or not at all. Reimbursements, timesheets, credit-card receipts, purchase requests, pay changes, file access, contract renewals — for each one, the question is the same: where does the request originate, who should it reach, what is it missing when it gets there, and should that path be a proper workflow with a queue, an owner and a status instead of a message somebody has to remember. Anything that can be named that clearly is something that can be built.",
        path: "/"
      },
      {
        title: "How one of these sessions runs",
        body: "It stays deliberately simple. Pick one real process — not a perfect one, just the next annoying one. Whoever does it walks it on the actual portal while everyone watches and interrupts freely. We write the steps down exactly as performed, including the workarounds. We mark the handoffs: who passes what to whom, and where it currently gets dropped. Then we agree on one change, small enough to finish, and it gets built into the portal rather than into a memo. Next session, next process.",
        path: "/"
      },
      {
        title: "Your homework is tiny, and it is real",
        body: "Before the first working session, bring three things: one process you run entirely from memory, one request that reaches you by email that really should not, and one thing in Finance, HR or file management that has annoyed you for longer than you would like to admit. That is the whole assignment. The practice checklist below is only to get your hands on the portals — press Start practice, tick things off, and the training sidebar will keep your place.",
        path: "/"
      },
      {
        title: "That's the deck. There are snacks.",
        body: "No quiz, no certificate, no motivational quotation. Just the two portals, one File Manager, a whiteboard, and permission to say \"this process is nonsense\" out loud in a room where something can then be done about it. Welcome aboard, both of you — press Next to start the practice checklist, or read on if you would rather learn the Finance portal first.",
        path: "/"
      }
    ],
    tasks: [
      {
        id: "jc-finance-open",
        title: "Open the Finance portal",
        body: "Go to the portal picker and open Finance. Find the dashboard, then name the three tiles most relevant to your own week.",
        hint: "Portals → Finance. The dashboard lists every finance area as a card.",
        path: "/finance",
        verify: { kind: "self" }
      },
      {
        id: "jc-hr-open",
        title: "Open HR Management",
        body: "Open HR Management and find your own employee record — then find where a new employee would be added.",
        hint: "Portals → HR Management → Employees. Use the search field rather than scrolling.",
        path: "/nexushr",
        verify: { kind: "self" }
      },
      {
        id: "jc-filemanager",
        title: "Find the folders behind the work",
        body: "In the File Manager, locate the folders that hold finance and HR documents. If you cannot tell which folder is authoritative, write that down — it is a session topic.",
        hint: "Portals → File Manager → browse categories. Use search for a document you know exists.",
        path: "/filemanager",
        verify: { kind: "self" }
      },
      {
        id: "jc-process-from-memory",
        title: "Name one process you run from memory",
        body: "Write down one administrative process you could not hand to a new person tomorrow without explaining it out loud. Keep it to a few lines.",
        hint: "Anywhere — a note is fine. Bring it to the first working session.",
        verify: { kind: "self" }
      },
      {
        id: "jc-email-that-should-be-a-workflow",
        title: "Name one request that should be a workflow",
        body: "Pick one thing that reaches you by email or conversation that really should arrive as a request with an owner and a status.",
        hint: "Reimbursements, timesheets, receipts, purchase requests, pay changes, file access — any of them count.",
        verify: { kind: "self" }
      }
    ]
  }
];