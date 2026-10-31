const audio = name => `https://media.base44.com/files/public/6a249282cb496579542673b7/${name}_speech.mp3`;
export const PATHWAYS_RECAP_SCENES = {
  pathways: [
    { title: 'Know which client list you are seeing', audioUrl: audio('990c0c17e'), points: [
      'Home: Review your assigned clients, upcoming milestones and work needing attention.',
      'My Clients: This is your own caseload, based on the email assigned to each file.',
      'Use the sections: Expand DEA, WD, Casual or Rejected and the placement sub-tabs you need.',
      'Master List: Search and filter every Pathways client, not just those assigned to you.',
    ] },
    { title: 'Use the dashboard tabs deliberately', audioUrl: audio('9b2c272b2'), points: [
      'My Clients: Open the files you are currently responsible for.',
      'Compass Queue: Find funder-entry tasks waiting for you; finish the related entry before marking done.',
      'Purchase Requests: Track requests for client spending and the approvals they need.',
      'Monthly Narrative Report: Build the monthly account of your work from its reporting tab.',
    ] },
    { title: 'Connect intake to the wider journey', audioUrl: audio('d031b7d7d'), points: [
      'Start at Intake: Check duplicate matches and link the existing central client database file when appropriate.',
      'Open the full file: Use Program Flow, Client Overview, Employment, Referrals and BIT / ERA.',
      'Keep the handoffs visible: Use employer, placement and purchase records for the work they represent.',
      'Learn the detailed journey: The Client Journey modules cover assessment, plans, placements and follow-up.',
    ] },
  ],
  pathways_journey: [
    { title: 'Begin with one reliable intake', audioUrl: audio('0aff06911'), points: [
      'Two entry routes: Clients can self-register at the Job Lab, or staff can enter a Compass referral.',
      'Check the match: Link an existing central client database record instead of creating a duplicate.',
      'Capture the whole picture: Contact, eligibility, language, education, work history and goals guide the next steps.',
      'Keep observations: Job Lab support needs and referral information travel with the client file.',
    ] },
    { title: 'Assess first, then assign', audioUrl: audio('7d5825a23'), points: [
      'Verify the client: Open Assess from Awaiting Assessment and check the intake information first.',
      'Complete the BIT: Record barriers, their challenges, action steps and review needs.',
      'Confirm the ERA: It is completed in Compass; the portal keeps the confirmation and completed form.',
      'Make the handoff: Complete the assessment, then use Determination/Assignment for WD, DEA or not eligible.',
    ] },
    { title: 'Turn assessment into an action plan', audioUrl: audio('155115bbc'), points: [
      'Assign the workers: Choose the career counsellor and a Service Navigator when appropriate.',
      'Use Program Flow: The counsellor creates the Employment Action Plan from the intake and assessment.',
      'Make the plan specific: Choose suitable activities, anticipated-completion dates and supporting notes.',
      'Save in both systems: Saving unlocks the remaining flow and queues Compass work; record the plan in Compass too.',
    ] },
  ],
  pathways_journey_part2: [
    { title: 'Different routes, one client record', audioUrl: audio('a2b2eaa23'), points: [
      'DEA: Short Employment Development Activities support a client who is already job-ready.',
      'WD with an internal placement: Build experience inside Candora before moving toward an employer.',
      'WD with work exposure: Coordinate the external employer, supports, courses and purchase requests.',
      'Match the client: These are sample routes, not a single plan that fits every person.',
    ] },
    { title: 'Keep progress and status distinct', audioUrl: audio('7b7f6745c'), points: [
      'Program Progress: See plan items, barriers and placements together on the dated timeline.',
      'Update each activity: Open its bar to change status, dates and notes as the work happens.',
      'Program Status: Move the overall file through its stages; an activity update is not program completion.',
      'Keep the evidence: Placement checkpoints, evaluations, employment details and referrals belong on the file.',
    ] },
    { title: 'Record the outcome and follow-up', audioUrl: audio('23d5874d0'), points: [
      'Employment details: Record the employer, job title, start date, hours and wage when known.',
      'Watch the 90-day milestone: Every route includes a follow-up; check the due-date alert.',
      'Save the follow-up: Record employment status and any notes so the file and Compass tasks stay current.',
      'Complete the right way: WD completion follows the recorded follow-up; DEA uses its completion decision.',
    ] },
  ],
  pathways_assessment: [
    { title: 'Verify before assessing', audioUrl: audio('c90929b9f'), points: [
      'Start on Intake: Find the client in New Intake, Awaiting Assessment, and press Assess.',
      'Check the overview: Verify contact details, eligibility, language, education and work history.',
      'Correct missing details: Fix the intake information before recording barriers.',
      'Check the central match: Link the existing central client database file when it is the same person.',
    ] },
    { title: 'Record the barrier and the evidence', audioUrl: audio('cd006ca12'), points: [
      'Use the BIT: Choose the barrier and describe the challenges behind it.',
      'Add action steps: Record what will address the barrier; naming it alone is not a plan.',
      'Set the review: Choose a check-in frequency and keep the review dates meaningful.',
      'Confirm the ERA: Complete it in Compass, tick the confirmation, upload the form and add assessment notes.',
    ] },
    { title: 'Make the next worker’s job clear', audioUrl: audio('e9b157e2c'), points: [
      'Suggest plan items: Tick relevant activities and explain why in your notes; the counsellor builds the actual plan.',
      'Answer the navigator question: Yes assigns barrier work to a chosen navigator; No leaves it with the counsellor’s plan.',
      'Remember the stream rule: Service Navigation is tracked for WD clients, not DEA files.',
      'Complete Assessment: The client moves to Awaiting Assignment; choose the stream and counsellor on Intake.',
    ] },
  ],
  pathways_service_nav: [
    { title: 'Know the part of the file you own', audioUrl: audio('f3eb828f7'), points: [
      'Find your clients: Open files assigned to you from Service Navigation on the dashboard or Master List.',
      'Navigator view: Program Flow shows Barriers and Program Progress when another worker is the counsellor.',
      'Keep roles separate: The counsellor owns the action plan and placements; you keep barrier work current.',
      'Use the right record: BIT / ERA preserves the assessment; Program Flow is where barriers are worked.',
    ] },
    { title: 'Work and resolve a barrier properly', audioUrl: audio('b25220683'), points: [
      'Review the card: Check the barrier, challenges, action steps, resources and start and end dates.',
      'Keep status honest: Move to In Progress when work starts; only the assigned navigator edits these cards.',
      'Resolve with evidence: Add an end date and a note explaining how the need was met.',
      'Save and review: Save Barriers, check the timeline and review dates, and complete the related Compass work.',
    ] },
    { title: 'Make a referral a real handoff', audioUrl: audio('854b5044b'), points: [
      'Internal referrals: Select the Candora program and save; an open referral appears on its dashboard.',
      'External referrals: Record the referral on the file and contact the outside partner directly.',
      'Match the resources: Keep the barrier’s Internal or External setting consistent with the referral.',
      'Keep the counsellor informed: Assessment suggestions reach the action plan; raise new needs through action steps, referrals or discussion.',
    ] },
  ],
  pathways_workshops: [
    { title: 'Create the right workshop', audioUrl: audio('3e3786057'), points: [
      'Use the three views: All Workshops holds active cards; Schedule shows dates; Completed keeps history.',
      'New Workshop: Set the title, facilitator, location, times and capacity.',
      'Choose the audience: Decide whether the session is public or reserved for a program.',
      'Job Club shortcut: Start from the pre-filled recurring session and adjust the details when needed.',
    ] },
    { title: 'Run one session at a time', audioUrl: audio('481f5bd0f'), points: [
      'Check the card: Confirm the next date, recurrence, time, location, facilitator and sign-up count.',
      'Watch capacity: The roster counts registrations against the available places.',
      'Open the correct date: A roster belongs to one session, not to the entire repeating workshop.',
      'Record attendance: Distinguish registered, attended and cancelled so the record reflects what happened.',
    ] },
    { title: 'Turn attendance into client progress', audioUrl: audio('48a8c7e8d'), points: [
      'Check the roster first: The attended clients are the ones whose plans will be updated.',
      'Complete the workshop: This marks matching workshop action-plan items complete for those who attended.',
      'Check the client file: Confirm the expected activity now shows completion on the action plan.',
      'Keep the history: Completed workshops remain available for reporting and billing.',
    ] },
  ],
};