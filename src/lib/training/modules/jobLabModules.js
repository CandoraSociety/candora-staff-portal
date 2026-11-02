// ── Job Lab training module ───────────────────────────────────────────────
// Job Lab is a separate portal for job seekers. This module covers the staff
// side (creating an account on the client's BIT / ERA tab), the participant
// side (what the portal does, guest vs registered), and where the activity it
// records is found afterwards.
//
// The participant pages themselves sit outside staff authentication, so the
// participant-side slides are centred cards rather than spotlights — the tour
// never leaves the staff app.

export const JOBLAB_MODULES = [
  {
    key: "joblab",
    title: "Job Lab",
    shortTitle: "Job Lab",
    blurb:
      "Set up a client's Job Lab account from the ERA, see what participants can do in the portal, and find the activity it records.",
    path: "/pathways/master",
    steps: [
      {
        title: "Welcome to Job Lab training",
        body:
          "Press Play to hear a short introduction. It explains what Job Lab is, the difference between a guest session and a registered account, and where this training is heading. Each scene stays on screen until its narration finishes. When you're ready, press Next below to continue.",
        introExplainer: true,
        path: "/pathways/master",
        target: { selector: '[data-tour-path="/pathways/master"]' }
      },
      {
        title: "Job Lab today — and where it's going",
        body:
          "Job Lab is a separate portal from this staff app, for people looking for work. It's deliberately separate: a participant never sees a client file, a staff name or anything from the staff portal. Today it opens from a shortcut on the Job Lab computers. The plan is to make Job Lab the main screen on every one of those computers, so the sign-in is already waiting when someone sits down — but that is not switched on yet. Until it is, staff open Job Lab from the Job Lab computers, and this module covers both halves: what staff do, and what the participant sees.",
      },
      {
        title: "Two ways in — guest or account",
        body:
          "There are two ways to use Job Lab, and the difference is what gets kept. A GUEST needs only a name. Every tool works during the visit — job search, the local job board, the resume builder, career path, printing and emailing — but nothing is saved after they sign out, and no account exists to sign back into. A REGISTERED ACCOUNT is created by staff. It keeps their applications, resumes and career plans between visits, and every sign-in is recorded on their client file. Guests still show up in the visit statistics (filed as a casual client), but they carry no history of their own. If someone is likely to come back, set up the account.",
      },
      {
        title: "Set up an account — the BIT / ERA tab",
        body:
          "Creating the account is staff work, done during the Employment Readiness Assessment. Open a client from the Master List — Sam Specimen here — and choose BIT / ERA. Below the ERA card is the Job Lab Account card. If the client already has an account, the card shows it as active with their sign-in email and visit count instead of a form. If it shows the form, they don't have one yet.",
        routePrefix: "/pathways/client/",
        routeFallback: "/pathways/client/demo-pw-sam",
        clickTarget: '[data-tour="pw-tab-bit"]',
        target: { selector: '[data-tour="jl-account-card"]' }
      },
      {
        title: "The three details you fill in",
        body:
          "Name is the name they'll see when they sign in — it defaults to the client's name on file. Email is their sign-in, so it has to be real and it has to be on the client's file first: if the client has no email, add one on their profile before creating the account. Password is a simple kiosk password of at least four characters — press Generate for one instead of inventing it. It is not an email login and there is no reset link, so write it down and give it to the client.",
        routePrefix: "/pathways/client/",
        routeFallback: "/pathways/client/demo-pw-sam",
        target: { selector: '[data-tour="jl-account-form"]' }
      },
      {
        title: "Create it — then hand over the sign-in",
        body:
          "Press Create Job Lab account. It is live immediately, and the password is shown once with a Copy button so you can hand it over on paper. The account is tied to this client record, so their visits are filed on this person's file — never as a duplicate casual client. If they forget the password later, use Update password on the same card: it sets a new one and signs out any session they left open. This part is real, not simulated, so during training read the card but don't press Create.",
        routePrefix: "/pathways/client/",
        routeFallback: "/pathways/client/demo-pw-sam",
        target: { selector: '[data-tour="jl-account-create"]' }
      },
      {
        title: "What the participant sees — the dashboard",
        body:
          "From here on, this is the participant's side. After signing in they land on a dashboard built for someone who may never have used a job-search site: a welcome panel, a short 'how Job Lab works' explainer, and three starting cards — find a job, get a resume ready, plan a next step. When something needs doing, a follow-up nudge appears at the top; the local job board shows its latest postings; and a Finish & sign out button sits at the bottom for kiosk use. The tools are always in the header and phone menu: Find jobs, Local jobs, Applications, Resume, Career path, Learn and Profile.",
      },
      {
        title: "Find jobs, and the local job board",
        body:
          "Find jobs is the online search: it suggests openings based on the skills and work history in their profile, and links straight out to the big job boards for the same search. Anything worth keeping is saved to their tracker in one click. Local jobs is different — it's our own board, posted by Candora and local employers through Pathways → Job Board. Postings show the employer, wage, hours, closing date and how to apply, filter by employment type, and save to the tracker the same way. If an employer tells you about an opening, the Job Board is where it goes so every participant can see it.",
      },
      {
        title: "Applications and follow-up nudges",
        body:
          "The tracker splits into Saved listings and Applications. When someone actually applies, they mark it applied and the tracker books a follow-up a week out automatically — which is why the dashboard starts nudging them when that date arrives, or when an application has gone quiet for a week. A nudge offers 'I followed up', which books the next check-in, and a link straight to the application. Statuses carry the story: applied, phone screen, interview, offer, rejected, withdrawn. This is the habit that keeps a job search moving instead of stalling.",
      },
      {
        title: "Resume, career path, learn and profile",
        body:
          "The resume builder seeds a resume from their profile, offers four templates, and lets them edit every section before printing or emailing it to an employer. Career path turns a target job into milestones with dates and the skills each one needs. Learn holds the guides, job boards and workshops we point people to. Profile is the foundation: education, work history, skills, interests and career goals — the more complete it is, the better the job suggestions and career plans get.",
      },
      {
        title: "Kiosk habits — idle sign-out and easy return",
        body:
          "Two kiosk behaviours protect the person who used the computer before. An idle session shows a 'Still there?' prompt and then signs itself out — about eight minutes of inactivity at the kiosk, longer from home — so a participant who walks away doesn't leave their work on screen. And the sign-in email is remembered on that computer (never the password), so a returning participant doesn't retype it. For a guest session, remind them: once they sign out, the work is gone, so print or email anything they want to keep before they finish.",
      },
      {
        title: "Where the activity lands — the client's Job Lab tab",
        body:
          "Back in Pathways, open the client's file and choose the Job Lab tab. This is the whole picture for one person: whether the account is active, how many visits, how many of those were onsite, how many jobs they're tracking, and their resumes and career plans. The numbers come from the same records the participant creates, so nothing needs typing in twice.",
        routePrefix: "/pathways/client/",
        routeFallback: "/pathways/client/demo-pw-sam",
        clickTarget: '[data-tour="pw-tab-joblab"]',
        target: { selector: '[data-tour="jl-activity-stats"]' }
      },
      {
        title: "Reading one client's activity",
        body:
          "Below the tiles, Recent visits lists each sign-in with its date and whether it came from the onsite kiosk or the online portal, and Jobs tracked shows what they saved or applied for with its current status. Resumes built and Career plans sit alongside. Use Refresh when you've been in the portal on another screen. This is the tab to open before an appointment — it tells you where the person actually got to without asking them to remember.",
        routePrefix: "/pathways/client/",
        routeFallback: "/pathways/client/demo-pw-sam",
        target: { selectors: ['[data-tour="jl-activity-visits"]', '[data-tour="jl-activity-jobs"]'] }
      },
      {
        title: "The bigger picture — casual client statistics",
        body:
          "For totals across everyone, use the Casual Client Activity panel on the Reporting dashboard, or Pathways → Reports → Casual Clients. It counts visitors and visits, splits onsite from online, separates people with an account from guests, filters by period or account type, searches by name or email, and exports to CSV. Keep one thing straight: Job Lab visitors are filed as casual clients in Pathways CM and are never pushed to the Central Database automatically. If a visitor becomes a Pathways participant, they come in through intake like anyone else — that's when the file properly begins.",
        path: "/reporting",
        target: { selector: '[data-tour="reports-casual-clients"]' }
      },
      {
        title: "Time to practice",
        body:
          "That's the tour! Next you'll try a few things yourself: find the Job Lab card on a client file, walk through the account fields without submitting, read a client's Job Lab activity, and pull up the casual client numbers. Everything is on demo data — with one exception: the Job Lab account itself is real, so stop before pressing Create."
      }
    ],
    tasks: [
      {
        id: "jl-find-card",
        title: "Find the Job Lab card on a client file",
        body:
          "Open a client from the Master List, go to BIT / ERA, and find the Job Lab Account card. Note whether that client already has an account.",
        hint:
          "Open the Master List, click a demo client, choose the BIT / ERA tab and scroll to the Job Lab Account card. If it shows an 'Active' badge, that client already has one; if it shows the form, they don't.",
        path: "/pathways/master",
        verify: { kind: "self" }
      },
      {
        id: "jl-walkthrough",
        title: "Walk through the account fields (stop before Create)",
        body:
          "On the Job Lab Account card, fill in a name and email and press Generate for a password. Read the fields carefully, then stop — do not press Create Job Lab account during training, because accounts are real.",
        hint:
          "On the card, type the client's name, check the email is theirs, press Generate to see a password appear, then read the note under the button. Leave the card without pressing Create.",
        path: "/pathways/master",
        verify: { kind: "self" }
      },
      {
        id: "jl-activity",
        title: "Read a client's Job Lab activity",
        body:
          "Open the Job Lab tab on a client file and read their visits, jobs tracked, resumes and career plans.",
        hint:
          "Open a client's file and choose the Job Lab tab. Read the tiles at the top, then the Recent visits list — each visit is labelled onsite kiosk or online.",
        path: "/pathways/master",
        verify: { kind: "self" }
      },
      {
        id: "jl-reporting",
        title: "Pull up the casual client numbers",
        body:
          "Open the Reporting dashboard and read the Casual Client Activity panel: total visitors, visits, and the onsite versus online split.",
        hint:
          "Open the Reporting portal and find the Casual Client Activity panel on its dashboard. Try the period and account filters, and notice the Export CSV button.",
        path: "/reporting",
        verify: { kind: "self" }
      },
      {
        id: "jl-board",
        title: "Review the local job board",
        body:
          "Open Pathways → Job Board and review one posting: its closing date, whether it's switched on for the board, and how a participant would apply.",
        hint:
          "In the Pathways menu, open Job Board. Check the 'On board' switch and closing date on a posting, then open it with the pencil to see the details a participant reads.",
        path: "/pathways/job-board",
        verify: { kind: "self" }
      }
    ]
  }
];