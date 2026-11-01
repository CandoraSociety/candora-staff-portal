const audio = (name) => `https://media.base44.com/files/public/6a249282cb496579542673b7/${name}_speech.mp3`;

// "What we've learned" recap scenes for the Reception (front desk) module.
export const RECEPTION_RECAP_SCENES = {
  reception: [
    {
      title: 'Every visit starts with the person',
      audioUrl: audio('905251bda'),
      points: [
        'Find the file first: search the central client database by name or phone before you type a new one.',
        'Book ahead: visitor appointments carry the name, time and the staff member they are coming to see.',
        'Sign walk-ins in: a drop-in records that they arrived, who they are here for and when they left.',
        'Everything lands on the client file, so the next worker reads one history instead of two.',
      ],
    },
    {
      title: 'Record each visit as it happens',
      audioUrl: audio('42ffa6a8d'),
      points: [
        'Check in and out: mark scheduled visitors on arrival and check drop-ins out when they leave.',
        'Use Client Visit: grab-and-go resources, drop-in casework or a scheduled casework visit.',
        'Pick the service category: those records are what the caseworkers and funder reporting read.',
        'Register on the spot: any Candora program, with waitlists handled the same way.',
      ],
    },
    {
      title: 'Look after the front desk itself',
      audioUrl: audio('b53caf43b'),
      points: [
        'Staff Directory: click-to-call answers who this person needs to see.',
        'Resource Finder: describe the situation in plain words to find outside supports.',
        'Urgent alerts: email the right managers and staff immediately.',
        'Simple mode: three cards and three tabs — Appointments, Drop-Ins, Program Registration.',
      ],
    },
  ],
};