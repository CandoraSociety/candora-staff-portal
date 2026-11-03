// ── ELL (English Language Learning) training module ────────────────────────
// Written for the program staff and instructors who run the language program:
// find a learner, keep the waitlist honest, set up a class, and prove progress
// with CLB assessments. Slides spotlight what is actually on each screen, so a
// learner sees the same layout they will use on their own shift.

export const ELL_MODULES = [
  {
    key: "ell",
    title: "ELL (English Language Learning)",
    shortTitle: "ELL",
    blurb: "Learners, waitlists, classes, curriculum and CLB assessments — plus how ELL connects to Central Registration.",
    path: "/ell",
    steps: [
      {
        title: "Welcome to the ELL portal",
        body: "Press Play to hear a quick overview of the ELL portal and what this module covers. Each scene stays on screen until its narration finishes. When you're ready, press Next below to continue training.",
        introExplainer: true
      },
      {
        title: "The dashboard",
        body: "Four counts across the top: total learners, active classes, instructors and assessments. Each one is a shortcut into the list behind it, so a shift starts with the size and health of the program in front of you rather than a search through menus.",
        target: { text: "Total Learners" },
        path: "/ell"
      },
      {
        title: "The two lists that answer most questions",
        body: "Active Classes shows what is running right now with its CLB level and instructor. Recent Learners shows the newest enrollments and their status. Below them, Program Referrals shows people referred into ELL from another Candora program — that panel is how a referral gets picked up instead of quietly going missing.",
        target: { text: "Active Classes" },
        path: "/ell"
      },
      {
        title: "Quick Actions",
        body: "The four Quick Actions are the work you do most: add a learner, create a class, add an instructor, start an assessment. They open the same screens as the menu along the top — shortcuts, not separate tools.",
        target: { text: "Quick Actions" },
        path: "/ell"
      },
      {
        title: "Learners — the roster",
        body: "Every person in the program with their CLB level, country of origin, contact details and enrollment status. Search by name, email or country and filter by status, so finding one person among hundreds takes seconds. Clicking a row opens that learner to update them rather than creating a second record.",
        target: { text: "All Learners" },
        path: "/ell/learners"
      },
      {
        title: "Active and waitlisted rosters",
        body: "The other two tabs slice the same roster. Active Learners lists everyone currently in a class with their course, CLB level and contact details — the list a funder asks for. Waitlisted Learners adds days waiting, oldest first, so nobody falls off the bottom unnoticed.",
        target: { text: "Active Learners" },
        path: "/ell/learners"
      },
      {
        title: "Adding a learner",
        body: "Add Learner opens the form. First language, country of origin and CLB level matter most, and the level can stay at not assessed until intake testing happens. Enrollment status decides where the person appears: waitlisted puts them on the waitlist, enrolled asks you to choose a class.",
        target: { text: "Add Learner" },
        path: "/ell/learners"
      },
      {
        title: "The waitlist",
        body: "Ordered oldest first, because that order is the promise we make to people. Switch to Alphabetical when someone phones and gives a name. Each person shows a position and any other Candora program waitlists they sit on — that badge is how you avoid offering one family two seats on the same day.",
        target: { text: "Date Added" },
        path: "/ell/waitlist"
      },
      {
        title: "Waiting, contacted, assessment booked",
        body: "Everybody on the waitlist carries a contact state: waiting, contacted, assessment booked, not interested or next term. Change it each time you make contact and add the note — the state alone is a claim, the note is the proof. Keeping both current is what keeps the list short.",
        target: { text: "Assessment booked" },
        path: "/ell/waitlist"
      },
      {
        title: "Classes",
        body: "Classes are the running groups. Each card carries the CLB level, instructor, schedule days, room and how many learners are enrolled. Create Class sets one up: name, level, instructor, days, times, room and capacity. Status decides what shows on the Schedule — planning and active yes, completed and cancelled no.",
        target: { text: "Create Class" },
        path: "/ell/classes"
      },
      {
        title: "Inside a class",
        body: "Open a class and you get four tabs. Participants is the roster in the room. Attendance records who actually came. Notes holds what the next instructor needs to know. Lesson Plans keeps the plan with the group it belongs to, week by week. This is the instructor's workspace — and the reason class records live here rather than in Central Registration.",
        path: "/ell/classes"
      },
      {
        title: "Course Profiles",
        body: "Not a list of classes — the curriculum. Each course with its level, description and expected length, ordered across the year, with a live count of learners currently enrolled. Use it when someone asks what a course covers or how long it runs.",
        target: { text: "Course Profiles" },
        path: "/ell/courses"
      },
      {
        title: "Schedule",
        body: "The active classes laid out by day of the week, in order, with time, room and instructor. It answers what is running today and which room an instructor is in — the two questions the front desk gets most.",
        target: { text: "Schedule" },
        path: "/ell/schedule"
      },
      {
        title: "Instructors",
        body: "Teaching staff with contact details and status. Only an active instructor can be chosen on a class, so a new teacher is added here first and then appears in the class form's instructor list.",
        target: { text: "Add Instructor" },
        path: "/ell/instructors"
      },
      {
        title: "Assessments",
        body: "CLB levels before and after, with the date, the assessor and any notes. Recording an after level also updates that learner's CLB level on their file — the pair of numbers is what proves progress, so record both, not only the new level.",
        target: { text: "New Assessment" },
        path: "/ell/assessments"
      },
      {
        title: "Where ELL meets Central Registration",
        body: "ELL programs and classes also appear in Central Registration, where the front desk registers people into them from one place — and approving that registration can create the learner record here. When a seat is offered from the ELL waitlist, the registration window shows two lists: the learners who asked for this class, or whose CLB level matches it, sit on top, and everyone else on the ELL waitlist sits below. Seat the matched learners first, then work down the rest by longest wait. Adding someone moves their existing record into the class, so nothing is retyped — and when a learner arrives already registered, check this roster before adding them again. One person, one learner record.",
        path: "/ell"
      },
      {
        title: "Time to practice",
        body: "That's the tour. Now you'll add a demo learner, work a waitlist entry through its contact states, create a class, move a waitlisted learner into it, and record a CLB assessment."
      }
    ],
    tasks: [
      {
        id: "ell-learner",
        title: "Add a new learner",
        body: "Register a demo learner with their language background and CLB level.",
        hint: "Go to Learners, click Add Learner and fill in their first language, country of origin and CLB level.",
        path: "/ell/learners",
        verify: { kind: "created", entity: "ELLLearner" }
      },
      {
        id: "ell-waitlist",
        title: "Work a waitlist entry",
        body: "Open the waitlist, contact a waiting learner and update their contact state with a note.",
        hint: "Open the Waitlist, pick a waiting learner and use the contact buttons to update their state with a note.",
        path: "/ell/waitlist",
        verify: { kind: "self" }
      },
      {
        id: "ell-class",
        title: "Create an ELL class",
        body: "Set up a class with a level, instructor, days, times and room, then find it on the Schedule.",
        hint: "Open Classes, click Create Class and fill in the level, instructor and at least one schedule day — then check the Schedule page.",
        path: "/ell/classes",
        verify: { kind: "created", entity: "ELLClass" }
      },
      {
        id: "ell-place",
        title: "Move a waitlisted learner into a class",
        body: "Take one waitlisted learner, set their status to enrolled and assign the class you created.",
        hint: "Open Learners, click the waitlisted learner, change Enrollment Status to enrolled and choose the class under Assigned Class.",
        path: "/ell/learners",
        verify: { kind: "self" }
      },
      {
        id: "ell-assess",
        title: "Record a CLB assessment",
        body: "Record an assessment for one of the demo learners, showing their before and after levels.",
        hint: "Open Assessments and record a new CLB assessment with the before and after levels.",
        path: "/ell/assessments",
        verify: { kind: "self" }
      }
    ]
  },
];