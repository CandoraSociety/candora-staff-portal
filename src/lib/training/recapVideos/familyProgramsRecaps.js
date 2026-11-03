const audio = (id) => `https://media.base44.com/files/public/6a249282cb496579542673b7/${id}_speech.mp3`;

// "What we've learned" recap scenes for the FRN and PHAC modules.
export const FAMILY_PROGRAMS_RECAP_SCENES = {
  frn: [
    {
      title: 'One person, one file, one referral',
      audioUrl: audio('a8c4baeb9'),
      points: [
        'A participant holds the person; a referral holds the request into a program.',
        'Match against the Central Database before typing a new participant.',
        'Referrals arrive internal or from a partner organization, with the referrer recorded.',
        'Status is the promise: pending, assessment scheduled, assessed, accepted, enrolled.',
      ],
    },
    {
      title: 'Assessments, notes and referrals onward',
      audioUrl: audio('3dc82c2d8'),
      points: [
        'Assessments record the starting picture and the reviews after it.',
        'Progress notes and goals live on the participant file, not in an email.',
        'Sessions carry the date, room, facilitator and who actually attended.',
        'Refer onward from the file — the receiving portal sees it on their dashboard.',
      ],
    },
    {
      title: 'Two habits worth keeping',
      audioUrl: audio('24f8f1cd2'),
      points: [
        'Check the Central Database first, so one person never becomes two records.',
        'Keep the referral status current — the dashboard is what the next worker reads.',
      ],
    },
  ],
  phac: [
    {
      title: 'Drop-in, not intake',
      audioUrl: audio('fa38d505c'),
      points: [
        'Families register — there is no referral to approve.',
        'Every program states its age range, category, schedule and capacity.',
        'The season runs September to June; July and August pause.',
        'Program documents are attached to the program, not emailed around.',
      ],
    },
    {
      title: 'The family file is the record',
      audioUrl: audio('289c5841c'),
      points: [
        'The file holds child, guardian, emergency contact and registration status.',
        'Attendance history proves engagement, session by session.',
        'Progress notes carry the observation, a rating and the next steps.',
        'Link the Central Database record, or the child appears twice.',
      ],
    },
    {
      title: 'Two habits worth keeping',
      audioUrl: audio('87725b880'),
      points: [
        'Mark attendance on the day, not at the end of the month.',
        'Write the progress note while the session is still fresh.',
      ],
    },
  ],
};