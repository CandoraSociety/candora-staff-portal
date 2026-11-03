const audio = (id) => `https://media.base44.com/files/public/6a249282cb496579542673b7/${id}_speech.mp3`;

// "What we've learned" recap scenes for the EmpowerU module.
export const EMPOWERU_RECAP_SCENES = {
  empoweru: [
    {
      title: 'A cohort is the class, not the person',
      audioUrl: audio('067d022c4'),
      points: [
        'A cohort holds the dates, delivery mode, location, facilitator and capacity.',
        'Two or three run each year; every registration hangs off one of them.',
        'Capacity is read as enrolled out of capacity, straight from the cohort card.',
        'Status decides whether a cohort shows as active, planning or completed.',
      ],
    },
    {
      title: 'Applications in, seats out',
      audioUrl: audio('c958770df'),
      points: [
        'The cohort registration link takes applications; staff approve or reject them.',
        'Approving creates the participant and their registration together.',
        'The waitlist is contact work — status, last contact and a follow-up date.',
        'The personal registration link copies with the name pre-filled and locked.',
      ],
    },
    {
      title: 'Two habits worth keeping',
      audioUrl: audio('0e495df78'),
      points: [
        'Match against the Central Database before creating a participant.',
        'Advance the account setup the day the step actually happens.',
      ],
    },
  ],
};