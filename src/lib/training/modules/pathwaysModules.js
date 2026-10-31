// ── Pathways companion modules ────────────────────────────────────────────
// Split out of trainingModules.js to keep that file readable. Exported as
// PATHWAYS_EXTRA_MODULES and spread into TRAINING_MODULES in order.

export const PATHWAYS_EXTRA_MODULES = [
  {
    key: "pathways_assessment",
    title: "Barrier Identification & Assessment",
    shortTitle: "Assessment",
    blurb: "The assessment a Service Navigator completes before a client is assigned: verify the file, run the Barrier Identification Tool, finish the ERA in Compass, answer the Service Navigator question and complete the assessment.",
    path: "/pathways/intake",
    steps: [
      {
        title: "Where the assessment starts",
        body: "Every client who finishes intake sits in the New Intake — Awaiting Assessment list on the Intake page until their assessment is done. This module walks the assessment itself: what to verify, the Barrier Identification Tool, the ERA, and the question that decides whether a Service Navigator keeps the file.",
        target: { selector: '[data-tour="pw-intake-assessment"]' },
        path: "/pathways/intake"
      },
      {
        title: "Press Assess to open the file",
        body: "The Assess button beside a client's name opens their assessment. Nothing is recorded until you walk through the file, so pressing Assess is always safe — it opens the client's details first, not the barriers.",
        target: { selector: '[data-tour="pw-intake-assess-btn"]' },
        path: "/pathways/intake"
      },
      {
        title: "Verify the client information first",
        body: "The assessment opens on the client overview, not on the barriers. This is the same intake form the client filled in or the attendant completed, so read it: contact details, status in Canada, language, education, employment history and the eligibility answers. Anything missing or wrong is fixed here before the assessment goes any further. Matching the client against the central client database happens at the top of this page too, so a duplicate file is caught while it is still new.",
        target: { selector: '[data-tour="pw-assess-overview"]' },
        path: "/pathways/assessment/demo-pw-intake-jamie"
      },
      {
        title: "The Barrier Identification Tool — the BIT",
        body: "Down the page sits the BIT. You record each barrier the client faces — transportation, financial, housing, health, language, childcare and the rest — then the challenges behind that barrier and the action steps that address them. A barrier without action steps is only an observation; the action steps are what turn it into a plan. The BIT also sets how often it gets reviewed, so a barrier never quietly goes stale.",
        target: { selector: '[data-tour="pw-assess-bit"]' },
        path: "/pathways/assessment/demo-pw-intake-jamie"
      },
      {
        title: "The ERA — completed in Compass",
        body: "The Employment Readiness Assessment is not completed in this app — it is completed in Compass. What the portal asks of you is the confirmation: tick ERA Completed in Compass once it is genuinely done, upload the completed ERA form so the file can prove it later, and record your assessment notes and determination below. Compass referrals often arrive with an ERA already completed before they reach us — usually that result stands, but if the client's story or the barriers contradict it, that is worth a second look.",
        target: { selector: '[data-tour="pw-era-card"]' },
        path: "/pathways/assessment/demo-pw-intake-jamie"
      },
      {
        title: "Suggested action plan items for the counsellor",
        body: "The last thing on the assessment page before the determination is a set of action plan items you can suggest to whoever ends up counselling this client. Tick the ones you think the plan should carry — workshops, counselling, job search activities, or Other with your own wording — and write the notes that explain why. The counsellor sees your ticks and notes on the client's file at the moment they sit down to build the action plan, and chooses from there; the plan itself is still theirs to write. This is the fast way to pass on what you learned in the BIT without a conversation, and it costs nothing if you leave it blank.",
        target: { selector: '[data-tour="pw-assess-suggestions"]' },
        path: "/pathways/assessment/demo-pw-intake-jamie"
      },
      {
        title: "Does this client need a Service Navigator?",
        body: "One question closes the assessment: does this client need their barriers addressed by a Service Navigator? Yes means the barriers are heavy enough that barrier removal becomes its own stream of work, and a Service Navigator is picked right here — the client then appears on that navigator's dashboard alongside the career counsellor's list. No means the career counsellor carries the barriers as part of the plan. Service Navigation is tracked for WD clients only, so a DEA file cannot be assigned one.",
        target: { selector: '[data-tour="pw-era-sn-question"]' },
        path: "/pathways/assessment/demo-pw-intake-jamie"
      },
      {
        title: "Complete the assessment",
        body: "Complete Assessment moves the client out of Awaiting Assessment and into Assessment Complete — Awaiting Assignment on the Intake page. Nothing about the determination is decided here: the stream and the career counsellor are chosen on the Intake page, by the person who owns that decision. Completing the assessment is the handoff, not the end of the file.",
        target: { selector: '[data-tour="pw-assess-complete"]' },
        path: "/pathways/assessment/demo-pw-intake-jamie"
      },
      {
        title: "Back on the Intake page — awaiting assignment",
        body: "The client now sits in Assessment Complete — Awaiting Assignment, waiting for the Determination/Assignment step. Their BIT and ERA travel with the file: they show on the client's BIT / ERA tab for the rest of the client's time in the program, so any teammate can pick the file up and keep the barriers current. That is the assessment done — the practice tasks below take you through it end to end. From here the client's barriers become your week-to-week work, which the Service Navigation module walks you through.",
        target: { selector: '[data-tour="pw-intake-determination"]' },
        path: "/pathways/intake"
      }
    ],
    tasks: [
      {
        id: "pw-assess-open",
        title: "Open a client's assessment",
        body: "On the Intake page, press Assess beside one of the demo clients waiting in the Awaiting Assessment list.",
        hint: "Go to Intake and press Assess beside Jamie Joblab or Rai Referral — the client overview opens first.",
        path: "/pathways/intake",
        verify: { kind: "self" }
      },
      {
        id: "pw-assess-bit",
        title: "Record a barrier with its action steps",
        body: "In the BIT, choose one barrier, tick the challenges behind it and at least one action step, then save.",
        hint: "Pick Transportation or Financial Barriers, tick two or three challenges, add an action step such as 'Provide transit passes', and press Save on the barrier.",
        path: "/pathways/intake",
        verify: { kind: "self" }
      },
      {
        id: "pw-assess-era",
        title: "Mark the ERA complete and answer the navigator question",
        body: "Tick ERA Completed in Compass, then answer the Service Navigator question and complete the assessment.",
        hint: "Tick the checkbox, choose Yes or No on the barrier-removal question (pick a Service Navigator if you chose Yes), then press Complete Assessment.",
        path: "/pathways/intake",
        verify: { kind: "self" }
      },
      {
        id: "pw-assess-suggestions",
        title: "Suggest action plan items for the counsellor",
        body: "Tick two or three suggested action plan items, add a note and save the suggestions.",
        hint: "In the Suggested Action Plan Items block, tick items such as Job Search Workshop and Job Applications, write a short note, then press Save Suggestions.",
        path: "/pathways/intake",
        verify: { kind: "self" }
      }
    ]
  },
  {
    key: "pathways_service_nav",
    title: "Service Navigation — Working the Client File",
    shortTitle: "Service Navigation",
    blurb: "After the assessment: where an assigned client's file lives, how barriers are worked and resolved week to week, keeping the review dates and the progress timeline honest, and handing barriers off through referrals.",
    path: "/pathways/client/demo-pw-priya",
    steps: [
      {
        title: "The assessment was the start — this is the work",
        body: "Completing the assessment handed the client on; it did not end your involvement. From the moment a client is assigned to you as their Service Navigator, the barrier work in their file is yours week to week, while the career counsellor builds the employment plan on that same file. Your navigator clients appear in the Service Navigation section of your dashboard and on the Master List — open the file from either. This demo client is assigned to you as navigator with a different counsellor, which is the usual arrangement.",
        target: { selector: '[data-tour="pw-profile-header"]' },
        path: "/pathways/client/demo-pw-priya"
      },
      {
        title: "What a navigator sees",
        body: "When you are the assigned navigator and not also the client's counsellor, the file opens on a navigator view: Program Flow shows two steps, Barriers and Program Progress. The action plan, employment supports and placements stay with the counsellor. If you happen to hold both roles on a file you see the full flow, and Barriers is still your step to keep current.",
        target: { selector: '[data-tour="pw-profile-tabs"]' },
        path: "/pathways/client/demo-pw-priya"
      },
      {
        title: "Barriers — the step you own",
        body: "Everything recorded in the BIT during the assessment arrives here as editable cards: the barrier, the challenges behind it, the action steps and the dates. This is where a barrier is actually worked — moved to in progress when the work starts, and to resolved only when the need is genuinely met. Its review history sits with the card, so a barrier cannot quietly sit untouched for months.",
        target: { selector: '[data-tour="pw-flow-barriers"]' },
        path: "/pathways/client/demo-pw-priya"
      },
      {
        title: "Editing is yours alone",
        body: "Only the assigned Service Navigator can change barriers. Everyone else — the counsellor, supervisors, managers — sees the same cards read-only with a lock note beside the heading, so the barrier plan can't be edited by accident. Save Barriers records your changes on the file; the counsellor's plan is untouched by them.",
        target: { selector: '[data-tour="pw-barriers-tab"]' },
        path: "/pathways/client/demo-pw-priya"
      },
      {
        title: "What a barrier card holds",
        body: "Status is unresolved, in progress or resolved. Internal/External resources decides who actually addresses it — a Candora program, or an outside agency the client is referred to. Start and end dates place the barrier on the client's timeline. Action steps say what will be done, challenges record why the barrier exists, and resources and notes record who is involved and what happened.",
        target: { selector: '[data-tour="pw-barrier-1"]' },
        path: "/pathways/client/demo-pw-priya"
      },
      {
        title: "Resolving a barrier properly",
        body: "Resolved is not a status you tick and move on from. The card then requires an end date and a short note explaining how the barrier was resolved — that note is the record of what worked, and it is what a teammate reads when the client asks about it months later. Resolving a barrier also queues a Compass task for it, so the outcome reaches Compass instead of living only in the portal.",
        target: { selector: '[data-tour="pw-barrier-2"]' },
        path: "/pathways/client/demo-pw-priya"
      },
      {
        title: "Keep the dates and the check-ins honest",
        body: "The BIT set a check-in frequency and review dates, and those review dates plus the barrier windows appear on Program Progress as the client's timeline. Program Progress is also where the barrier windows sit against the counsellor's plan items, which is how you spot a barrier whose end date passed while the need is still there. Push a date out when the work slips — a stale date tells the wrong story at a funder review.",
        target: { selector: '[data-tour="pw-flow-progress"]' },
        path: "/pathways/client/demo-pw-priya"
      },
      {
        title: "Handing barriers off — referrals",
        body: "The Referrals tab is how a barrier leaves your desk. Internal referrals point at Candora's own programs — ELL, EmpowerU, Digital Literacy, Family Programs, Childcare, Settlement Services — and external ones at outside agencies. Saving a new referral emails the receiving program team with the client's name and what was referred, so the handoff is recorded on both sides and the barrier's Internal/External setting matches what actually happened.",
        target: { selector: '[data-tour="pw-tab-referrals"]' },
        path: "/pathways/client/demo-pw-priya"
      },
      {
        title: "The assessment stays on the file",
        body: "The BIT / ERA tab holds the complete Barrier Identification Tool and the ERA record as they stood when the determination was made, plus the Service Navigator question and who the client was assigned to. Barriers are worked in Program Flow, not here — come to this tab to read the original reasoning, re-open the full tool, or move the file to a different navigator when someone leaves or caseloads change.",
        target: { selector: '[data-tour="pw-tab-bit"]' },
        path: "/pathways/client/demo-pw-priya"
      },
      {
        title: "Time to practice",
        body: "That's the tour. Open the demo client as their navigator, move one barrier to in progress, resolve another with its resolution note, and send an internal referral so you see the handoff recorded."
      }
    ],
    tasks: [
      {
        id: "pw-sn-status",
        title: "Move a barrier to in progress",
        body: "Open the demo client, change one barrier's status to In Progress and save the barriers.",
        hint: "Barriers step, pick the Transportation barrier, set Status to In Progress and press Save Barriers.",
        path: "/pathways/client/demo-pw-priya",
        verify: { kind: "self" }
      },
      {
        id: "pw-sn-resolve",
        title: "Resolve a barrier with its note",
        body: "Resolve one barrier — including an end date and how it was resolved.",
        hint: "Set Status to Resolved, add the end date and write how the barrier was resolved, then save.",
        path: "/pathways/client/demo-pw-priya",
        verify: { kind: "self" }
      },
      {
        id: "pw-sn-referral",
        title: "Send an internal referral",
        body: "Send the client to one of Candora's own programs from the Referrals tab.",
        hint: "Open the Referrals tab, tick one internal referral such as Digital Literacy or Settlement Services, and save.",
        path: "/pathways/client/demo-pw-priya",
        verify: { kind: "self" }
      },
      {
        id: "pw-sn-timeline",
        title: "Check the barrier windows on the timeline",
        body: "Look at Program Progress and confirm the barrier dates sit against the plan items.",
        hint: "Open Program Progress and find the barrier rows next to the counsellor's plan items.",
        path: "/pathways/client/demo-pw-priya",
        verify: { kind: "self" }
      }
    ]
  },
  {
    key: "pathways_workshops",
    title: "Workshops & Job Club",
    shortTitle: "Workshops",
    blurb: "Create workshops and the recurring Job Club, schedule their sessions, take rosters and complete a workshop — which marks the matching action-plan item complete on every client who attended.",
    path: "/pathways/workshops",
    steps: [
      {
        title: "Workshops live in the Pathways menu",
        body: "Workshops are one of the group activities the action plan points at, so they sit inside the Pathways portal rather than in a separate calendar tool. This module covers creating them, scheduling recurring sessions, taking a roster and completing a workshop so attendance reaches the client's file.",
        target: { selector: 'a[href="/pathways/workshops"]' },
        path: "/pathways"
      },
      {
        title: "Three views, one workshop list",
        body: "All Workshops holds the active ones as cards. Schedule lays the same sessions out across dates so you can see what is running when. Completed keeps the finished workshops — the history the reports and billing read from.",
        target: { selector: '[data-tour="pw-workshops-tabs"]' },
        path: "/pathways/workshops"
      },
      {
        title: "Creating a workshop",
        body: "New Workshop takes a title, description, colour, facilitator, location and capacity. Capacity is not decoration: it is what the roster counts against when clients sign up. The audience setting decides whether the workshop is open to the public or reserved for clients of a program, which matters when it is offered outside the portal.",
        target: { selector: '[data-tour="pw-workshops-new-btn"]' },
        path: "/pathways/workshops"
      },
      {
        title: "The Job Club shortcut",
        body: "Job Club is the standing weekly session, so it gets its own button: it opens the same form already filled in — weekly, early afternoon, ninety minutes, capacity of twenty, with the description written. Rename it or change the times if your week looks different; the shortcut just saves retyping what never changes.",
        target: { selector: '[data-tour="pw-workshops-jobclub-btn"]' },
        path: "/pathways/workshops"
      },
      {
        title: "What a workshop card tells you",
        body: "Each card carries the facts you get asked on the phone: the next date from the recurrence pattern, the time, location, facilitator and how many of the capacity are already signed up. The recurrence line tells you whether it repeats weekly, biweekly or monthly — a one-off is marked as such, because nothing else will follow it.",
        target: { selector: '[data-tour="pw-workshops-grid"]' },
        path: "/pathways/workshops"
      },
      {
        title: "Taking the roster",
        body: "Roster opens the sign-up list for one specific session date, not for the workshop in general — a weekly workshop has a different room of people each week. From there you register clients, mark who attended and see who cancelled, which is what makes the attendance record trustworthy later.",
        target: { selector: '[data-tour="pw-workshops-roster"]' },
        path: "/pathways/workshops"
      },
      {
        title: "Completing a workshop — one click, many files",
        body: "Complete marks the workshop finished, and it does more than change a badge: every client marked as attended has the matching workshop item on their action plan marked complete. This is the whole reason workshops live in the portal — the attendance you took becomes progress on each client's roadmap without anyone updating files by hand.",
        target: { selector: '[data-tour="pw-workshops-complete"]' },
        path: "/pathways/workshops"
      },
      {
        title: "The schedule view",
        body: "Schedule shows the sessions by date, which is the fastest way to answer what is running this week and whether two workshops collide. Opening a session from here takes you straight to its roster.",
        target: { selector: '[data-tour="pw-workshops-tab-schedule"]' },
        path: "/pathways/workshops"
      },
      {
        title: "Time to practice",
        body: "That's the tour. Now create a workshop of your own, open its roster and sign a demo client up, then complete it and check that the client's action plan moved with it."
      }
    ],
    tasks: [
      {
        id: "pw-ws-create",
        title: "Create a workshop",
        body: "Create one workshop with a title, a start and end time, and a capacity.",
        hint: "Press New Workshop, fill in the title and times, set a capacity, and save.",
        path: "/pathways/workshops",
        verify: { kind: "created", entity: "Workshop" }
      },
      {
        id: "pw-ws-roster",
        title: "Take a roster for one session",
        body: "Open a workshop's roster and mark a client as registered or attended.",
        hint: "Press Roster on a workshop card, then add a client to that session date.",
        path: "/pathways/workshops",
        verify: { kind: "self" }
      },
      {
        id: "pw-ws-complete",
        title: "Complete a workshop",
        body: "Complete one workshop and confirm the attended clients' action plan updated.",
        hint: "Press Complete on a scheduled workshop, then open one attended client's file and look at their action plan.",
        path: "/pathways/workshops",
        verify: { kind: "self" }
      }
    ]
  }
];