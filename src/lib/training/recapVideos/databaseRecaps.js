const audio = name => `https://media.base44.com/files/public/6a249282cb496579542673b7/${name}_speech.mp3`;
export const DATABASE_RECAP_SCENES = {
  rc: [
    { title: 'One person, one central client file', audioUrl: audio('c12c9affb'), points: [
      'Find the person first: Use Clients to search the central client database by name or phone.',
      'Check duplicate matches: Intake helps you link the existing file before creating another.',
      'Keep the basics current: The file holds contact information, case notes, needs, visits and referrals.',
      'Use the dashboard: Review current activity, pending visits and recent service logs.',
    ] },
    { title: 'Make each interaction useful to the next worker', audioUrl: audio('02f1d87ac'), points: [
      'Read safety alerts first: Check the top of the file before discussing sensitive information.',
      'Write the case note: Record what happened and what another worker needs to understand.',
      'Log the service: Record the support delivered; service logs feed funder reporting.',
      'Keep needs and visits current: Update the existing client file so the history stays together.',
    ] },
    { title: 'Track the next step, not just the visit', audioUrl: audio('76466adae'), points: [
      'Incoming referrals: Record where the client came from and the current referral status.',
      'Outgoing referrals: Keep the receiving agency and the handoff status visible on the file.',
      'Use deeper support when needed: Intensive case management holds service plans, stages, goals and risks.',
      'Return to the same record: Keeping all work together prevents duplicate or disconnected client histories.',
    ] },
  ],
  ell: [
    { title: 'Keep the learner roster accurate', audioUrl: audio('03ed639fc'), points: [
      'Learners: Find each person’s CLB level, enrollment status and assigned class.',
      'Open the learner: Update their progress and relevant language background on the same record.',
      'Dashboard: Check the learner, class and capacity overview before placing someone.',
      'Separate the concepts: A learner is a person; a course is what is taught; a class is the scheduled group.',
    ] },
    { title: 'Run the scheduled class', audioUrl: audio('ec63e9b55'), points: [
      'Courses: Use the curriculum offerings available across terms.',
      'Classes: Confirm the schedule, room and instructor for the group.',
      'Attendance: Open the class to record who actually attended.',
      'Teaching records: Keep lesson plans and class notes with the class they belong to.',
    ] },
    { title: 'Keep waiting and progress visible', audioUrl: audio('042d9b760'), points: [
      'Waitlist: Track who needs a seat and their current contact state.',
      'After contact: Update waiting, contacted or assessment booked and add the relevant note.',
      'Assessments: Record the CLB level before and after, not just a general impression.',
      'Review progress: Compare assessment levels over time and keep the learner record current.',
    ] },
  ],
  centralreg: [
    { title: 'See the shared registration picture', audioUrl: audio('23893c88c'), points: [
      'Dashboard: Check registrations, capacity and outstanding requests across programs.',
      'Programs: Find each program and its scheduled sessions.',
      'Check capacity: Confirm available places before treating a new registration as enrolled.',
      'Calendar: Check what runs on each day and in which room.',
    ] },
    { title: 'Follow the registration status', audioUrl: audio('4f851767b'), points: [
      'Registrations: Review participants who are pending, enrolled or waitlisted.',
      'Approval: Approving can create the participant record in the program’s own portal.',
      'When full: Keep the registration on the waitlist with its numbered position.',
      'Offer seats fairly: Use the position order rather than losing track of who was waiting.',
    ] },
    { title: 'Handle QR self-registration correctly', audioUrl: audio('0d6de7788'), points: [
      'Public entry: Participants reach a program’s registration page from its QR code.',
      'Review requests: Open Self-registration Requests to approve or decline pending submissions.',
      'Check the program setting: Some programs allow registration without registrar approval.',
      'Confirm the outcome: Check the resulting registration status and the relevant program record.',
    ] },
  ],
};