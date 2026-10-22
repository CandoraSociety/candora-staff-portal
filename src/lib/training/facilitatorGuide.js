// ── Facilitator guide content ──────────────────────────────────────────────
// Talking points, timings and session notes for the person DELIVERING the
// training (not the learner). stepNotes are keyed by the exact tour step title
// in trainingModules.js; a missing title just means the panel falls back to a
// generic hint, so nothing breaks if a step is renamed.

export const FACILITATOR_GUIDE = {
  dashboard: {
    duration: "About 40 minutes (5 intro · 15 tour · 15 practice · 5 wrap-up)",
    objectives: [
      "Staff can navigate their dashboard and customize it",
      "Staff know where announcements and approvals appear",
      "Everyone has set up their e-signature by the end of the session",
    ],
    stepNotes: {
      "Welcome to your Candora portal": "Introduce yourself and the plan for the session. Repeat the key message twice: Training Mode means nothing they click can damage real data, so explore freely. Ask who has signed in before to gauge the room.",
      "Announcements": "Point at the unseen-count and the scrolling titles. Common question: 'How do I make an announcement go away?' — clicking the ribbon opens the list and Clear marks everything seen; announcements also expire on their own.",
      "Your portals": "Cards are role-based: each person only sees the portals their job needs. Ask each person to name the one portal they expect to use most today — it sets up the pinning step.",
      "Pinning your favourites": "Demonstrate live: hover a card, click the pin, watch the banner appear at the top. Common question: 'Can I pin more than one?' — no, one pinned portal at a time.",
      "Your employee card and settings": "Ask everyone to check their own position and contact details are current; corrections go through their manager or an admin. Show the Customize button but don't go deep — profile editing isn't part of this session.",
      "Notifications and approvals": "This is the big one for supervisors: timesheet, vacation and reimbursement approvals surface here. For most staff, it's where payment notifications appear. Nothing needs to be 'checked' — it finds them.",
      "Turning widgets on and off": "Let people try this one themselves while you watch — it's low-risk and personal. Mention the two most-loved widgets: the Personal Organizer and the How-To search.",
      "Your personal organizer": "Emphasize it's private to them and follows them on any device. Suggest they use it right away for their first-week priorities.",
      "How-To knowledge base": "Common question: 'What if it doesn't know the answer?' — it falls back to AI in plain language, and every question is logged so the preset answers keep improving.",
      "Setting up your e-signature": "Everyone must complete this before signing real documents — it's also a practice task, so don't do it for them here. Mention all three methods (draw, type, upload) and that the reminder disappears once it's set.",
      "Time to practice": "Switch the room to hands-on. Point at the checklist: the e-signature setup and a quick note in the File Manager are the must-dos. Circulate while they work.",
    },
    practiceNotes: {
      "dash-pin": "Watch that people find the pin — it only appears on hover.",
      "dash-todo": "A quick early win; the organizer is on by default.",
      "dash-note": "Most common confusion: the + note button lives in the File Manager portal, not on the dashboard.",
      "dash-howto": "Invite people to ask a real question they actually have.",
      "dash-esign": "Must-complete before the session ends — verify each person's signature exists.",
    },
    tips: [
      "Have everyone signed in on their own device before you start the tour — the tour is better watched on the projector, practice is done on their screen.",
      "Keep the talking-points panel on your own laptop and mirror only the tour screen.",
    ],
  },

  pathways: {
    duration: "About 45 minutes (5 intro · 20 tour · 15 practice · 5 wrap-up)",
    objectives: [
      "Caseworkers can find and open any client on their caseload",
      "Caseworkers can run an intake without creating a duplicate record",
      "Caseworkers know how Compass tasks feed funder reporting",
    ],
    stepNotes: {
      "Welcome to Pathways": "Frame it in one sentence: Pathways is where a client's whole employment journey lives. Walk the sidebar slowly — it's the map for everything that follows.",
      "Home — your caseload snapshot": "The daily landing page: assigned clients, upcoming milestones, what needs attention. Supervisors see team-wide views here instead.",
      "My Clients — your dashboard": "Key concept of the whole session: caseloads are assigned by staff email. If a client 'goes missing', the first thing to check is the assigned worker — this solves most support calls.",
      "The Master List": "Show search and the program/status filters. Stress: this is every client in Pathways, not just theirs — always open a file from here rather than re-creating someone.",
      "Client profiles": "Everything in one place: barriers, action plans, employment, workshops, notes, history. Set the norm now: notes are shared with the whole team, so keep them factual and professional.",
      "Intake — adding a client": "The duplicate matcher runs as you type, and you can link straight to an existing central database file. This is a practice task — don't do it here, just show the flow.",
      "Compass tasks": "Explain the 'why': these checklist steps feed funder reporting, so completing them isn't just admin — it protects the program's funding.",
      "Employers and purchase requests": "Mention the approval chain: purchase and exposure-course requests go to a supervisor and the ED before anything is spent.",
      "Time to practice": "Hands-on time: everyone adds a demo client, opens a file from the Master List, and submits a purchase request. Circulate — intake is where people get stuck.",
    },
    practiceNotes: {
      "pw-intake": "Auto-checked. Intake is where people hesitate — walk them through the duplicate matcher.",
      "pw-profile": "Watch for people re-creating a client instead of searching the Master List.",
      "pw-compass": "Quick one — make sure they actually mark the task complete, not just open it.",
      "pw-purchase": "Auto-checked. Remind them the request needs a client attached.",
    },
    tips: [
      "Before the session, make sure each trainee is assigned at least one demo client so 'My Clients' isn't empty.",
      "Repeat the assigned-worker-by-email rule — it prevents the most common support call later.",
    ],
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