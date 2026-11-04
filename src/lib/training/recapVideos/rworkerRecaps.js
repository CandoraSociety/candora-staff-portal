const audio = (id) => `https://media.base44.com/files/public/6a249282cb496579542673b7/${id}_speech.mp3`;

// "What we've learned" recap scenes for the Resource Worker module.
export const RWORKER_RECAP_SCENES = {
  rworker: [
    {
      title: 'A smaller door, the same record',
      audioUrl: audio('f808ee8b6'),
      points: [
        'The Resource Worker portal edits the same client records as the Central Database, never a copy.',
        'Case Management opens on My Clients: the open files assigned to you.',
        'Intensive services, general clients and caregiver capacity sit beside it as tabs.',
        'The dashboard cards lead with case management and client visit, then the counts waiting on you.',
      ],
    },
    {
      title: 'Working a file',
      audioUrl: audio('f6549b32d'),
      points: [
        'Edit Client saves straight to the shared record, so the change shows everywhere.',
        'Log Visit / Service is what the service history, supervisors and funders read.',
        'Schedule Appointment books the next conversation against the same file.',
        'Referral sends the need to a program or an outside organization, and stays on the file.',
        'Client Visit runs the drop-in and scheduled flow without the front desk extras.',
      ],
    },
    {
      title: 'Two habits worth keeping',
      audioUrl: audio('cdb1f3556'),
      points: [
        'Search before you create — a second file splits a client\'s history in two.',
        'Log the visit the day it happens, while the detail is still accurate.',
      ],
    },
  ],
};