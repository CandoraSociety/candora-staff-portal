// ── Job Lab training module ───────────────────────────────────────────────
// Job Lab belongs to the client, not to staff. It is the main tool for
// light-touch / no-touch clients (drop-ins who self-register at the sign-in
// screen or use a guest session) and it is encouraged for Pathways WD and DEA
// clients as part of their process.
//
// Staff have exactly two parts in it: create an account on the client's
// BIT / ERA tab when someone will come back, and read the activity it records
// on the client's Job Lab tab and in the casual client statistics.
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
      "The client's own job-search portal: who uses it, the one account staff set up at the ERA, and where the activity it records shows up.",
    path: "/pathways/master",
    steps: [
      {
        title: "Welcome to Job Lab training",
        body:
          "Press Play to hear a short introduction. It explains who Job Lab is actually for — the clients, not staff — the difference between a guest session and a registered account, the one thing staff set up at the ERA, and where the activity it records shows up. Each scene stays on screen until its narration finishes. When you're ready, press Next below to continue.",
        introExplainer: true,
        path: "/pathways/master",
        target: { selector: '[data-tour-path="/pathways/master"]' }
      },
      {
        title: "Job Lab belongs to the client",
        body:
          "Job Lab is a separate portal from this staff app, for people looking for work — and it is theirs to use, not ours. Its audience is the light-touch and no-touch client: the drop-in who walks in off the street and needs to job search without opening a full client file. It is also for our Pathways clients in the WD and DEA streams, who we actively encourage to use it between appointments as part of their process. Staff don't job search in it for anyone. Two things are staff work: creating an account when someone will come back, and reading the activity afterwards.",
      },
      {
        title: "Two ways in — guest or account",
        body:
          "A VISITOR can use Job Lab three ways, and every tool works in each of them. A GUEST session needs only a name — search, build a resume, print and email all work, but nothing is kept once they sign out, which suits a one-off drop-in. A REGISTERED ACCOUNT keeps applications, resumes and career plans between visits. A drop-in registers their own account at the sign-in screen; no staff involvement and no Pathways file needed. Staff-created accounts are for clients who already have a Pathways file, so their visits and work land on that client record instead of a new one.",
      },
      {
        title: "Set up an account — the BIT / ERA tab",
        body:
          "Creating an account for a Pathways client happens during the Employment Readiness Assessment — this is the WD and DEA moment, where you tell the client what Job Lab is and set them up before they leave. Open a client from the Master List — Sam Specimen here — and choose BIT / ERA. Below the ERA card is the Job Lab Account card. If the client already has an account, the card shows it as active with their sign-in email and visit count instead of a form. If it shows the form, they don't have one yet.",
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
        title: "What the client sees — the dashboard",
        body:
          "From here on, this is the client's side, not ours. After signing in they land on a dashboard built for someone who may never have used a job-search site: a welcome panel, a short 'how Job Lab works' explainer, and three starting cards — find a job, get a resume ready, plan a next step. When something needs doing, a follow-up nudge appears at the top, and a Finish & sign out button sits at the bottom for kiosk use. The tools are always in the header and phone menu: Find jobs, Applications, My resume, Career path, Learn and Profile.",
      },
      {
        title: "Find jobs — and save what's worth keeping",
        body:
          "Find jobs is where the client's own search starts: it suggests openings based on the skills and work history in their profile, and links straight out to the big job boards for the same search. Anything worth keeping is saved to their tracker in one click, which is the habit to teach a WD or DEA client — search, then save, then apply.",
      },
      {
        title: "Applications and follow-up nudges",
        body:
          "The tracker splits into Saved listings and Applications. When the client actually applies, they mark it applied and the tracker books a follow-up a week out automatically — which is why the dashboard nudges them when that date arrives, or when an application has gone quiet for a week. A nudge offers 'I followed up', which books the next check-in, and a link straight to the application. Statuses carry the story: applied, phone screen, interview, offer, rejected, withdrawn. This is the habit that keeps a job search moving instead of stalling.",
      },
      {
        title: "Resume, career path, learn and profile",
        body:
          "The resume builder seeds a resume from their profile, offers four templates, and lets them edit every section before printing or emailing it to an employer. Career path turns a target job into milestones with dates and the skills each one needs. Learn is the resource library, and it's organised for someone who doesn't know where to start: an Entry Level tab for no-experience clients, a By Industry tab with retail, food service, healthcare, trades, warehouse and driving, office, childcare, cleaning, security and agriculture — each with the free training, the certificates that sector actually asks for, and current openings — plus free certificates, videos, job search, resume and interview guides. Profile is the foundation: education, work history, skills, interests and career goals — the more complete it is, the better the job suggestions and career plans get.",
      },
      {
        title: "Kiosk habits — idle sign-out and easy return",
        body:
          "Two kiosk behaviours protect the person who used the computer before. An idle session shows a 'Still there?' prompt and then signs itself out — about eight minutes of inactivity at the kiosk, longer from home — so a client who walks away doesn't leave their work on screen. And the sign-in email is remembered on that computer (never the password), so a returning client doesn't retype it. For a guest session, remind them: once they sign out, the work is gone, so print or email anything they want to keep before they finish.",
      },
      {
        title: "Where the activity lands — the client's Job Lab tab",
        body:
          "Back in Pathways, open the client's file and choose the Job Lab tab. This is the whole picture for one person: whether the account is active, how many visits, how many of those were onsite, how many jobs they're tracking, and their resumes and career plans. The numbers come from the same records the client creates in the portal, so nothing needs typing in twice.",
        routePrefix: "/pathways/client/",
        routeFallback: "/pathways/client/demo-pw-sam",
        clickTarget: '[data-tour="pw-tab-joblab"]',
        target: { selector: '[data-tour="jl-activity-stats"]' }
      },
      {
        title: "Reading one client's activity",
        body:
          "Below the tiles, Recent visits lists each sign-in with its date and whether it came from the onsite kiosk or the online portal, and Jobs tracked shows what they saved or applied for with its current status. Resumes built and Career plans sit alongside. Use Refresh when you've been in the portal on another screen. This is the tab to open before an appointment — it tells you where the client actually got to without asking them to remember.",
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
          "That's the tour! Next you'll try a few things yourself: find the Job Lab card on a client file, walk through the account fields without submitting, read a client's Job Lab activity, pull up the casual client numbers, and see where Job Lab sits for a WD or DEA client. Everything is on demo data — with one exception: the Job Lab account itself is real, so stop before pressing Create."
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
        id: "jl-program-fit",
        title: "See where Job Lab fits for a WD or DEA client",
        body:
          "Open a client in the WD or DEA stream and find where Job Lab sits in their process — it's part of the work they do between appointments, not something staff do for them.",
        hint:
          "Open a demo client from the Master List and look at their Program Flow and BIT / ERA tabs. Job Lab is the tool you encourage between appointments; the account card on BIT / ERA is where you set them up before they leave.",
        path: "/pathways/master",
        verify: { kind: "self" }
      }
    ]
  }
];