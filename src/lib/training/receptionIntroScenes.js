// Intro "video" scenes for the Reception (front desk) training module.
// Scene narration is static generated audio — no browser TTS, no generation
// at playback. The narration is the clock: each scene stays until it ends.
export const RECEPTION_INTRO_SCENES = {
  reception: [
    {
      kicker: 'Reception',
      title: 'Welcome to the front desk.',
      body: "This is the Reception portal, the workspace the front desk runs on. It answers the questions visitors actually arrive with: who am I here to see, where do I go, can you sign me in, and who can help me with this.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/bba2f97e2_speech.mp3',
    },
    {
      kicker: 'What it records',
      title: 'Every visit becomes a record.',
      body: "Everything you record here lands on that client's file in the central client database. A visit recorded once is read by the caseworker, by the next person at the desk, and by our funder reporting, so nobody has to tell the story twice.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/56b13d5c8_speech.mp3',
    },
    {
      kicker: 'Your day',
      title: 'Three moves, all day long.',
      body: 'The day at the desk is really three moves, repeated. Find the person and their appointment, record that they came in or dropped by, and send them to the right place. Everything else in this portal supports one of those three.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/6c0811e8e_speech.mp3',
    },
    {
      kicker: 'Simple mode',
      title: "Turn it down when it's busy.",
      body: 'If the full portal is too much on a busy shift, Simple mode trims your view to four cards and four tabs: Appointments, Drop-Ins, Program Registration and Resource Finder. It only changes your own screen, so a supervisor keeps the full dashboard.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/5893acebd_speech.mp3',
    },
    {
      kicker: 'Safety',
      title: 'Say the important thing out loud.',
      body: 'Two things matter more than speed. Read the safety alerts on a client file before any sensitive conversation, and when something happens at the desk that a manager needs to know about now, send an urgent alert.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/b975635ab_speech.mp3',
    },
    {
      kicker: 'Practice',
      title: "What you'll practice.",
      body: "You'll book and check in a visitor appointment, sign a drop-in in and back out, log a client visit, and register someone for a program. Training runs on demo data, so nothing here is real.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/ac6606252_speech.mp3',
    },
  ],
};