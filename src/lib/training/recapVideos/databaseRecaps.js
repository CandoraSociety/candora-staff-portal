const audio = name => `https://media.base44.com/files/public/6a249282cb496579542673b7/${name}_speech.mp3`;
export const DATABASE_RECAP_SCENES = {
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
  central_database_basics: [
    { title: 'One person, one file', audioUrl: audio('800ad4dbe'), points: [
      'Find the person first: Database searches the name or email, then narrows by program area, status, funder or demographics.',
      'One card per person: the same client in Pathways, ELL and EmpowerU appears once, not three times.',
      'Open the file rather than reading the card: contact details, worker, case status and funder tags are only the summary.',
      'Read the alerts before the conversation: safety alerts sit at the top of the file for a reason.',
    ] },
    { title: 'Read before you write', audioUrl: audio('1f8bcd6ea'), points: [
      'The header carries the facts: contact details, case status, funder tags, last visit and visit count.',
      'Program strips show every portal already involved, and what each one recorded.',
      'Staff notes are for the next worker — what they must know to pick the file up.',
      'A safety alert needs an explanation, because that explanation is what shows in red on the file.',
    ] },
    { title: 'What you write, others rely on', audioUrl: audio('aa6413710'), points: [
      'Add Note and Client Visit both land on this one file; there is no second notebook.',
      'Program portals feed this record: registering someone in Pathways, ELL, EmpowerU, FRN, PHAC, Community or Digital Literacy adds a profile and a strip.',
      'Matching runs on email, then name with date of birth — which is why spelling matters.',
      'Check for an existing file before creating one: one record with the whole history is the point.',
    ] },
  ],
  central_database_advanced: [
    { title: 'Know which portal owns which fact', audioUrl: audio('924180f6b'), points: [
      'Central record: identity and case work — contact details, case status, worker, notes, alerts, needs, visits.',
      'Program portals: their own detail — Pathways plan and barriers, ELL class and CLB, EmpowerU cohort checkpoints.',
      'The sync writes the participation strip only; it never overwrites the case-work fields.',
      'Personal details are set when the record is first created, so the first writer owns them thereafter.',
    ] },
    { title: "Link, don't duplicate", audioUrl: audio('57e847b7d'), points: [
      'Program intakes list the possible central records, with what the person is already in.',
      'A confirmed link makes future syncs update that record instead of searching for one.',
      'Without a link, matching falls back to email, then name and date of birth — a name variant or missing email creates a second file.',
      'Repair at the source: fix the spelling in the portal that got it wrong, and note what you found.',
    ] },
    { title: 'The reporting layer', audioUrl: audio('436fa79b8'), points: [
      'Referrals move both ways, and every one needs its status moved on — a static referral is unfinished work.',
      'Service logs carry type, duration, funder category and follow-up; they are what the funder reports count.',
      'Case Management splits Intensive Services, General Clients and Caregiver Capacity; needs carry priority and status.',
      'Write what a colleague needs and nothing more: every program working with the person reads this file.',
    ] },
  ],
};