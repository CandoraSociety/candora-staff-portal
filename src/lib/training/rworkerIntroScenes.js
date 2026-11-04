// Intro "video" scenes for the Resource Worker training module. Narration is
// static generated audio in the same narrator voice as the rest of the catalog,
// and it is the clock: each scene stays until its narration ends.
const audio = (id) => `https://media.base44.com/files/public/6a249282cb496579542673b7/${id}_speech.mp3`;

export const RWORKER_INTRO_SCENES = [
  {
    kicker: 'Resource Worker',
    title: 'The short route through the Central Database.',
    body: "Welcome to the Resource Worker portal. It is a smaller, focused door into Candora's central client database, built for the case work a resource worker does: opening a file, logging a visit, scheduling the next conversation and making a referral. Everything saved here is written to the same client record the whole organization sees, so nothing has to be entered twice.",
    audioUrl: audio('568dc9518'),
  },
  {
    kicker: 'Case Management',
    title: 'Your list, not the whole database.',
    body: "Case Management opens on My Clients, the files assigned to you, then the same three categories the central database uses: intensive services, general clients, and caregiver capacity for children under six. Search by name, phone or email and open a row. The list is a shortlist to work from, not a report to file.",
    audioUrl: audio('92603c00e'),
  },
  {
    kicker: 'Using a file',
    title: 'One file, the whole story.',
    body: "Opening a client shows who they are, their status, their worker, their last visit, and the notes the next person must know, with service history, appointments and referrals underneath. Edit Client changes the shared record itself, so your correction shows in the central database straight away. Log Visit, Schedule Appointment and Referral all write back to that same file.",
    audioUrl: audio('93122bd15'),
  },
  {
    kicker: 'Practice',
    title: "What you'll practice.",
    body: "In this module you will open a client file, log a service, schedule an appointment, and run a drop-in visit. Everything is simulated, so nothing you touch is real.",
    audioUrl: audio('ee4a5b79c'),
  },
];