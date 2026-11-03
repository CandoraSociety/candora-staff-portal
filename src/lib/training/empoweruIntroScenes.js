// Intro "video" scenes for the EmpowerU training module. Narration is static
// generated audio in the same narrator voice as the rest of the catalog, and it
// is the clock: each scene stays until its narration ends.
const audio = (id) => `https://media.base44.com/files/public/6a249282cb496579542673b7/${id}_speech.mp3`;

export const EMPOWERU_INTRO_SCENES = [
  {
    kicker: 'EmpowerU',
    title: 'Money skills, ten weeks at a time.',
    body: "Welcome to EmpowerU, Candora's ten-week financial literacy program, run in partnership with United Way and funded by ATB. The portal follows a cohort from the first application through to the savings account each participant opens at the end.",
    audioUrl: audio('336569c34'),
  },
  {
    kicker: 'Cohorts',
    title: 'The class, its dates and its seats.',
    body: 'Cohorts are the classes themselves: start and end dates, delivery mode, location, facilitator and capacity. Two or three run each year, so the portal keeps them separate. Registrations hang off a cohort, which is why a seat is never counted without one.',
    audioUrl: audio('a9209d6c1'),
  },
  {
    kicker: 'People',
    title: 'Application, seat, account.',
    body: 'People arrive by application link or referral and land on a registration: registered, waitlisted, enrolled. The waitlist tracks who was contacted and when, and Account Setup follows each enrolled participant through to their ATB savings account being opened.',
    audioUrl: audio('f2c36b498'),
  },
  {
    kicker: 'Practice',
    title: "What you'll practice.",
    body: "In this module you will create a cohort, register a participant into it, work a waitlist entry, advance an account setup and upload a participant document. Everything is simulated, so nothing you touch is real.",
    audioUrl: audio('8d2512eb5'),
  },
];