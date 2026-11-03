// Intro "video" scenes for the FRN and PHAC training modules.
// Scene narration is static generated audio in the same narrator voice as the
// rest of the catalog — no browser TTS, no generation at playback. The
// narration is the clock: each scene stays until it ends.
const audio = (id) => `https://media.base44.com/files/public/6a249282cb496579542673b7/${id}_speech.mp3`;

export const FRN_PHAC_INTRO_SCENES = {
  frn: [
    {
      kicker: 'FRN Programs',
      title: 'Targeted work for families.',
      body: "Welcome to the Family Resource Network, the FRN portal. This is where Candora runs its targeted family programs, like Connect Parent Group, Nobody's Perfect and Wellness Compass, from the first referral through to attendance at every session.",
      audioUrl: audio('d8e586388'),
    },
    {
      kicker: 'Intake',
      title: 'A referral is a request.',
      body: 'Everything starts with a referral. A participant record holds the person, and a referral holds the request: the program, the source, the referral date and a status that moves from pending through assessment to enrolled. Nothing moves forward on memory alone.',
      audioUrl: audio('612cb1cd9'),
    },
    {
      kicker: 'Programs & sessions',
      title: 'The group and its dates.',
      body: 'Programs are the groups themselves, and sessions are the dates they meet. A program keeps its coordinator, capacity, schedule and its documents. Each session keeps the room, the facilitator and who actually attended, so attendance is a record rather than a guess.',
      audioUrl: audio('e00f46c8a'),
    },
    {
      kicker: 'Practice',
      title: "What you'll practice.",
      body: 'In this module you will add a demo participant, log a referral, move it through to enrolled, schedule a session and mark attendance. Everything here is simulated, so nothing you touch is real.',
      audioUrl: audio('b534d3760'),
    },
  ],
  phac: [
    {
      kicker: 'PHAC Programs',
      title: 'Drop-in, birth to six.',
      body: "Welcome to PHAC, Candora's drop-in family programs for children from birth to six. Parents and caregivers bring their children along; there is no referral to work through and no enrollment to approve. What the portal tracks is the program, the session and the family.",
      audioUrl: audio('f09e39044'),
    },
    {
      kicker: 'Programs',
      title: 'What a family can walk into.',
      body: 'A program holds what a family needs to know: category, age range, schedule days, times, room, capacity and eligibility, plus the documents and handouts facilitators give out. Programs run September to June and pause for July and August.',
      audioUrl: audio('d509c99b6'),
    },
    {
      kicker: 'Sessions',
      title: 'The record of a Tuesday.',
      body: 'Sessions are the actual dates. Set the date, time and room, repeat it weekly, biweekly or monthly, then mark attendance for the families who came and record the headcount. Over a season that becomes your attendance picture for funders.',
      audioUrl: audio('949dda78c'),
    },
    {
      kicker: 'Practice',
      title: "What you'll practice.",
      body: 'Progress notes are the part that matters most in PHAC: what you observed about a child and a caregiver, and what happens next. In this module you will add a family, create a program, schedule a session, and record attendance and a note.',
      audioUrl: audio('96e979f18'),
    },
  ],
};