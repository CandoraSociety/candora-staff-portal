// ── Facilitator guide content ──────────────────────────────────────────────
// Talking points, timings and session notes for the person DELIVERING the
// training (not the learner). stepNotes are keyed by the exact tour step title
// in trainingModules.js; a missing title just means the panel falls back to a
// generic hint, so nothing breaks if a step is renamed.

export const FACILITATOR_GUIDE = {
  dashboard: {
    duration: "About 45 minutes (5 intro · 20 tour · 15 practice · 5 wrap-up)",
    objectives: [
      "Staff can navigate their dashboard and customize it",
      "Staff know where announcements and approvals appear",
      "Everyone has set up their e-signature by the end of the session",
    ],
    stepNotes: {
      "Welcome to your Candora portal": "Introduce yourself and the plan for the session. Repeat the key message twice: Training Mode means nothing they click can damage real data, so explore freely. Ask who has signed in before to gauge the room.",
      "What is the Candora Staff Portal?": "Press Play to start the female narration. Each scene advances only after its audio finishes; pause or replay whenever the room needs more time. The logo is Candora's original uploaded sunflower logo. Keep the explanation grounded: ERP means one connected system for day-to-day work instead of separate programs. Some functions are still being built, and nobody is expected to learn every portal today.",
      "What's a portal?": "Clear up the naming confusion out loud: the whole app is the Candora Staff Portal, and the areas inside it are also portals. Analogy that lands: portals are like separate apps inside one staff portal, each one a workspace for a different part of the job.",
      "Opening a portal": "Demonstrate both entry points: Portals in the sidebar, and the + on the tab bar. Emphasize that the picker only shows the portals each person's role gives them — that's why neighbours may see different lists.",
      "Inside the Portals tab": "The tour now opens the actual Portals page. Point out the card names, descriptions and categories, then demonstrate the search and category filters. Explain that this is the full available list, unlike the personal shortcuts on the main page. Internal portals open in the app's tab bar; external tools open in a separate browser tab.",
      "Portals open like browser tabs": "The analogy everyone gets: it works like internet browser tabs. Have them open one portal and click back to their Main Page tab so they feel the switch; mention the x to close a tab and that the main page tab always stays.",
      "Your portal shortcuts": "Cards are each person's own picks: only the portals they've turned on in Add Functions appear here. Ask each person to name the one portal they expect to use most today — it sets up the pinning step.",
      "Pinning your favourites": "Demonstrate live: hover a card, click the pin, watch the banner appear at the top. Common question: 'Can I pin more than one?' — no, one pinned portal at a time.",
      "Notifications and approvals": "This is the big one for supervisors: timesheet, vacation and reimbursement approvals surface here. For most staff, it's where payment notifications appear. Nothing needs to be 'checked' — it finds them.",
      "Turning widgets on and off": "Let people try this one themselves while you watch — it's low-risk and personal. Point out that the dedicated Dashboard Widgets module covers what each widget does in detail; today only show them the toggle itself.",
      "Quick Files — upload right from your dashboard": "Live demo: upload a one-page PDF with a real category and a couple of keywords so the room sees it land organized in the vault. Common question: 'What about folders, bulk uploads or sharing?' — that's the File Manager portal.",
      "Quick Files — search without leaving your page": "Have trainees search for the file you just uploaded using one of its keywords — that's the payoff moment for filling in keywords at upload.",
      "Setting up your e-signature": "Everyone must complete this before signing real documents — it's also a practice task, so don't do it for them here. Unlike the rest of the session, this setup is REAL and persists after training: tell the room, so they pick a PIN they'll actually remember. Mention all three methods (draw, type, upload) and that the reminder disappears once it's set.",
      "Time to practice": "Switch the room to hands-on. Point at the checklist: the e-signature setup is the must-do. Circulate while they work. Mention Part 2 — Time & Money — as the natural next module.",
    },
    practiceNotes: {
      "dash-pin": "Watch that people find the pin — it only appears on hover.",
      "dash-esign": "Must-complete before the session ends — verify each person's signature exists. Remind them it's the one real thing they set up today, so the PIN needs to stick.",
    },
    tips: [
      "Have everyone signed in on their own device before you start the tour — the tour is better watched on the projector, practice is done on their screen.",
      "Keep the talking-points panel on your own laptop and mirror only the tour screen.",
    ],
  },

  dashboard_widgets: {
    duration: "About 15 minutes (2 intro · 8 tour · 5 practice)",
    objectives: [
      "Staff know how to turn widgets on and off on the Add Functions page",
      "Staff can name at least two widgets useful to their own role",
    ],
    stepNotes: {
      "Your home page, your widgets": "This step opens the module intro: press Play and let the female narration run. Each scene advances only after its audio finishes; pause or replay whenever the room needs more time. Set expectations that the module is about personal choice, not a test.",
      "Announcements": "The tour detours to the main page for this one. Point at the unseen-count and the scrolling titles. Common question: 'How do I make an announcement go away?' — clicking the ribbon opens the list and Clear marks everything seen; announcements also expire on their own. Locked widgets (announcements, recent activity, upcoming events) are the same for everyone; everything else is opt-in.",
      "Turning widgets on and off": "Let people toggle freely here — it's their own home page and nothing can go wrong. Point out that portal shortcuts and Microsoft apps are chosen on this same page.",
      "The Personal Organizer": "Emphasize it's private to them and follows them on any device. Suggest they use it right away for their first-week priorities.",
      "The How-To AI Assistant": "Common question: 'What if it doesn't know the answer?' — it falls back to AI in plain language, and every question is logged so the preset answers keep improving.",
      "My Tasks and My Reminders": "Role-dependent: skip quickly for people whose work doesn't come with assigned Compass tasks; linger for those it does.",
      "Notes, birthdays and recent clients": "Quick pass — one sentence each. Team Birthdays is usually the crowd-pleaser; let the room react.",
      "Tracking widgets": "Only demo the ones your group actually uses (e.g. Time Log for hourly staff, Meeting Manager for admin staff). Close by repeating that nothing is mandatory.",
    },
    practiceNotes: {
      "wig-toggle": "Watch that toggles actually save — the card outline shows the state. Encourage them to leave their home page honest: only what they'll really use.",
      "wig-todo": "A quick early win; the organizer is on by default.",
      "wig-howto": "Invite people to ask a real question they actually have.",
    },
    tips: [
      "Run this module casually — it works well as a drop-in after the main page tour, or whenever someone asks 'what's that box on my home page?'",
    ],
  },

  staffadmin: {
    duration: "About 40 minutes (5 intro · 15 tour · 15 practice · 5 wrap-up)",
    objectives: [
      "Staff can request time off and log sick/personal days",
      "Staff can submit a timesheet without help",
      "Staff know where approvals and payments show up on their dashboard",
    ],
    stepNotes: {
      "Welcome to Part 2": "Position it as mini-module 1 of the two-part Time & Money training. Repeat the Training Mode message: every request they submit today is simulated and disappears when they exit.",
      "Booking time off": "Walk one request end to end on the projector: dates, submit, pending status. Common question: 'Who approves it?' — their supervisor, and they'll see the status change right on this page.",
      "Sick time and personal days": "The common mistake is booking sick days as vacation — show the difference and mention both feed the same balances.",
      "Submitting your timesheet": "Stress the payroll link: a late or missing timesheet means a late paycheque. Deadlines beat perfection here.",
      "The team schedule": "Practical tip to give the room: check this before requesting time off, so requests don't bounce off a week where coverage is thin.",
      "Where approvals and payments show up": "The reassurance step: nobody needs to poll these pages — approvals and payment notices arrive as dashboard notifications on their own.",
      "Time to practice": "Hands-on: everyone submits a time-off request, a sick day and a timesheet. Circulate — timesheet period dates are where people hesitate. Point to mini-module 2 for the receipts walkthrough.",
    },
    practiceNotes: {
      "tm-vacation": "Auto-checked. Have them pick a real future date so the form behaves like it will in real life.",
      "tm-sick": "Self-marked — remind them it's logged, not requested, but still reviewed.",
      "tm-timesheet": "Auto-checked. The must-do of this module: verify everyone submitted before the session ends.",
    },
    tips: [
      "Run this session close to a pay period start — timesheet habits stick best when the real one is due soon.",
      "Have the payroll deadline dates handy; it's the first question every group asks.",
    ],
  },

  staffadmin_money: {
    duration: "About 35 minutes (5 intro · 15 tour · 10 practice · 5 wrap-up)",
    objectives: [
      "Staff can add a receipt entry with the autofill upload, and by hand when autofill fails",
      "Staff can exclude personal items from a claim with the scissors control",
      "Staff know the difference between a reimbursement and a MasterCard receipt submission",
    ],
    stepNotes: {
      "Welcome to Receipts & Reimbursements": "Position it as mini-module 2 of Time & Money: the money half. Everyone should have a photo or PDF handy to practice the upload with.",
      "Start with Add Receipt Entry": "Set the two-part habit early: add entries as you spend, then submit them together. Receipts attached at entry time save everyone hunting later.",
      "Upload the receipt": "Show the autofill reading a receipt live — then deliberately show a blurry one failing. The lesson is that manual entry is normal, not a failure.",
      "When autofill doesn't work": "Walk every field: date, supplier, total. This is the step people actually get stuck on later — slow down here.",
      "Choose the program": "Common question: 'Which program?' — if unsure, their supervisor can correct it before approval, but a good first guess saves a round trip.",
      "Excluding personal items — the scissors": "The most common real-life case: a Costco receipt with a personal item on it. Show the GST handling.",
      "Now the Candora MasterCard": "Clarify the split: out-of-pocket goes to reimbursements, purchases on the org card go here. Finance reconciles the card statement from these uploads.",
      "Time to practice": "Hands-on: everyone adds an entry with an attached receipt and submits it, then does the same on the MasterCard side. Circulate — the program dropdown is where people hesitate.",
    },
    practiceNotes: {
      "tm-reimb": "Auto-checked. Encourage attaching a demo receipt — the habit that saves Finance the most time.",
      "tm-cc": "Auto-checked. Any image file works for the demo upload; the point is seeing the confirmation flow.",
    },
    tips: [
      "Have 2-3 sample receipts ready (one blurry, one with a personal item) so the autofill and scissors steps can be shown honestly.",
      "Repeat the money split: out-of-pocket = reimbursement, org card = MasterCard receipts.",
    ],
  },

  pathways: {
    duration: "About 40 minutes (5 intro · 15 tour · 20 practice)",
    objectives: [
      "Caseworkers can find and open any client on their caseload",
      "Caseworkers can navigate a client file: every tab, and the client journey it records",
      "Caseworkers can run an intake without creating a duplicate record",
      "Caseworkers know how Compass tasks feed funder reporting",
    ],
    stepNotes: {
      "Welcome to Pathways": "Frame it in one sentence: Pathways is where a client's whole employment journey lives. Walk the sidebar slowly — it's the map for everything that follows.",
      "Home — your caseload snapshot": "The daily landing page: assigned clients, upcoming milestones, what needs attention. Supervisors see team-wide views here instead.",
      "My Clients — your dashboard": "Key concept of the whole session: caseloads are assigned by staff email. If a client 'goes missing', the first thing to check is the assigned worker — this solves most support calls.",
      "The dashboard tabs": "Click through all four tabs live: My Clients, Compass Queue, Purchase Requests, Monthly Narrative Report. The amber badges are the 'needs attention' counters — trainees should check them at the start of each day.",
      "Your caseload, in sections": "The DEA / WD / Casual / Rejected cards are collapsible for a reason: the list gets long. Show how the placement sub-tabs (All Clients, Internal Training, Work Exposure) slice the same caseload.",
      "The Master List": "Show search and the program/status filters. Stress: this is every client in Pathways, not just theirs — always open a file from here rather than re-creating someone.",
      "The client journey — its own module": "Bridge slide: this tour showed where things live. The Client Journey module is the deep-dive that shows how it all connects — point trainees to it as the natural next session.",
      "Intake — adding a client": "The duplicate matcher runs as you type, and you can link straight to an existing central database file. This is a practice task — don't do it here, just show the flow.",
      "Compass tasks": "Explain the 'why': these checklist steps feed funder reporting, so completing them isn't just admin — it protects the program's funding.",
      "Employers and purchase requests": "Mention the approval chain: purchase and exposure-course requests go to a supervisor and the ED before anything is spent.",
      "Time to practice": "Hands-on time: everyone adds a demo client, opens a file from the Master List and clicks through its tabs, and submits a purchase request. Circulate — intake is where people get stuck.",
    },
    practiceNotes: {
      "pw-intake": "Auto-checked. Intake is where people hesitate — walk them through the duplicate matcher.",
      "pw-profile": "Watch for people re-creating a client instead of searching the Master List. Ask them to click through every tab in the file — Program Flow, Client Overview, Employment, Referrals, BIT / ERA, Stream Switches.",
      "pw-compass": "Quick one — make sure they actually mark the task complete, not just open it.",
      "pw-purchase": "Auto-checked. Remind them the request needs a client attached.",
    },
    tips: [
      "Before the session, make sure each trainee is assigned at least one demo client so 'My Clients' isn't empty.",
      "Repeat the assigned-worker-by-email rule — it prevents the most common support call later.",
    ],
  },

  pathways_journey: {
    duration: "About 25 minutes (4 intro · 21 tour)",
    objectives: [
      "Caseworkers can narrate how the journey starts: both intake roads, from form to New Intake",
      "Caseworkers know the Service Navigator flow: Barrier Identification, the ERA, then the determination — WD, DEA or not eligible — and assignment to a career counsellor",
      "Caseworkers can build the Employment Action Plan and know what saving it unlocks",
    ],
    stepNotes: {
      "Welcome to the Client Journey": "Frame it: Part 1 covers how every journey starts — intake, barrier identification, the ERA, the determination and the action plan. The three sample routes and the practice runs follow in Part 2.",
      "One intake, many roads": "The key framing: even the intake differs — a client self-filled form on the Job Lab, or an intake completed manually by the Service Navigator for a Compass referral. From there the roads converge (Barrier Identification, ERA, determination), then diverge by trajectory. Draw the roads on a whiteboard if you can.",
      "Every journey starts at Intake": "Two ways in — cover both: self-filled intake forms from the Job Lab, and Compass referrals. Reinforce the duplicate matcher: one client, one file.",
      "Intake — the Job Lab: what the client sees": "The tour jumps to the external portal page — the client-facing registration form job seekers complete on the job lab computers. Scroll the page together; the next six slides each spotlight one part.",
      "The form: personal information": "Point out only the name is required. Link it forward: these fields are what the duplicate matcher checks when the intake lands in Pathways.",
      "The form: status, language and education": "Emphasize status in Canada and English proficiency — they drive eligibility and hint at ELL referrals. Education history is self-added by the client.",
      "The form: employment history and eligibility": "The eligibility block — entitled to work, available immediately, income source, prior program — is what the determination leans on later in this module.",
      "The form: transportation, background and documents": "Frame these as practical barriers: licence, phone, internet, ID, criminal record, SIN. They decide which placements are realistic for the client.",
      "The form: career goals and circumstances": "The goals box becomes the action plan's raw material; the circumstances box is an early hint for Barrier Identification — clients may leave it blank, and that's fine.",
      "The Job Lab attendant's part": "Walk the bottom of the form live: both acknowledgements, the office-use checkboxes, the 4-digit access code, then Submit. Emphasize the attendant's observations — how much help the client needed, whether a translator came along, anything that came up in conversation — as an early signal for eligibility and the pathway determination. Once submitted, the client appears in the New Intake — Awaiting Assessment list back in Pathways.",
      "Intake — Compass referrals": "Spotlight the CEC Referral subsection of the New Intake list: referrals arrive from a CEC at Alberta Supports or the prime contractor. The accept-or-reject happens in Compass itself; if accepted, the Service Navigator completes the intake manually in Pathways CM.",
      "Barrier Identification — the Service Navigator": "Open Casey's profile and show the BIT / ERA tab — her confirmed barriers, challenges and actions are filled in, so trainees see a completed Barrier Identification on a real file. Stress the record must survive the worker.",
      "The Employment Readiness Assessment (ERA)": "The ERA is not done in the portal. Compass referrals usually arrive with their ERA already completed — we may disagree with it based on the client's full story and Barrier Identification, but typically we would not conduct another ERA. Once it's done, the step is verified complete in Compass — show trainees where it sits in the Compass queue.",
      "The determination: WD, DEA or not eligible": "The Service Navigator's call: WD, DEA, or not eligible — and not eligible usually means casual access to our resources. Then the navigator assigns the client to a career counsellor, who builds the action plan.",
      "Starting the plan": "Observer mode from here to the end of the journey slides — nobody presses anything. The Create Action Plan button is spotlit on Sam's file only to show where the plan gets built; trainees build one themselves in the practice runs.",
      "The Intake Summary": "Lecture slide: the builder pre-fills the client's whole story, plus the Program Start Date. There's nothing to click — keep the room moving.",
      "Choosing the plan items": "Lecture slide: the six plan-item groups, per-item anticipated dates, and the DEA difference (a short list of Employment Development Activities, roughly a two-week plan).",
      "Saving the plan — and what unlocks": "Lecture slide: saving creates the Compass task, unlocks the Program Flow steps, and the plan is recorded twice — here and again in Compass. This is Part 1's last stop — point trainees at Part 2 for the three roads and the practice runs.",
    }
  },

  pathways_journey_part2: {
    duration: "About 50 minutes (25 tour · 25 practice)",
    objectives: [
      "Caseworkers know the three sample journeys are examples, not the only pathways",
      "Caseworkers know where each journey stage is recorded in the client file",
      "Caseworkers can move a file through program status, record employment outcomes and referrals, and run the 90-day follow-up",
    ],
    stepNotes: {
      "Route 1 — the DEA road: meet Jordan Example": "Have every trainee open Jordan's file — the tour opens it for them. Contrast deliberately: the DEA road skips the placement stretch.",
      "Jordan's employment and completion": "Point out the employer, job title and start date in the Employment tab — then have trainees find the completed program status in Case Info themselves.",
      "Practice Run 1 — the full road from intake": "Set up the practice: Run 1 is the whole journey on a brand-new client, starting with a manual intake through the New Client button. Everything after this slide is hands-on.",
      "Practice Runs 2 and 3 — from Awaiting Assessment": "Runs 2 and 3 use Jamie Joblab (Job Lab self-registration) and Rai Referral (CEC referral), both already waiting in Awaiting Assessment — same assessment-to-assignment road, different starting points.",
      "Time to practice": "Point out the instructions-and-hints button on every practice task before letting them loose — nobody should be guessing where to click.",
      "Route 2 — the WD road with an internal placement: meet Sam Specimen": "Explain what an internal placement is for: real work experience inside Candora before an external employer.",
      "Sam's action plan — the WD road's first stretch": "Contrast with Jordan's DEA plan directly on screen: same Action Plan step, longer window — the WD road runs about sixteen weeks, and the placement grows out of this plan.",
      "Sam's internal placement": "Show how the placement sub-tabs slice the caseload — Sam appears in Internal Training because his placement is on his file.",
      "Inside the placement — the Internal Placements sub-tab": "Walk the placement record's checkpoints on screen: referral, orientation, health and safety, training goals, transportation — and the evaluation waiting at the end.",
      "Sam's Program Progress — the placement on the timeline": "First WD timeline the trainees see in full: point out the green placement bar alongside the purple activities, and the Program Status panel's exact phase underneath.",
      "Updating the placement — one click, three records": "If you can, demonstrate the three-way write on the projector: status change, progress note, Compass task — then have trainees find Sam's progress notes themselves.",
      "Where Sam's road goes next — work search, employment, the 90-day": "Connect it back to Jordan's ending: same finish line, different route — WD completes only after the 90-day follow-up, so the placement is never the last entry.",
      "Route 3 — the WD road with a work exposure placement: meet Casey Sample": "The busiest road: Compass tasks, purchase requests and an external placement all in motion.",
      "Casey's Compass tasks": "Explain the 'why' again: these steps feed funder reporting. Casey's pending tasks are visible in the Compass queue — show the badge count.",
      "Casey's purchase requests": "Walk the approval chain: request, supervisor, ED, purchase. Casey's pending request is a live example on the dashboard.",
      "Employment — recording outcomes": "Keep it practical: whichever road, outcomes are recorded in the Employment tab. Funder reporting reads from here.",
      "Referrals — the wider circle": "In and out: where the client came from, where they've been sent. One status per referral.",
      "When a client changes streams": "Stream Switches and its amber badge — a switched file must never go unnoticed. BIT and ERA assessments back the decision.",
      "The 90-Day Follow-Up — every road's last milestone": "The last milestone on every road — WD clients get it after employment, DEA clients after program completion. Stress the billing angle: the funder counts this one, so it never stays blank.",
      "Program Status — moving the file through its stages": "The file's life cycle: In Progress, then Complete — on WD only after the 90-day follow-up, on DEA via the completion decision — plus Cancelled and Incomplete. Stress that the 90-day date is set automatically at completion, and every move is a logged status change with undo, so mistakes are never permanent.",
      "Three sample journeys, one map": "The wrap-up: narrate the three sample journeys once more yourself — Jordan's completed DEA journey, Sam's internal placement, Casey's work exposure — and stress these are examples, not the only routes. Then point them at the practice tasks.",
    },
    practiceNotes: {
      "pj-run1-intake": "Watch for trainees skipping the duplicate matcher — reinforce search-first even on a made-up client.",
      "pj-run1-assess": "The full BIT-to-ERA sequence is the heart of the module — have each trainee say out loud what Complete Assessment does (moves the client to Assessment Complete — Awaiting Assignment).",
      "pj-run1-determination": "Quick task, but ask each trainee to say where the client appears next (the counsellor's My Clients list).",
      "pj-run1-plan": "This is the interaction the tour deliberately saved for last — circulate and check anticipated dates were set on ticked items.",
      "pj-run2-jamie": "Try Yes on the barrier-removal question and pick a Service Navigator — it's the only run that exercises that select.",
      "pj-run3-rai": "Same road as Jamie — a good check that the sequence stuck without the hints.",
    }
  },
  rc: {
    duration: "About 40 minutes (5 intro · 18 tour · 12 practice · 5 wrap-up)",
    objectives: [
      "Staff can search the central database and open a client file",
      "Staff can run an intake without creating a duplicate record",
      "Staff know safety alerts must be read before discussing sensitive matters",
    ],
    stepNotes: {
      "Welcome to the Resource Centre": "Set the stakes: this is the single source of truth for who our clients are — record quality here matters organization-wide. Training Mode means they can't break anything today.",
      "The dashboard": "Their starting overview: centre activity, pending visits, recent service logs. Point out it refreshes as the team works.",
      "Clients — the central database": "Show search by name and phone. Everyone searches before creating — the rule of this portal.",
      "Inside a client file": "Spend the most time here. Safety alerts sit prominently at the top: always read them before a sensitive conversation. Then notes, needs, visits, referrals.",
      "Intake — new clients": "The duplicate matcher is the hero: find the existing file before creating a new one. Two records for one person is this portal's biggest data problem.",
      "Referrals": "Incoming and outgoing, each with a status, so nothing falls through the cracks with partner organizations.",
      "Intensive case management": "For complex files only: service plans, stages, goals, risks. Most staff won't use it daily but should know it exists.",
      "Time to practice": "Hands-on: register a demo client, add a note (try a safety alert), log a service. Logging services correctly is what feeds funder reporting.",
    },
    practiceNotes: {
      "rc-intake": "Auto-checked. Encourage them to trigger the duplicate matcher on purpose by typing a demo client's name.",
      "rc-note": "Auto-checked. The safety-alert toggle is the interesting part — make sure everyone tries it.",
      "rc-service": "Auto-checked. Emphasize: a visit without a logged service is a visit funders never see.",
    },
    tips: [
      "Stress the search-before-create rule at every step — it's the habit that keeps the database clean.",
      "Safety alerts deserve a real example (an allergy, a no-contact request) so people understand their weight.",
    ],
  },

  ell: {
    duration: "About 40 minutes (5 intro · 18 tour · 12 practice · 5 wrap-up)",
    objectives: [
      "Staff can manage the learner roster and CLB levels",
      "Staff can work a waitlist entry with the correct contact state",
      "Staff know where assessments are recorded and why both levels matter",
    ],
    stepNotes: {
      "Welcome to the ELL portal": "Frame the portal: rosters, classes, courses, waitlist, assessments — the whole ELL program in one place.",
      "The dashboard": "The at-a-glance view: learners, classes, current capacity. Good place to answer 'how full are we?' questions.",
      "Learners": "The roster shows CLB level, enrollment status and class assignment per learner. Click a learner to update progress — encourage them to keep levels current.",
      "Classes": "Each class shows schedule, room and instructor. Opening a class reveals attendance, lesson plans and notes — the daily workspace for instructors.",
      "Courses": "Courses are the curriculum offerings across terms; classes are the running instances. People mix these up — say it twice.",
      "The waitlist": "The heart of the session: every waiting learner has a contact state (waiting, contacted, assessment booked...). Keeping states current is what makes the waitlist manageable instead of a black hole.",
      "Assessments": "CLB assessments record a before and after level — that pair is how we show learner progress to funders, so both fields matter.",
      "Time to practice": "Hands-on: add a demo learner with language background and CLB level, work a waitlist entry, record an assessment with both levels.",
    },
    practiceNotes: {
      "ell-learner": "Auto-checked. Remind them the CLB level can stay 'not assessed' until intake testing.",
      "ell-waitlist": "The contact state + note pairing is the habit to build — have everyone say out loud which state they'd pick.",
      "ell-assess": "Both before AND after levels — the after level is the one that proves progress.",
    },
    tips: [
      "Classes vs. courses confuses people — use a concrete example (CLB 4-5 Morning is a class this term).",
      "Waitlist contact states are a reporting metric: stale 'waiting' entries look like the program isn't responding.",
    ],
  },

  centralreg: {
    duration: "About 40 minutes (5 intro · 18 tour · 12 practice · 5 wrap-up)",
    objectives: [
      "Staff can register a participant into any program from one place",
      "Staff can approve or decline QR self-registration requests",
      "Staff can read a waitlist's position order and offer seats fairly",
    ],
    stepNotes: {
      "Welcome to Central Registration": "One framing sentence: this portal registers people into ANY Candora program from one place, so rosters and waitlists stay consistent across programs.",
      "The dashboard": "The cross-program overview: registrations, capacity and pending requests. Start here each shift.",
      "Programs": "Every program, its sessions and capacity controls live here. Capacity is what moves registrations onto the waitlist automatically.",
      "Registrations": "Statuses matter: pending approval, enrolled, waitlisted. Approving a registration can automatically create the participant record in that program's own portal — that's the magic sentence.",
      "Waitlists": "Full program = registrations land on the waitlist with a position. Positions are the fairness mechanism: seats get offered in order.",
      "Self-registration requests": "People who scan a program's QR code sign themselves up. Requests arrive here to approve or decline — and some programs are configured to register instantly with no approval step.",
      "Calendar": "Sessions by day and room — the answer screen for 'what's running when?'.",
      "Time to practice": "Hands-on: register a demo participant, work a self-registration request, and find a waitlist position order.",
    },
    practiceNotes: {
      "cr-register": "Auto-checked. Have them pick a program they actually work with.",
      "cr-request": "Approve or decline is fine — the point is seeing where QR signups land.",
      "cr-waitlist": "Ask them to explain the position order back to you — fairness rule sticks when said aloud.",
    },
    tips: [
      "Have a QR code handy (or on screen) so people connect the Requests screen to the physical poster.",
      "The approval-creates-the-participant flow is the 'aha' moment — demo it live with a demo request.",
    ],
  },
};

export const getFacilitatorGuide = (moduleKey) => FACILITATOR_GUIDE[moduleKey] || null;