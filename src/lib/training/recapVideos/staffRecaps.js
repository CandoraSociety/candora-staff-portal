// The on-screen points are also the exact script of each stored narration.
const audio = name => `https://media.base44.com/files/public/6a249282cb496579542673b7/${name}_speech.mp3`;
export const STAFF_RECAP_SCENES = {
  welcome: [
    { title: 'One app, many workspaces', audioUrl: audio('99abaa5ce'), points: [
      'One app, many workspaces: client programs, registration, operations, people and money, oversight and the file vault all live inside the same staff portal.',
      'Your access decides your list: you only see the portals your role opens, so your list can differ from a colleague’s.',
      'One person, one record: every program that registers someone links to the same file in the central client database.',
      'Work moves between portals: referrals arrive on another program’s dashboard, files land in one vault, and approved timesheets flow on to Finance.',
    ] },
    { title: 'Three things worth remembering', audioUrl: audio('3ffdd4b3c'), points: [
      'Start at your main page: announcements, alerts and the portals you use most live there.',
      'Open a workspace: use the Portals list or the plus button on the tab bar.',
      'Keep only what helps: shortcut cards and widgets are yours to choose in Add functions.',
      'Ask when unsure: the How-To knowledge base answers plain-language questions on your main page.',
    ] },
    { title: 'Learn it as you need it', audioUrl: audio('755bcac54'), points: [
      'You are not expected to memorise this: today was about recognising the parts of the screen.',
      'Most people use two or three portals: never opening the rest is normal.',
      'Training waits for you: every module saves its own progress, so start and pause as needed.',
      'Come back whenever you like: this is the first module in the catalog.',
    ] },
  ],
  dashboard: [
    { title: 'Find your workspace', audioUrl: audio('8fbf03d4e'), points: [
      'Open a portal: Use Portals or the plus button to find the tools available to your account.',
      'Keep your place: Switch between portal tabs without losing the page you were working on.',
      'Make shortcuts: Choose favourite portals in Add Functions and pin your most-used portal.',
      'Check your alerts: Look on the Main Page for approvals, requests and payment updates.',
    ] },
    { title: 'Files and everyday tools', audioUrl: audio('0ecaf32dd'), points: [
      'Choose your widgets: Turn optional panels on or off in Add Functions; changes save straight away.',
      'Put files away: In Quick Files, choose a display name, category, access level and useful keywords.',
      'Find files again: Search by name, description or keyword; results respect your file access.',
      'Use the full vault: Open File Manager when you need folders, bulk uploads or sharing.',
    ] },
    { title: 'Know what stays real', audioUrl: audio('127527650'), points: [
      'Practice safely: Training Mode uses simulated records rather than real client or staff data.',
      'Protect your signature: Your e-signature and PIN are real and stay on your account after training.',
      'Save an active signature: Create it, save it and check the Active badge before signing documents.',
      'Connect Microsoft: Complete the separate Outlook and Teams sign-ins to use inbox, calendar and chats.',
    ] },
  ],
  dashboard_widgets: [
    { title: 'Choose what belongs on your page', audioUrl: audio('92df0d77a'), points: [
      'Open Add Functions: Use Customize on your Main Page to see the available widget cards.',
      'Switch a panel: Click its card to turn it on or off; the change saves immediately.',
      'Recognize locked panels: Announcements, Recent Activity and Upcoming Events stay on for everyone.',
      'Choose shortcuts too: Portal shortcuts and Microsoft apps are selected on the same page.',
    ] },
    { title: 'Separate your own planning from assigned work', audioUrl: audio('ee311ca7d'), points: [
      'Personal Organizer: Set a daily focus, priorities and to-dos in your private planning space.',
      'Keep planning with you: Your organizer follows your account across devices.',
      'My Tasks: Find Compass tasks and other work assigned to you across the portal.',
      'My Reminders: Track the deadlines you set yourself, not the work assigned by someone else.',
    ] },
    { title: 'Use the right tool for the question', audioUrl: audio('2118f9296'), points: [
      'How-To Assistant: Ask for step-by-step portal help; Candora knowledge is checked before AI.',
      'Quick Notes: Keep recent notes within reach on your Main Page.',
      'Birthdays and Recent Clients: See upcoming celebrations or return to files you recently used.',
      'Role-specific tools: Choose project tracking, time logging, meetings, statistics or translation when useful.',
    ] },
  ],
  staffadmin: [
    { title: 'Record the right kind of time off', audioUrl: audio('c643fe5dc'), points: [
      'Vacation requests: Choose the dates and hours per day, check the supervisor and submit.',
      'Track the decision: My Requests shows pending, approved or declined; your dashboard shows updates.',
      'Sick or personal days: Choose the type and dates, then Record; these entries need no approval.',
      'Plan for coverage: Check approved absences in Team Schedule before requesting time away.',
    ] },
    { title: 'Build one accurate timesheet', audioUrl: audio('12b2908c7'), points: [
      'Check the pay period: Confirm the period and supervisor taken from your employee file.',
      'Enter regular hours: Add start time, end time and breaks; review the calculated paid hours.',
      'Keep leave automatic: Recorded or approved leave fills the leave columns; do not enter it twice.',
      'Separate extra work: Put additional shifts or evening hours in the Additional Hours table.',
    ] },
    { title: 'Submit and follow through', audioUrl: audio('d12d6964c'), points: [
      'Review the totals: Check regular hours, additional hours and leave before submitting.',
      'Submit Timesheet: Send the period to your supervisor and find it under My Submissions.',
      'Watch the deadline: Submissions through the Wednesday after a period ends still count for that period.',
      'Check the outcome: Dashboard notifications report approvals; Finance uses approved timesheets for payroll.',
    ] },
  ],
  staffadmin_money: [
    { title: 'Build a complete receipt entry', audioUrl: audio('0cfd838a0'), points: [
      'Start a new entry: Press Add Receipt Entry, then attach the receipt with the paperclip.',
      'Check the autofill: Compare the date, supplier and total against the actual receipt.',
      'Correct it yourself: Type missing or incorrect values; a failed read does not mean starting over.',
      'Choose the Program: Select the funding program, or Other and its name when no option fits.',
    ] },
    { title: 'Claim only the correct amount', audioUrl: audio('b4e172d60'), points: [
      'Answer Food: Choose Yes or No based on the items bought, not the name of the store.',
      'Enter the full total: Use the amount actually paid, including GST.',
      'Check GST: Non-food GST calculates automatically; for food, enter the receipt GST, including zero.',
      'Exclude personal items: Use the scissors, a description and the personal price before GST.',
    ] },
    { title: 'Save, sign and submit the right batch', audioUrl: audio('770d62ca4'), points: [
      'Save each entry: Use the check mark; entries wait in Not Submitted until you submit together.',
      'Reimbursements: Check the payee and e-transfer email, then sign using your signature code.',
      'Follow the approval: Reimbursements go to the supervisor, then Finance; track the submission status.',
      'MasterCard receipts: Submit the organization-card receipts as a signed monthly batch, not money owed to you.',
    ] },
  ],
  staffadmin_supervisor: [
    { title: 'Start from the dashboard alerts', audioUrl: audio('a39982412'), points: [
      'Find pending work: Requests from direct reports appear as banners on your Main Page.',
      'Open the details: Check the staff member, dates, hours or receipt entries before deciding.',
      'Check coverage: Compare a time-off request with approved absences in Team Schedule.',
      'Explain a rejection: Give a short reason when a request or timesheet needs correction.',
    ] },
    { title: 'Know what your approval changes', audioUrl: audio('736983afb'), points: [
      'Time off: Approval books the days and fills the staff member’s Paid Leave automatically.',
      'Timesheets: Review the totalled hours and sign off the pay period with your e-signature.',
      'Expenses: Compare entries with receipts before approving the submission with your e-signature.',
      'Do not confuse approval with payment: Approved expenses still need Finance to process them.',
    ] },
    { title: 'Complete the handoff', audioUrl: audio('2dfe888fb'), points: [
      'Keep payroll moving: Finance relies on approved timesheets to run payroll.',
      'Avoid duplicate entry: Approved leave flows into payroll records without typing it again.',
      'Let Finance take over: Approved reimbursements move on for processing and e-transfer.',
      'Staff see the result: Your decision generates a dashboard notification; cleared requests leave your queue.',
    ] },
  ],
};