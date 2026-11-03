// ── FRN and PHAC training modules ──────────────────────────────────────────
// The two family programs portals. FRN is targeted, referral-driven work:
// a person is referred in, assessed, enrolled and their attendance recorded.
// PHAC is drop-in work: families register, sessions run on a repeating
// schedule, and progress notes carry what staff observed. Both modules point
// at the labels that are actually on the screens, so a learner recognises the
// layout on their own shift.

export const FRN_PHAC_MODULES = [
  {
    key: "frn",
    title: "FRN Programs (Family Resource Network)",
    shortTitle: "FRN Programs",
    blurb: "Targeted family programs end to end: intake and referral status, assessments, enrolled participants, sessions and attendance.",
    path: "/frn",
    steps: [
      {
        title: "Welcome to the FRN portal",
        body: "Press Play to hear what the FRN portal is for and what this module covers. Each scene stays on screen until its narration finishes. When you're ready, press Next below to continue training.",
        introExplainer: true
      },
      {
        title: "The dashboard in four counts",
        body: "FRN is referral-driven work, so the dashboard counts the things that can stall: participants on file, referrals still pending, assessments due, and enrollments actually active. Each card opens the list behind it. If the first two numbers are high, someone has stopped working the intake — that is the read you want from this page, not the total.",
        path: "/frn",
        target: { text: "Pending Referrals" }
      },
      {
        title: "Enrollment by program, and referrals in",
        body: "Program Enrollment Overview shows each program's intake, enrolled and completed counts side by side, so you can see which group is full and which is short. Below it, the referrals panel lists people another Candora program has sent you: those are picked up here and nowhere else, so check it before assuming a referral never arrived.",
        path: "/frn",
        target: { text: "Program Enrollment Overview" }
      },
      {
        title: "Programs are the groups themselves",
        body: "Every targeted program gets a card: category, status, coordinator, capacity and how many participants are enrolled, how many sessions are scheduled, and how many documents are attached. Search by name or description and filter by category or status. A program paused or completed drops out of the choices elsewhere, so status is what keeps the lists honest.",
        path: "/frn/programs",
        target: { text: "New Program" }
      },
      {
        title: "Setting a program up properly",
        body: "New Program asks for the parts that decide everything downstream. The program key is what an incoming referral is filed under, so a program added later keeps the general key and staff match it by name — which is why naming matters. Add the coordinator and their email, the eligibility, the capacity, and attach the curriculum and handouts as documents from the card rather than emailing them around.",
        path: "/frn/programs",
        target: { text: "New Program" }
      },
      {
        title: "Opening a program card",
        body: "Click a card and you get the working view: the program's details, everyone enrolled in it, its upcoming sessions, and its documents. Add session from here pre-selects the program, and Edit takes you back to the form. This is the page to be on when a facilitator asks who is in their group next week.",
        path: "/frn/programs"
      },
      {
        title: "Participants — one record per person",
        body: "Participants is the roster of people, separate from their referrals. Search by name, email or phone to find someone before adding them again: two participant records for one person splits their goals, notes and attendance across two files. Every program that person is referred to hangs off this one record.",
        path: "/frn/participants",
        target: { text: "Participants" }
      },
      {
        title: "Inside a participant's file",
        body: "Programs & status shows every referral this person has, with its status. Profile details holds contact information, preferred language and the linked Central Database record. Progress & evaluations is the running record of how they are doing, Attendance history shows every session they were marked in, and their goals sit beside it. Refer to a program at the top sends them into another Candora program without retyping a thing.",
        path: "/frn/participants"
      },
      {
        title: "Intake & Referrals — the queue",
        body: "Every referral, whatever program it points at, lands here with its source, referral date, referrer and status. Filter by program or status and search by participant or referrer. This list is the intake meeting: worked top to bottom, nothing sits invisibly.",
        path: "/frn/intake",
        target: { text: "New Referral" }
      },
      {
        title: "Logging a referral",
        body: "New Referral records who is being referred, which participant record they belong to, the program, where the referral came from — internal Candora or an outside partner — plus the referrer's details, the date and the reason. If the person is new, the participant record is created in the same flow, so you never leave a referral pointing at nobody.",
        path: "/frn/intake",
        target: { text: "New Referral" }
      },
      {
        title: "Status is the promise you made",
        body: "Pending, assessment scheduled, assessed, accepted, declined, enrolled, completed, withdrawn. Move the status each time something actually happens, because that value is what the dashboard counts and what the next staff member reads before phoning the family. A referral parked at pending for three weeks is indistinguishable from one nobody opened.",
        path: "/frn/intake",
        target: { text: "All statuses" }
      },
      {
        title: "Assessments",
        body: "New Assessment records the scored picture of a participant — the assessment itself, its date, who did it and the outcome. This is the evidence that intake is being done thoughtfully rather than waved through, and it is what a funder reads when they ask how families were triaged into programs.",
        path: "/frn/assessments",
        target: { text: "New Assessment" }
      },
      {
        title: "Sessions — the dates a program meets",
        body: "New Session sets one date: the program, the date and times, the room, the facilitator, and how it repeats — none, weekly, biweekly or monthly, with an end date. Facilitator is picked from staff or from anyone already added as an eligible facilitator; the + beside it adds a contractor, volunteer or guest speaker who is not in the directory, so their name still lands on the session. Sessions carry their program by name, so renaming a program carries forward to the sessions already scheduled instead of orphaning them.",
        path: "/frn/sessions",
        target: { text: "New Session" }
      },
      {
        title: "Marking attendance",
        body: "Each session card carries an Attendance button, and the count beside it is how many were marked in for the most recent date. Open it and mark each enrolled participant present, absent, late or excused for that date, with a note where it needs explaining. Attendance is stored per participant per date, which is why retrospective guessing never works: mark the session on the day, then it feeds the participant's attendance history without anyone re-entering it.",
        path: "/frn/sessions",
        target: { text: "Attendance" }
      },
      {
        title: "One person, one file, across programs",
        body: "A participant created here is filed in the Candora Central Database, and every other portal that works with the same family reads that file. If someone is already in the database, link them when you add the participant rather than creating a second record; if you refer them onward, the receiving program sees the referral on their own dashboard. FRN keeps the program detail — the database keeps the person.",
        path: "/frn/participants"
      },
      {
        title: "Time to practice",
        body: "That's the tour. Now you'll add a demo participant, log a referral, move it through to enrolled, record an assessment and schedule a session with attendance."
      }
    ],
    tasks: [
      {
        id: "frn-participant",
        title: "Add a participant",
        body: "Create a demo participant with contact details and preferred language.",
        hint: "Open Participants, click Add Participant and fill in the first name, last name and a phone number.",
        path: "/frn/participants",
        verify: { kind: "created", entity: "FRNParticipant" }
      },
      {
        id: "frn-referral",
        title: "Log a referral into a program",
        body: "Refer a participant into one of the FRN programs and record where the referral came from.",
        hint: "Open Intake & Referrals, click New Referral, choose the participant and program, pick the referral source and add the reason.",
        path: "/frn/intake",
        verify: { kind: "created", entity: "FRNReferral" }
      },
      {
        id: "frn-status",
        title: "Work the referral to enrolled",
        body: "Take the referral you logged through assessment and on to enrolled.",
        hint: "On Intake & Referrals, open your referral and move its status from pending through accepted to enrolled.",
        path: "/frn/intake",
        verify: { kind: "self" }
      },
      {
        id: "frn-assessment",
        title: "Record an assessment",
        body: "Record an assessment for a demo participant with its date and outcome.",
        hint: "Open Assessments, click New Assessment and save it against a participant.",
        path: "/frn/assessments",
        verify: { kind: "created", entity: "FRNAssessment" }
      },
      {
        id: "frn-session",
        title: "Schedule a session and mark attendance",
        body: "Schedule a session for a program, then mark attendance for the families in it.",
        hint: "Open Sessions, click New Session, choose the program and date — then open that session's attendance and mark each participant.",
        path: "/frn/sessions",
        verify: { kind: "created", entity: "FRNSession" }
      }
    ]
  },
  {
    key: "phac",
    title: "PHAC Programs (drop-in family programs)",
    shortTitle: "PHAC Programs",
    blurb: "Drop-in programs for children birth to six: program setup with age range and season, repeating sessions, attendance and progress notes.",
    path: "/phac",
    steps: [
      {
        title: "Welcome to the PHAC portal",
        body: "Press Play to hear what the PHAC portal is for and what this module covers. Each scene stays on screen until its narration finishes. When you're ready, press Next below to continue training.",
        introExplainer: true
      },
      {
        title: "Drop-in work, measured in families",
        body: "PHAC programs are drop-in: parents and caregivers bring children from birth to six, and there is no referral to approve. So the dashboard counts what drop-in work produces — active programs, registered families, upcoming sessions and total attendance — rather than a queue of referrals waiting on a decision.",
        path: "/phac",
        target: { text: "Registered Families" }
      },
      {
        title: "The season, and referrals in",
        body: "Programs run September to June and pause in July and August; while they are paused the dashboard says so, and sessions resume in September. The referrals panel below lists families another Candora program has sent into PHAC — a referral still gets picked up here even though PHAC intake itself is drop-in.",
        path: "/phac",
        target: { text: "Active Programs" }
      },
      {
        title: "Programs — what a family can walk into",
        body: "Each card is a program a family can attend, with its category, status, age range, schedule days and times, its sessions and how many documents are attached. Search by name or description and filter by category or status; a paused program drops out of the choices elsewhere, which is how you stop staff from scheduling sessions for something that isn't running.",
        path: "/phac/programs",
        target: { text: "Add Program" }
      },
      {
        title: "Setting up a PHAC program",
        body: "Add Program asks for the details that answer a parent's question: category, eligibility, minimum and maximum child age in months, the schedule days and times, the room and the capacity in families. Season Starts and Season Ends define when it runs. Attach the handouts and curriculum from the card, so whoever facilitates has the material with the program.",
        path: "/phac/programs",
        target: { text: "Add Program" }
      },
      {
        title: "Opening a program card",
        body: "Click a card for the working view: the program's details, its facilitator, the families attending it, its upcoming sessions and its documents. Documents on the card opens the program's files, so handouts and curriculum travel with the program instead of being emailed around. Add Session from here pre-selects the program, and Edit returns you to the form. This is where you look when a facilitator asks who is coming and how many to expect.",
        path: "/phac/programs"
      },
      {
        title: "Sessions — the actual dates",
        body: "Add Session sets a real date for a program: program, session date, start and end time, room and facilitator, plus the headcount fields. Facilitator is picked from staff or from anyone added as an eligible facilitator, and the + beside it adds a contractor, volunteer or guest speaker who is not in the directory. RM, ARC, Echo Valley, the classrooms or Virtual — the room matters because two programs cannot book the same space at the same time, and the calendar checks it as you choose.",
        path: "/phac/sessions",
        target: { text: "Add Session" }
      },
      {
        title: "Repeating a session properly",
        body: "Repeats turns one date into the whole run: weekly, biweekly or monthly with a Repeat Until date. Set it once at the start of the term and the sessions exist for anyone planning around them, instead of being re-created by hand each week. A one-off stays at none — the honest answer is the useful one.",
        path: "/phac/sessions",
        target: { text: "Repeats" }
      },
      {
        title: "Attendance — family by family",
        body: "Each session card carries an Attendance button, with a count of how many were marked in. Open it and mark each family present, absent, late or excused for that date, with a note where it needs explaining. Separately, the session carries adults, children and total attendees, which is the headcount a funder asks for. Mark it on the day: attendance recorded weeks later is a reconstruction, not a record.",
        path: "/phac/sessions",
        target: { text: "Attendance" }
      },
      {
        title: "Families — one record per child",
        body: "Families holds one record per child with their guardian details and registration status: registered, waitlisted or inactive. Search by child or parent name before adding anyone — a second record splits that child's attendance and progress notes across two files, and neither will show the whole story.",
        path: "/phac/participants",
        target: { text: "Families" }
      },
      {
        title: "Inside a family's file",
        body: "Family & registration holds the child, the parent or guardian, the emergency contact, first visit date and status. Attendance history lists every session this family was marked in — proof of engagement rather than a claim about it. Progress notes is where what you actually observed lives, and Edit Family keeps the contact details current when a phone number changes.",
        path: "/phac/participants"
      },
      {
        title: "Progress notes",
        body: "Add Note records an observation, a development note, a contact or a general update: the date, the program it happened in, a rating — thriving, on track, needs support or follow up — what you saw, and the next steps. Write the next steps for the colleague who picks this family up after you, and leave the rating honest, because it is what surfaces a family that needs support.",
        path: "/phac/participants",
        target: { text: "Add Note" }
      },
      {
        title: "Linking to the Central Database",
        body: "When you add a family, match them against the Candora Central Database first. A linked record means every other program reads the same family file; an unlinked duplicate means a child appears twice with half their history in each place. Refer to a program from the family's file sends them onward, and the receiving portal sees the referral on its dashboard.",
        path: "/phac/participants"
      },
      {
        title: "Time to practice",
        body: "That's the tour. Now you'll add a family, create a program, schedule a session, mark attendance and write a progress note."
      }
    ],
    tasks: [
      {
        id: "phac-family",
        title: "Add a family",
        body: "Register a demo child with their parent or guardian and contact details.",
        hint: "Open Families, click Add Family and fill in the child's name, the guardian's name and a phone number.",
        path: "/phac/participants",
        verify: { kind: "created", entity: "PHACParticipant" }
      },
      {
        id: "phac-program",
        title: "Create a program",
        body: "Set up a program with its age range, schedule days, times and capacity.",
        hint: "Open Programs, click Add Program and fill in the name, age range, at least one schedule day and the capacity.",
        path: "/phac/programs",
        verify: { kind: "created", entity: "PHACProgram" }
      },
      {
        id: "phac-session",
        title: "Schedule a session",
        body: "Schedule a session for your program with a room, times and a repeat pattern.",
        hint: "Open Sessions, click New Session, choose your program, then pick the date, room and Repeat Until date.",
        path: "/phac/sessions",
        verify: { kind: "created", entity: "PHACSession" }
      },
      {
        id: "phac-attendance",
        title: "Mark attendance",
        body: "Open your session's attendance and mark the families who came.",
        hint: "On Sessions, open your session's attendance, mark each family and set the adults and children counts.",
        path: "/phac/sessions",
        verify: { kind: "self" }
      },
      {
        id: "phac-note",
        title: "Write a progress note",
        body: "Record an observation for a demo family with a rating and next steps.",
        hint: "Open Families, open a family, click Add Note and save it with a rating and next steps.",
        path: "/phac/participants",
        verify: { kind: "created", entity: "PHACProgressNote" }
      }
    ]
  },
];