// Intro "video" scenes for the Childminding training module. Narration is
// static generated audio in the same narrator voice as the rest of the catalog,
// and it is the clock: each scene stays until its narration ends.
const audio = (id) => `https://media.base44.com/files/public/6a249282cb496579542673b7/${id}_speech.mp3`;

export const CHILDMINDING_INTRO_SCENES = [
  {
    kicker: 'Childminding',
    title: 'Childcare that keeps the door open.',
    body: "Welcome to Childminding, Candora's childcare service. It runs while a parent or guardian is in a program, so a Pathways class, an ELL class or a workshop is never blocked by childcare. The portal records the sessions, the children and the hours.",
    audioUrl: audio('56000837e'),
  },
  {
    kicker: 'Sessions',
    title: 'Set up before the morning starts.',
    body: 'A session is the block of time childcare is offered: a date, a start and end time, a location and a capacity. Sessions are set up ahead of time, usually by the program assistant, so whoever is at the desk only has to sign children in and out of a session that already exists.',
    audioUrl: audio('ecf53ba32'),
  },
  {
    kicker: 'Sign in, sign out',
    title: 'One record per child per visit.',
    body: "Signing a child in is one record: the child's name, the parent or guardian, the date, the check-in time and the program the parent is attending. At pickup you add the check-out time. Hours are calculated and rounded up to the next fifteen minutes, and Pathways children bill at twenty dollars an hour.",
    audioUrl: audio('e01ae61b3'),
  },
  {
    kicker: 'Practice',
    title: "What you'll practice.",
    body: "In this module you will create a session, sign a child in, sign one out, record a Pathways child and check the billing, and export the monthly records. Everything is simulated, so nothing you touch is real.",
    audioUrl: audio('ce799f679'),
  },
];