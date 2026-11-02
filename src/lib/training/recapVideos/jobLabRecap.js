// "What we've learned" wrap-up for the Job Lab module — narrated recap plus a
// short quiz. Kept in its own file so the big MODULE_RECAPS map stays easy to
// scan.
export const JOBLAB_RECAP = {
  kicker: "What we've learned",
  title: 'One portal, two kinds of visitor, one client record.',
  body: "Let's bring it together. Job Lab is a portal for job seekers, kept apart from the staff app so nobody's client information is exposed. Today staff open it from the Job Lab computers; the plan is for Job Lab to be the main screen on every one of those computers, and that is not switched on yet. There are two ways in. A guest needs only a name and can use every tool during the visit, but nothing is kept once they sign out. A registered account, which staff create on the client's BIT and ERA tab in Pathways, keeps everything — applications, resumes, career plans — and every visit is recorded against that client file. Inside the portal a participant can search jobs, browse the local job board, track applications and follow-ups, build a resume, plan a career path, and work through the learning resources. Staff see what happened in two places: the Job Lab tab on the client's file, and the casual client statistics on the Reporting dashboard and in Pathways reports. So when someone asks whether Job Lab is being used, the answer is in the numbers — and when a participant comes back, the record shows exactly where they left off.",
  audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/490e4f537_speech.mp3',
  takeaways: [
    "Job Lab is a separate portal for job seekers — participants never see the staff app or client information.",
    "It is not yet the main screen on the Job Lab computers; staff still open it from the Job Lab computers today.",
    "Staff create accounts on the client's BIT / ERA tab in Pathways, which ties the account to that client file.",
    "A guest can use every tool during a visit but nothing is saved after sign-out; a registered account keeps applications, resumes, career plans and visits.",
    "Activity shows up on the client's Job Lab tab and in the casual client statistics on the Reporting dashboard and in Pathways reports.",
  ],
  quiz: [
    {
      question: "Where do staff create a Job Lab account for someone?",
      options: [
        "On the Job Lab sign-in screen itself",
        "On the client's BIT / ERA tab in Pathways, under the Job Lab Account card",
        "In the Central Database client record",
        "In the Reporting dashboard",
      ],
      answer: 1,
      explain: "The account is created from the client's Employment Readiness Assessment section, so it is tied to that client file from the start.",
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
      question: "A client's account was created from their ERA. Where does their next visit land?",
      options: [
        "On a new casual client record",
        "On that existing client file, as a Job Lab visit",
        "In the Central Database only",
        "Nowhere until staff type it in",
      ],
      answer: 1,
      explain: "The account carries the client's id, so visits are filed against the existing client — no duplicate casual client is created.",
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
    {
      question: "Someone walks away from a Job Lab computer while signed in. What happens?",
      options: [
        "Nothing until staff close the browser",
        "A 'Still there?' prompt appears and the session signs out on its own",
        "The account is deleted",
        "Their work is emailed to staff",
      ],
      answer: 1,
      explain: "An idle session shows a one-minute prompt and then signs out, so the next person cannot see someone else's work.",
    },
  ],
};