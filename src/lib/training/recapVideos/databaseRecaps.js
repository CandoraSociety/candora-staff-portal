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
  filemanager: [
    { title: 'Most of it you will never need', audioUrl: audio('fa8603833'), points: [
      'One vault, many doors: the dashboard Quick Files widget, portal upload cards, receipts and signed documents all file here.',
      'The dashboard: file, note and collection counts, recent files, categories in use, and anything waiting to be sorted.',
      'All Files: everything your permissions reach, with each portal’s files in their own sub-folder.',
      'If a file is missing: check the access filter first — you only see what you are allowed to open.',
    ] },
    { title: 'Upload once, file it properly', audioUrl: audio('8183ef37d'), points: [
      'Display name and category: how the file is found, and how it is filed.',
      'Keywords: they are what the Quick Files search and the vault search match on later.',
      'Access level: personal, universal, manager, finance or corporate — the least open level that still does the job.',
      'My Files: your own space, filtered from the same list; nobody else can open what is in it.',
    ] },
    { title: 'The tools beyond storing', audioUrl: audio('61257a70b'), points: [
      'Bulk Import: a whole stack at once, filed as you go or sorted afterwards.',
      'Collections: a package of files handed over as one set, like a grant application with its attachments.',
      'My Workspace and Notes: the working surface, and the context kept with the document.',
      'Practice: upload a file, find it with search and filters, then try a bulk import.',
    ] },
  ],
  filemanager_advanced: [
    { title: 'Finding it, and clearing the queue', audioUrl: audio('95c7f7331'), points: [
      'Search page: matches display name, original name, description, summary and keywords, then narrows by category and access level.',
      'It only ever returns files you are allowed to open — a short list usually means permissions, not a missing file.',
      'The amber banner is the sorting queue: one file at a time, pick a category, save, and it moves to the next.',
      'A tidy queue keeps the category filters and the dashboard breakdown worth trusting.',
    ] },
    { title: 'Collections and your workspace', audioUrl: audio('215510ec7'), points: [
      'A collection groups existing files for one purpose: a grant package, an audit, a board package.',
      'Files are not copied or moved, and deleting a collection never deletes the files inside it.',
      'My Workspace groups the files of one piece of work and pins them from the vault without moving them.',
      'The workspace is private to you — nobody else works from your groups.',
    ] },
    { title: 'Editor, notes and permissions', audioUrl: audio('c6e438917'), points: [
      'The editor annotates a PDF or image — draw, highlight, text, signature — and saves it as a new file; the original stays untouched.',
      'Notes keep the context with the work and stay searchable; the floating note button follows you.',
      'A shared link never bypasses permissions, and editing details is how a misfiled file gets its category fixed.',
      'Portal tabs mirror your access, and folders are created and secured in Users and Access.',
    ] },
  ],
};