// Intro "video" scenes for the two Central Database training modules.
// Scene narration is static generated audio — no browser TTS, no generation
// at playback. The narration is the clock: each scene stays until it ends.
export const CENTRAL_DATABASE_INTRO_SCENES = {
  central_database_basics: [
    {
      kicker: 'Central Database',
      title: 'One person, one file.',
      body: "Welcome to the Candora Central Database. This is the one place where every person we serve has a single file, no matter how many programs they walk through.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/a2cc0eaa8_speech.mp3',
    },
    {
      kicker: 'What it holds',
      title: 'The person, not the program.',
      body: 'The program portals keep the detail of their own work. This portal keeps the person: contact details, case work, notes, safety alerts, visits, needs and referrals.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/412af5332_speech.mp3',
    },
    {
      kicker: 'How it connects',
      title: 'One record, many programs.',
      body: 'Every program that knows this person adds its own strip to their file, so you can see everything Candora is already doing for someone at a glance.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/1d12fa8be_speech.mp3',
    },
    {
      kicker: 'Practice',
      title: "What you'll practice.",
      body: "In this module you'll find a client file, read it safely, add a note, and record a visit. Nothing you touch here is real data.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/0ee6c5304_speech.mp3',
    },
  ],
  central_database_advanced: [
    {
      kicker: 'Central Database · Advanced',
      title: 'Stewarding the record.',
      body: "Welcome back to the central database. This advanced module is about stewardship: keeping the person linked to the right programs, and keeping the service history trustworthy.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/c5815e9b1_speech.mp3',
    },
    {
      kicker: 'Ownership',
      title: 'Who owns which fact.',
      body: 'The central record owns identity and case work. Each program portal owns its own program detail. The sync writes the participation strip, and leaves the case work alone.',
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/fc7a988a8_speech.mp3',
    },
    {
      kicker: 'Linking',
      title: 'Links prevent duplicates.',
      body: "Links are everything. A confirmed link means that program's next sync updates this file instead of searching for a match, which is exactly how duplicate records get created.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/f7805649d_speech.mp3',
    },
    {
      kicker: 'Practice',
      title: "What you'll practice.",
      body: "In this module you'll read participation strips, work a referral, log a service with its funder category, and record a need or barrier.",
      audioUrl: 'https://media.base44.com/files/public/6a249282cb496579542673b7/52b8c1427_speech.mp3',
    },
  ],
};