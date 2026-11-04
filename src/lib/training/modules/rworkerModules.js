// ── Resource Worker training module ────────────────────────────────────────
// The worker's short route through the central client database: your caseload,
// the actions you take on a file, the visit flow without the front desk extras,
// and the resource finder. The point repeated throughout is that this portal
// edits the same client record everyone else reads — never a copy.

export const RWORKER_MODULES = [
  {
    key: "rworker",
    title: "Resource Worker Portal",
    shortTitle: "Resource Worker",
    blurb: "The worker's short route through the central database: My Clients, opening a file, editing it, logging a visit, scheduling, referrals and the resource finder.",
    path: "/rworker",
    steps: [
      {
        title: "Welcome to the Resource Worker portal",
        body: "This is the Resource Worker portal — the worker's route through Candora's central client database. It gives you the files assigned to you, a place to log what happened, and the tools to schedule, refer and find outside help, without asking you to learn the whole central database. Everything you save here lands on the same client record the entire organization reads. Training runs on simulated data, so try anything you like.",
        path: "/rworker",
        target: { selector: 'a[href="/rworker"]' }
      },
      {
        title: "Watch the introduction",
        body: "Press Play to hear the introduction. You can pause, replay or move between scenes; each scene stays on screen until its narration finishes. When you're ready, press Next below to continue training.",
        introExplainer: true
      },
      {
        title: "One database, two doors",
        body: "The Central Database portal and this portal read and write the same records. The difference is scope: the central database shows every client, every worker and every tool, while this portal shows your caseload and the handful of actions you take on it. A note you add here is on the client's file when a counsellor opens it in the central database a minute later. That is why there is nothing to synchronize and no second version to keep straight.",
        path: "/rworker",
        target: { text: "Client Case Work" }
      },
      {
        title: "Your two moves",
        body: "Two cards carry the day. Case Management opens your client files, and Client Visit starts a drop-in or scheduled visit. They sit above the counts on purpose: on a normal day you are either working a file or meeting someone at the desk, and both cards also show how much is waiting on you.",
        path: "/rworker",
        target: { text: "Intensive services, general clients" }
      },
      {
        title: "The counts underneath",
        body: "The three counts underneath read your work, not the organization's: clients assigned to you, visits waiting for you to complete, and appointments coming up. If a number looks wrong, the list behind it is the truth, so open the card and work from there rather than trusting the total.",
        path: "/rworker",
        target: { text: "Pending Visits" }
      },
      {
        title: "My Clients comes first",
        body: "Case Management opens on My Clients: every open file assigned to you. Beside it are the same three categories the central database files by — Intensive Services, General Clients and Caregiver Capacity for children under six — so you can look wider than your own caseload when you need to. The tab you are on always shows its count.",
        path: "/rworker/case-management",
        target: { selector: 'a[href="/rworker/case-management"]' }
      },
      {
        title: "Four tabs, three kinds of file",
        body: "Intensive Services are the families with active case management plans and a stage to move through. General Clients are the drop-ins and short pieces of work. Caregiver Capacity 0-6 are parents of young children, tracked so childcare, childminding and early-years supports can be offered. Every tab lists open files only — a closed file leaves the list but not the database.",
        path: "/rworker/case-management",
        target: { text: "Intensive Services" }
      },
      {
        title: "The row tells you enough",
        body: "Each row carries the name, the assigned worker, the number of visits and the case status, which is usually enough to decide whether to open it. Search runs on name, email or phone, so a call can be answered before the person finishes their sentence. Clicking a row opens the file.",
        path: "/rworker/case-management",
        target: { text: "My Clients" }
      },
      {
        title: "Opening a file",
        body: "A file opens with the person at the top: case status, worker, service category, phone, email, city, last visit and total visits, plus the staff notes and safety alerts the next worker has to see. Underneath, three tabs hold the history — Service History, Appointments and Referrals — and the header buttons below the name add to it.",
        path: "/rworker/clients/demo-rc-riley",
        target: { text: "Service History" }
      },
      {
        title: "Edit Client writes to the shared record",
        body: "Edit Client opens the same form the central database uses. Saving writes to the client record itself, so a corrected phone number or a new address is right everywhere immediately. Edit the record rather than writing a note about the change: a note leaves the old number live.",
        path: "/rworker/clients/demo-rc-riley",
        target: { text: "Edit Client" }
      },
      {
        title: "Log a visit or a service",
        body: "Log Visit / Service records what actually happened: the service type, the date, the worker, how long it took, what was discussed, whether a follow-up is needed and which funder category it belongs to. That entry becomes the client's service history — the version caseworkers, supervisors and funder reporting read, so write it specifically enough to be useful without the conversation in the room.",
        path: "/rworker/clients/demo-rc-riley",
        target: { text: "Log Visit / Service" }
      },
      {
        title: "Scheduling and referrals",
        body: "Schedule Appointment books the next conversation against the client's file: date and time, purpose, worker, status and notes. Referral opens three directions — refer to a Candora program, record an external referral to another organization, or record an incoming referral. All three belong to the same file, so a referral is never a message somebody has to remember.",
        path: "/rworker/clients/demo-rc-riley",
        target: { text: "Referral" }
      },
      {
        title: "The visit flow without the reception extras",
        body: "Client Visit is the same flow the front desk uses, without Grab and Go. Search for the client, check the details against the person in front of you, then choose Drop-In Casework for someone who walked in or Scheduled Visit when the visit matches a booking. The casework form records the intake details, the service category and what was discussed, then routes the visit to the assigned caseworker.",
        path: "/rworker/client-visit",
        target: { text: "Client search" }
      },
      {
        title: "Resource Finder",
        body: "Resource Finder answers the questions our own programs cannot. Type the situation in plain words — a single mother needing food and childcare — and the AI search looks for services across the Edmonton metro area, then matches them against Candora's own directory. You can also search by name, description or keyword and filter by category and type. Use it while the person is still in front of you.",
        path: "/rworker/resources",
        target: { text: "AI-Powered Search" }
      },
      {
        title: "Intensive cases stay in the Central Database",
        body: "An intensive case has a plan, stages, tasks and closure — a bigger file than this portal is built for. When a client has one, their profile shows the case banner with the stage and the open tasks, and Open case file takes you to it in the Central Database portal. Your visit, service and referral records still sit on the client file here, so the case work and the day-to-day history stay in one place.",
        path: "/rworker/case-management",
        target: { text: "Intensive Services" }
      },
      {
        title: "Who does what",
        body: "Resource workers keep their caseload current: open the file before the conversation, log the visit the same day, schedule the follow-up and refer while the need is fresh. Caseworkers and supervisors work the fuller intensive case file in the central database. Reception records the visit at the door when it starts with them. Finance and funder reporting read the service history you write.",
        path: "/rworker"
      },
      {
        title: "Time to practice",
        body: "That's the tour. Now you'll open a client file, log a service, schedule an appointment and run a drop-in visit."
      }
    ],
    tasks: [
      {
        id: "rw-client",
        title: "Open a client file",
        body: "Find one of your clients in Case Management and read the file — status, worker, last visit, notes and history.",
        hint: "Open Case Management, start on My Clients, search for a name and click the row. Read the header, then look through Service History, Appointments and Referrals.",
        path: "/rworker/case-management",
        verify: { kind: "self" }
      },
      {
        id: "rw-service",
        title: "Log a service",
        body: "Record a service against a client: what happened, how long it took and whether a follow-up is needed.",
        hint: "Open a client file, press Log Visit / Service, choose the service type and date, add the notes and save. It appears straight away under Service History.",
        path: "/rworker/case-management",
        verify: { kind: "created", entity: "RCServiceLog" }
      },
      {
        id: "rw-appointment",
        title: "Schedule an appointment",
        body: "Book the next conversation against a client's file.",
        hint: "Open a client file and press Schedule Appointment (or use the button in the portal header), then set the date, time, purpose and worker and save.",
        path: "/rworker/case-management",
        verify: { kind: "created", entity: "RCAppointment" }
      },
      {
        id: "rw-visit",
        title: "Run a drop-in visit",
        body: "Log a drop-in casework visit for a client who walked in without an appointment.",
        hint: "Open Client Visit, pick the client from the search, choose Drop-In Casework, fill in the service category and what was discussed, and submit.",
        path: "/rworker/client-visit",
        verify: { kind: "created", entity: "RCClientVisit" }
      }
    ]
  }
];