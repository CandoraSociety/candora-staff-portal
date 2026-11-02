// "What we've learned" wrap-up for the Job Lab module — narrated recap plus a
// short quiz. Job Lab is the client's tool, not a staff tool: staff create an
// account at the ERA and read the activity afterwards.
export const JOBLAB_RECAP = {
  kicker: "What we've learned",
  title: 'Their portal, our record.',
  body: "Let's bring it together. Job Lab is the client's own employment space, kept apart from the staff app so nothing on our side is exposed. It serves two groups: light-touch and no-touch clients, who drop in and register themselves or use a guest session, and Pathways clients in the workforce development and direct-to-employment streams, who we encourage to use it as part of their process. Staff have one job inside it, and only for clients who will come back: create the account on the client's BIT and ERA tab, which files everything against that client record. In the portal a client can search jobs and save them, track applications with follow-up nudges, build and print a resume, plan a career path, and use the free training in the Learn tab. A guest can do all of that too, but nothing is kept after sign-out. Activity shows up on the client's Job Lab tab and in the casual client statistics, so when someone asks whether Job Lab is being used, the answer is in the numbers.",
  audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/f3a8eed45_speech.mp3',
  takeaways: [
    "Job Lab belongs to the client: they search, apply, build and plan in it themselves, and never see our staff app or client information.",
    "It is the main tool for light-touch and no-touch clients, and we encourage Pathways WD and DEA clients to use it between appointments.",
    "Drop-ins register themselves at the sign-in screen or use a guest session; staff never need to set them up.",
    "Staff create an account only for a client who will come back, on the client's BIT / ERA tab, which ties it to that client file.",
    "A guest keeps nothing after sign-out; an account keeps applications, resumes, career plans and visits.",
    "Activity shows up on the client's Job Lab tab and in the casual client statistics in Reporting and Pathways reports.",
  ],
  quiz: [
    {
      question: "Who is Job Lab for?",
      options: [
        "Staff, so they can search on a client's behalf",
        "Clients and drop-ins, who use it themselves",
        "Employers posting openings",
        "The Central Database team only",
      ],
      answer: 1,
      explain: "Job Lab is the client's own space. Staff set up accounts and read the activity, but never job search in it for someone.",
    },
    {
      question: "Where do staff create a Job Lab account for someone?",
      options: [
        "On the Job Lab sign-in screen itself",
        "On the client's BIT / ERA tab in Pathways, under the Job Lab Account card",
        "In the Central Database client record",
        "In the Reporting dashboard",
      ],
      answer: 1,
      explain: "The account is created from the Employment Readiness Assessment section, so it is tied to that client file from the start.",
    },
    {
      question: "A drop-in client with no Pathways file wants to come back and keep their work. What do they do?",
      options: [
        "Staff create them a Pathways client file first",
        "They register their own account at the sign-in screen",
        "They can't keep their work without an ERA",
        "They email us their resume to hold",
      ],
      answer: 1,
      explain: "Drop-ins register themselves at the sign-in screen. No staff setup is needed, and no Pathways file is required.",
    },
    {
      question: "What is the difference between a guest session and a registered account?",
      options: [
        "Guests can only look at the page; accounts unlock every tool",
        "Guests can use every tool during the visit but nothing is saved after sign-out",
        "Guests are saved to the Central Database, accounts are not",
        "There is no difference once they sign in",
      ],
      answer: 1,
      explain: "A guest can search, build and print during the visit, but their work is gone when they sign out. An account keeps it.",
    },
    {
      question: "Where can staff see how much Job Lab is being used?",
      options: [
        "Only by asking the person at the front desk",
        "The client's Job Lab tab, plus the casual client statistics in Reporting and Pathways reports",
        "In the Finance portal",
        "In each participant's email inbox",
      ],
      answer: 1,
      explain: "Per-client activity sits on the Job Lab tab; the overall numbers are the casual client statistics.",
    },
  ],
};