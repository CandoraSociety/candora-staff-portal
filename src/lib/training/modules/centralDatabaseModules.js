// ── Central Database training modules ─────────────────────────────────────
// The central database is the one place where every person Candora serves has
// a single file. It is also the meeting point of every program portal, so both
// modules explain how the record is fed and read by the other portals — the
// basic module in terms of what you see on a file, the advanced one in terms
// of ownership, linking, duplicates and reporting.

export const CENTRAL_DATABASE_MODULES = [
  {
    key: "central_database_basics",
    title: "Central Database — Basics",
    shortTitle: "Central Database",
    blurb: "One record per person: find a client file, read it safely, add a note and record a visit — and see how the program portals and Reception feed this shared record.",
    path: "/rc",
    steps: [
      {
        title: "Welcome to the central database",
        body: "The Candora Central Database is the one place where every person we serve has a single file. Program portals keep the detail of their own programs; this portal keeps the person — contact details, case work, notes, safety alerts, visits, needs and referrals. Training runs on simulated data, so open anything you like.",
        path: "/rc",
        target: { text: "Candora Central Database" }
      },
      {
        title: "Watch the introduction",
        body: "Press Play to hear the introduction. You can pause, replay or move between scenes; each scene stays on screen until its narration finishes. When you're ready, press Next below to continue training.",
        introExplainer: true
      },
      {
        title: "The dashboard",
        body: "Three counts open the day: active clients, PHAC clients with children 0-6, and referrals still waiting on a decision — each one a shortcut into the list behind it. Below them sits the pending referral list, and the upload strip files documents straight into the central database's own folder in the vault.",
        path: "/rc",
        target: { selector: 'a[href="/rc"]' }
      },
      {
        title: "The Database list",
        body: "Database is the full list: every client file, one card each, showing their case status, worker, contact details and any funder tags. Click a card to open the whole file.",
        path: "/rc/clients",
        target: { selector: 'a[href="/rc/clients"]' }
      },
      {
        title: "Finding someone quickly",
        body: "The search box matches the name or the email. Around it are the filters that answer real questions: Program area shows everyone in one program, Status narrows to open or closed cases, Funder filters by funding pot, and Demographics picks out groups like newcomers or youth. Sort by recent activity when you're chasing something that just moved.",
        path: "/rc/clients",
        target: { selector: 'input[placeholder*="Search by name"]' }
      },
      {
        title: "Inside a client file",
        body: "The header holds contact details, case status and worker, funder tags, last visit and total visits. Under it come the program strips, the reason for accessing services, identified needs, staff notes and safety alerts. Read the alerts before any sensitive conversation — they are there to protect the client and you.",
        path: "/rc/clients",
        target: { selector: 'a[href^="/rc/clients/"]' }
      },
      {
        title: "Program strips — one person, many programs",
        body: "Each program that knows this person adds a coloured strip to the file. Pathways shows start date, stream, status and completion date; the other programs show their own participation line. It's how you see at a glance everything Candora is already doing for someone, without opening seven portals.",
        path: "/rc/clients",
        target: { selector: 'a[href^="/rc/clients/"]' }
      },
      {
        title: "Adding a note",
        body: "Add Note writes a staff note onto the profile card, where the next worker will read it. Tick Safety Alert and you must explain the concern — that explanation is what appears at the top of the file in red. Notes are for what another worker needs to know, not a diary.",
        path: "/rc/clients",
        target: { selector: 'a[href^="/rc/clients/"]' }
      },
      {
        title: "Recording a visit",
        body: "Client Visit in the menu is how the centre records someone actually coming in: a drop-in casework conversation or a scheduled visit. Every visit writes into that client's service history and updates their last visit and visit count, so the front desk stops being a separate notebook.",
        path: "/rc/intake",
        target: { selector: 'a[href="/rc/intake"]' }
      },
      {
        title: "Where the record comes from — the program portals",
        body: "When someone is registered in Pathways, EmpowerU, ELL, Digital Literacy, Community Programs, PHAC or FRN, that portal writes a condensed profile into this database and adds its program strip. Matching runs on email first, then first and last name with date of birth. Personal details are set once, when the record is first created, and the program portals don't overwrite them afterwards.",
        path: "/rc/clients",
        target: { selector: 'a[href="/rc/clients"]' }
      },
      {
        title: "Where the record is used",
        body: "The central file is read back by the program that owns the work: a Pathways client profile shows its own Central Database panel, Reception records visits into this same history, and reporting draws on service history across every program. One person, one history — that's the whole point.",
        path: "/rc/clients",
        target: { selector: 'a[href="/rc/clients"]' }
      },
      {
        title: "The habit that protects the data",
        body: "Check before you create. The program intakes and this portal both look for an existing file first, and choosing the existing one is always better than a second record holding half the history. If a name is spelled differently in a program portal, that portal's record is what needs correcting — otherwise the next sync won't find this file.",
        path: "/rc/clients",
        target: { selector: 'a[href="/rc/clients"]' }
      },
      {
        title: "Time to practice",
        body: "That's the tour. Next you'll find a client file, add a note, and record a visit — all on simulated data."
      }
    ],
    tasks: [
      {
        id: "cdb-search",
        title: "Find a client file",
        body: "Open Database and find a demo client by name, then narrow the list by program area. This is the move you'll make most often.",
        hint: "Database → type a name in the search box → try the Program area filter.",
        path: "/rc/clients",
        verify: { kind: "self" }
      },
      {
        id: "cdb-note",
        title: "Add a note to a file",
        body: "Open a demo client and add a staff note. Try the Safety Alert toggle to see how it changes where the note appears.",
        hint: "Open a client → Add Note → tick Safety Alert and write the explanation.",
        path: "/rc/clients",
        verify: { kind: "created", entity: "RCClientNote" }
      },
      {
        id: "cdb-visit",
        title: "Record a client visit",
        body: "Use Client Visit to record a drop-in or a scheduled visit for a demo client — it lands in their service history.",
        hint: "Client Visit → pick the client → choose the visit type → save.",
        path: "/rc/intake",
        verify: { kind: "created", entity: "RCServiceLog" }
      }
    ]
  },
  {
    key: "central_database_advanced",
    title: "Central Database — Advanced",
    shortTitle: "Advanced Database",
    blurb: "Stewarding the shared record: program participation and ownership, linking a program record to the right file, duplicates, referrals, service logs and funder reporting, and intensive case management.",
    path: "/rc",
    steps: [
      {
        title: "Stewarding the shared record",
        body: "This module assumes you're comfortable finding a file and logging a visit. Advanced work on the central database is stewardship: keeping the person linked to the right programs, reading what the other portals have written, and making the service history trustworthy enough to report on.",
        path: "/rc",
        target: { text: "Candora Central Database" }
      },
      {
        title: "Watch the introduction",
        body: "Press Play to hear the introduction. You can pause, replay or move between scenes; each scene stays on screen until its narration finishes. When you're ready, press Next below to continue training.",
        introExplainer: true
      },
      {
        title: "Who owns which fact",
        body: "The split matters. The central record owns identity and case work — contact details, case status, worker, notes, safety alerts, needs, visits and referrals. A program portal owns its own program detail: Pathways holds the plan, barriers and placements, ELL holds the class and CLB levels, EmpowerU holds the cohort and its checkpoints. The sync writes a participation strip and leaves the case work alone.",
        path: "/rc/clients",
        target: { selector: 'a[href="/rc/clients"]' }
      },
      {
        title: "Reading a participation strip",
        body: "A Pathways strip reads like a compact history: start date, stream, program status, and the completed or cancelled date — all written by the Pathways sync. The other programs write a single indicator line. A missing strip is information too: it means that program has never recorded this person, which is worth checking before you promise a seat.",
        path: "/rc/clients",
        target: { selector: 'a[href^="/rc/clients/"]' }
      },
      {
        title: "Filters that answer program questions",
        body: "Program area plus Status is the pair that does the work: everyone in Pathways still open, everyone in ELL closed, everyone in FRN. Funder narrows to the funding pot a report cares about, demographics isolate groups, and sorting by recent activity surfaces the files that moved this week.",
        path: "/rc/clients",
        target: { selector: 'input[placeholder*="Search by name"]' }
      },
      {
        title: "Waitlist signals from the other portals",
        body: "When the same person is on a waitlist elsewhere — ELL, EmpowerU, Digital Literacy, Community, FRN — their file shows an amber \"On waitlist for\" bar. It's how you avoid offering someone the same seat twice, and how a caseworker discovers a client is already queued for a program they didn't know about.",
        path: "/rc/clients",
        target: { selector: 'a[href="/rc/clients"]' }
      },
      {
        title: "Linking a program record to the right file",
        body: "Every program intake lists the central records that might be this person, along with what they're already in. Choosing the existing file creates a confirmed link, and from then on that program's sync updates this record instead of searching. Without the link the sync falls back to email, then name and date of birth — so a missing email or a name variant is exactly how a second file gets created.",
        path: "/rc/clients",
        target: { selector: 'a[href="/rc/clients"]' }
      },
      {
        title: "Referrals travelling between programs",
        body: "Referrals records both directions: what came to us from a partner organization, and what we sent out, each with a status that has to be moved on. Internal referrals made in Pathways arrive on the receiving program's dashboard, and this portal's own referral panel shows what settlement services has been handed. A referral that never changes status is an unfinished piece of work.",
        path: "/rc/referrals",
        target: { selector: 'a[href="/rc/referrals"]' }
      },
      {
        title: "Service logs are the reporting layer",
        body: "Each service log records the type of support, the duration, the funder category, and whether a follow-up is needed. Program reporting and the funder reports are built from these logs, not from memory — which is why a visit logged loosely becomes a number nobody can defend later.",
        path: "/rc/clients",
        target: { selector: 'a[href^="/rc/clients/"]' }
      },
      {
        title: "Case management and intensive services",
        body: "Case Management splits the caseload into Intensive Services, General Clients and 0-6 Caregiver Capacity, across a Master List and My Case Management. A needs and barriers assessment records what is actually going on, with priority and status; clients in intensive services unlock the fuller workspace of service plan, stages, goals, risks and outcomes.",
        path: "/rc/case-management",
        target: { selector: 'a[href="/rc/case-management"]' }
      },
      {
        title: "When two records exist",
        body: "It happens: a name spelled differently in one portal, a missing email, a typo in a date of birth. Work in the file that holds the history, correct the detail in the portal that got it wrong, and leave a note explaining what you found so the next person doesn't repeat the investigation.",
        path: "/rc/clients",
        target: { selector: 'a[href="/rc/clients"]' }
      },
      {
        title: "Confidentiality at the centre",
        body: "Every program that works with this person can see this file, so write what a colleague needs and nothing more. Safety alerts are the exception to brevity: write the concern plainly and completely. And remember the client may be sitting beside you — what's written here is read back by staff who will meet them again.",
        path: "/rc/clients",
        target: { selector: 'a[href^="/rc/clients/"]' }
      },
      {
        title: "Time to practice",
        body: "That's the tour. Next you'll work a referral, log a service with its funder category, and record a need or barrier — all on simulated data."
      }
    ],
    tasks: [
      {
        id: "cdb-rel-referral",
        title: "Move a referral forward",
        body: "Open Referrals, pick a pending referral and move its status on as if you had followed it up.",
        hint: "Referrals → open a pending referral → change its status and save.",
        path: "/rc/referrals",
        verify: { kind: "self" }
      },
      {
        id: "cdb-rel-service",
        title: "Log a service with its funder category",
        body: "Log a service on a demo client with its duration and funder category — this is what the funder reports count.",
        hint: "Open a client → Log Service → set the duration and funder category.",
        path: "/rc/clients",
        verify: { kind: "created", entity: "RCServiceLog" }
      },
      {
        id: "cdb-rel-need",
        title: "Record a need or barrier",
        body: "In Case Management, add a need or barrier with a priority so advice and referrals stay grounded in what's actually going on.",
        hint: "Case Management → General Clients → open a client → add a need or barrier.",
        path: "/rc/case-management",
        verify: { kind: "created", entity: "RCClientNeed" }
      }
    ]
  }
];