// Pre-built training plan templates for Candora staff transitions.
// Each template is a set of activities that can be bulk-added to a TrainingPlan.

export const PHASE_GUIDANCE = {
  pre_start: "Prepare workspace, IT access, and welcome materials before the person arrives.",
  first_day: "Focus on welcome, introductions, and essentials — don't overwhelm.",
  first_week: "Role-specific training, shadowing, and building key relationships.",
  first_month: "Deepening skills, taking on initial tasks, and regular check-ins.",
  ongoing: "Continuous development and feedback beyond the first month.",
};

export const TRAINING_TEMPLATES = [
  {
    id: "standard_new_hire",
    name: "Standard New Hire Onboarding",
    description: "Complete pre-start through first-week plan for a new employee joining the organization.",
    plan_types: ["new_hire", "onboarding"],
    icon: "UserPlus",
    color: "bg-green-50 border-green-200",
    items: [
      // Pre-Start
      { title: "IT setup & account creation", description: "Create email account, set up laptop, configure software access (Office 365, SharePoint, HR system). Prepare login credentials.", phase: "pre_start", day_number: 0, time_block: "", duration_minutes: 30, item_type: "setup", owner_name: "IT / Office Admin", location: "", sort_order: 1 },
      { title: "Workspace preparation", description: "Set up desk, chair, phone, and any equipment needed. Stock with office supplies.", phase: "pre_start", day_number: 0, time_block: "", duration_minutes: 20, item_type: "setup", owner_name: "Office Admin", location: "Main office", sort_order: 2 },
      { title: "Welcome email & first-day instructions", description: "Send a welcome email with start time, parking info, dress code, what to bring, and who to ask for on arrival.", phase: "pre_start", day_number: 0, time_block: "", duration_minutes: 15, item_type: "task", owner_name: "Supervisor / HR", location: "", sort_order: 3 },
      { title: "Prepare access cards & keys", description: "Arrange building access card, office keys, and any security passes.", phase: "pre_start", day_number: 0, time_block: "", duration_minutes: 10, item_type: "setup", owner_name: "Office Admin", location: "", sort_order: 4 },

      // First Day
      { title: "Welcome & office tour", description: "Greet the new hire, introduce to the team, and give a full tour of the office including kitchen, washrooms, meeting rooms, and program spaces.", phase: "first_day", day_number: 1, time_block: "9:00 AM", duration_minutes: 45, item_type: "introduction", owner_name: "Supervisor or Buddy", location: "Main office", sort_order: 1 },
      { title: "HR paperwork & orientation", description: "Complete tax forms, direct deposit, emergency contacts, benefits enrollment, and review employee handbook.", phase: "first_day", day_number: 1, time_block: "10:00 AM", duration_minutes: 60, item_type: "task", owner_name: "HR / Office Admin", location: "HR office", sort_order: 2 },
      { title: "IT systems login & overview", description: "Log into email, SharePoint, HR system, and any program-specific software. Walk through file structure and shared folders.", phase: "first_day", day_number: 1, time_block: "11:00 AM", duration_minutes: 45, item_type: "training", owner_name: "IT / Office Admin", location: "Desk", sort_order: 3 },
      { title: "Lunch with buddy/mentor", description: "Informal lunch to build rapport, ask questions, and learn about the organizational culture.", phase: "first_day", day_number: 1, time_block: "12:00 PM", duration_minutes: 60, item_type: "introduction", owner_name: "Buddy/Mentor", location: "Lunch room or nearby", sort_order: 4 },
      { title: "Meet with direct supervisor", description: "Review role expectations, first-week plan, key priorities, and answer any questions. Discuss communication preferences and check-in cadence.", phase: "first_day", day_number: 1, time_block: "1:30 PM", duration_minutes: 45, item_type: "meeting", owner_name: "Supervisor", location: "Supervisor's office", sort_order: 5 },
      { title: "Review org chart & program overview", description: "Walk through the organizational structure, program areas, and how the role fits into the bigger picture.", phase: "first_day", day_number: 1, time_block: "2:30 PM", duration_minutes: 45, item_type: "training", owner_name: "Supervisor", location: "Meeting room", sort_order: 6 },
      { title: "End-of-day check-in", description: "Quick check-in to see how the day went, address any concerns, and preview tomorrow's schedule.", phase: "first_day", day_number: 1, time_block: "4:30 PM", duration_minutes: 15, item_type: "review", owner_name: "Supervisor", location: "", sort_order: 7 },

      // First Week
      { title: "Program area deep dive", description: "Detailed overview of the program area the person will be working in — history, current participants, key partners, and goals.", phase: "first_week", day_number: 2, time_block: "Morning", duration_minutes: 90, item_type: "training", owner_name: "Program Lead", location: "Program space", sort_order: 1 },
      { title: "Shadowing: observe current program/session", description: "Shadow a current staff member running a program or session to see day-to-day operations in action.", phase: "first_week", day_number: 2, time_block: "Afternoon", duration_minutes: 120, item_type: "shadowing", owner_name: "Program Lead", location: "Program space", sort_order: 2 },
      { title: "Key stakeholder introductions", description: "Meet key team members across departments — ED, finance, volunteer coordinator, communications.", phase: "first_week", day_number: 3, time_block: "Morning", duration_minutes: 60, item_type: "introduction", owner_name: "Supervisor", location: "", sort_order: 3 },
      { title: "Systems & reporting training", description: "Learn how to log activities, enter participant data, and complete reporting requirements for the role.", phase: "first_week", day_number: 3, time_block: "Afternoon", duration_minutes: 90, item_type: "training", owner_name: "Supervisor or Data Lead", location: "Desk", sort_order: 4 },
      { title: "Health & safety / policies review", description: "Review workplace safety procedures, emergency protocols, child protection policy, and code of conduct.", phase: "first_week", day_number: 4, time_block: "Morning", duration_minutes: 60, item_type: "training", owner_name: "HR / Supervisor", location: "Meeting room", sort_order: 5 },
      { title: "Hands-on practice with guidance", description: "Try key tasks with supervision — practice using systems, running a portion of a session, or completing a report.", phase: "first_week", day_number: 4, time_block: "Afternoon", duration_minutes: 120, item_type: "task", owner_name: "Supervisor or Buddy", location: "Program space", sort_order: 6 },
      { title: "End-of-week check-in & feedback", description: "Review the week, discuss what went well, answer lingering questions, and set goals for next week.", phase: "first_week", day_number: 5, time_block: "Afternoon", duration_minutes: 45, item_type: "review", owner_name: "Supervisor", location: "Supervisor's office", sort_order: 7 },
    ],
  },

  {
    id: "lateral_move",
    name: "Lateral Move / Role Transition",
    description: "Structured handover plan for an existing employee moving to a new role or department.",
    plan_types: ["lateral_move", "role_transition"],
    icon: "ArrowLeftRight",
    color: "bg-purple-50 border-purple-200",
    items: [
      // Pre-Start
      { title: "Announce transition to team", description: "Communicate the role change to both the departing and receiving teams. Explain timelines and continuity plan.", phase: "pre_start", day_number: 0, time_block: "", duration_minutes: 20, item_type: "task", owner_name: "Supervisor / ED", location: "", sort_order: 1 },
      { title: "Prepare handover document", description: "Create a handover doc covering current projects, key contacts, pending deadlines, and where files are stored.", phase: "pre_start", day_number: 0, time_block: "", duration_minutes: 60, item_type: "task", owner_name: "Outgoing role holder", location: "", sort_order: 2 },
      { title: "Update access & permissions", description: "Adjust system access, SharePoint permissions, and email lists for the new role. Revoke old access where appropriate.", phase: "pre_start", day_number: 0, time_block: "", duration_minutes: 30, item_type: "setup", owner_name: "IT / Office Admin", location: "", sort_order: 3 },

      // First Day
      { title: "Meet new team & workspace", description: "Get oriented to the new team's workspace, meeting rhythms, and communication channels.", phase: "first_day", day_number: 1, time_block: "9:00 AM", duration_minutes: 45, item_type: "introduction", owner_name: "New Supervisor", location: "New department area", sort_order: 1 },
      { title: "Role expectations & priorities", description: "Discuss expectations for the new role, immediate priorities, and how success will be measured.", phase: "first_day", day_number: 1, time_block: "10:00 AM", duration_minutes: 60, item_type: "meeting", owner_name: "New Supervisor", location: "Supervisor's office", sort_order: 2 },
      { title: "Handover session with predecessor", description: "Walk through the handover document, ask questions, and clarify any open items or ongoing work.", phase: "first_day", day_number: 1, time_block: "1:00 PM", duration_minutes: 90, item_type: "meeting", owner_name: "Outgoing role holder", location: "Meeting room", sort_order: 3 },
      { title: "End-of-day reflection", description: "Quick check-in to discuss first impressions, flag any concerns, and preview the rest of the week.", phase: "first_day", day_number: 1, time_block: "4:30 PM", duration_minutes: 15, item_type: "review", owner_name: "New Supervisor", location: "", sort_order: 4 },

      // First Week
      { title: "Stakeholder introductions", description: "Meet key stakeholders and partners associated with the new role — internal teams and external contacts.", phase: "first_week", day_number: 2, time_block: "Morning", duration_minutes: 60, item_type: "introduction", owner_name: "New Supervisor", location: "", sort_order: 1 },
      { title: "Shadow key processes", description: "Observe the key processes and workflows for the new role, either with the predecessor or a team member.", phase: "first_week", day_number: 2, time_block: "Afternoon", duration_minutes: 120, item_type: "shadowing", owner_name: "Team member", location: "", sort_order: 2 },
      { title: "Systems & tools training", description: "Get up to speed on any new systems, tools, or reporting specific to the new role.", phase: "first_week", day_number: 3, time_block: "Morning", duration_minutes: 90, item_type: "training", owner_name: "Supervisor or IT", location: "Desk", sort_order: 3 },
      { title: "Take on first task", description: "Pick up one concrete deliverable to start building confidence and ownership in the new role.", phase: "first_week", day_number: 3, time_block: "Afternoon", duration_minutes: 120, item_type: "task", owner_name: "Self (with supervisor support)", location: "", sort_order: 4 },
      { title: "Cross-department connections", description: "Meet counterparts in other departments who interact with this role regularly.", phase: "first_week", day_number: 4, time_block: "Morning", duration_minutes: 60, item_type: "introduction", owner_name: "New Supervisor", location: "", sort_order: 5 },
      { title: "End-of-week review & 30-day goals", description: "Review the transition week, confirm handover is complete, and set goals for the first 30 days in the new role.", phase: "first_week", day_number: 5, time_block: "Afternoon", duration_minutes: 45, item_type: "review", owner_name: "New Supervisor", location: "Supervisor's office", sort_order: 6 },
    ],
  },

  {
    id: "volunteer_to_staff",
    name: "Volunteer-to-Staff Transition",
    description: "Onboarding for a current volunteer transitioning into a paid staff role — bridges existing knowledge with staff expectations.",
    plan_types: ["role_transition", "new_hire", "onboarding"],
    icon: "TrendingUp",
    color: "bg-amber-50 border-amber-200",
    items: [
      // Pre-Start
      { title: "Update HR file & set up payroll", description: "Convert volunteer record to employee file. Set up payroll, direct deposit, tax forms, and benefits enrollment.", phase: "pre_start", day_number: 0, time_block: "", duration_minutes: 30, item_type: "setup", owner_name: "HR / Office Admin", location: "HR office", sort_order: 1 },
      { title: "Communicate role change to program teams", description: "Inform program teams and volunteers about the transition. Clarify new reporting structure and how the role has changed.", phase: "pre_start", day_number: 0, time_block: "", duration_minutes: 20, item_type: "task", owner_name: "Supervisor / ED", location: "", sort_order: 2 },
      { title: "Arrange workspace & equipment", description: "Set up a dedicated workspace (if not already in place), phone extension, and any equipment needed for the staff role.", phase: "pre_start", day_number: 0, time_block: "", duration_minutes: 20, item_type: "setup", owner_name: "Office Admin", location: "Main office", sort_order: 3 },

      // First Day
      { title: "Welcome as a staff member", description: "Formally welcome the person into their new staff role. Acknowledge their volunteer contribution and set a positive tone for the transition.", phase: "first_day", day_number: 1, time_block: "9:00 AM", duration_minutes: 30, item_type: "introduction", owner_name: "Supervisor or ED", location: "Supervisor's office", sort_order: 1 },
      { title: "HR orientation & paperwork", description: "Complete employment paperwork, review employee handbook, code of conduct, and discuss employment terms.", phase: "first_day", day_number: 1, time_block: "9:30 AM", duration_minutes: 60, item_type: "task", owner_name: "HR / Office Admin", location: "HR office", sort_order: 2 },
      { title: "Role expectations vs. volunteer role", description: "Clearly delineate how the staff role differs from the previous volunteer role — new responsibilities, accountability, boundaries, and expectations.", phase: "first_day", day_number: 1, time_block: "11:00 AM", duration_minutes: 60, item_type: "meeting", owner_name: "Direct Supervisor", location: "Meeting room", sort_order: 3 },
      { title: "Staff systems access & training", description: "Set up and train on staff-only systems — HR portal, reporting tools, internal communications, and any restricted folders.", phase: "first_day", day_number: 1, time_block: "1:00 PM", duration_minutes: 60, item_type: "training", owner_name: "IT / Office Admin", location: "Desk", sort_order: 4 },
      { title: "End-of-day check-in", description: "Quick check-in to address any questions about the transition and preview the week.", phase: "first_day", day_number: 1, time_block: "4:30 PM", duration_minutes: 15, item_type: "review", owner_name: "Direct Supervisor", location: "", sort_order: 5 },

      // First Week
      { title: "Shadow current program lead", description: "Shadow the current program lead to understand the staff-level perspective on programs the person already knows as a volunteer.", phase: "first_week", day_number: 2, time_block: "Morning", duration_minutes: 120, item_type: "shadowing", owner_name: "Program Lead", location: "Program space", sort_order: 1 },
      { title: "Reporting & accountability training", description: "Learn staff reporting expectations — participant tracking, outcome reporting, timesheets, and program documentation.", phase: "first_week", day_number: 2, time_block: "Afternoon", duration_minutes: 90, item_type: "training", owner_name: "Supervisor or Data Lead", location: "Desk", sort_order: 2 },
      { title: "Meet with volunteer coordinator", description: "Discuss how to navigate the volunteer-staff boundary, especially if still interacting with former volunteer peers.", phase: "first_week", day_number: 3, time_block: "Morning", duration_minutes: 45, item_type: "introduction", owner_name: "Volunteer Coordinator", location: "", sort_order: 3 },
      { title: "Review policies & boundaries", description: "Review confidentiality, conflict of interest, and professional boundaries relevant to the new staff role.", phase: "first_week", day_number: 3, time_block: "Afternoon", duration_minutes: 60, item_type: "training", owner_name: "HR / Supervisor", location: "Meeting room", sort_order: 4 },
      { title: "Lead first session/task as staff", description: "Take the lead on a session or task that was previously done as a volunteer, now with staff-level responsibility.", phase: "first_week", day_number: 4, time_block: "Morning", duration_minutes: 120, item_type: "task", owner_name: "Self (with supervisor support)", location: "Program space", sort_order: 5 },
      { title: "End-of-week check-in & feedback", description: "Review the transition week, discuss how the shift from volunteer to staff is going, and set goals for the coming weeks.", phase: "first_week", day_number: 5, time_block: "Afternoon", duration_minutes: 45, item_type: "review", owner_name: "Direct Supervisor", location: "Supervisor's office", sort_order: 6 },
    ],
  },

  {
    id: "minimal_first_day",
    name: "Quick First Day & Week",
    description: "Streamlined essentials for a first day and first week — lighter than full onboarding, but covers the key milestones.",
    plan_types: ["onboarding", "new_hire", "training", "lateral_move", "role_transition"],
    icon: "Zap",
    color: "bg-blue-50 border-blue-200",
    items: [
      // Pre-Start
      { title: "Workspace setup & IT login", description: "Get desk, computer, email, and key systems up and running.", phase: "pre_start", day_number: 0, time_block: "", duration_minutes: 30, item_type: "setup", owner_name: "IT / Office Admin", location: "Desk", sort_order: 1 },

      // First Day
      { title: "Welcome & office tour", description: "Greet the person, introduce to the team, and tour the office.", phase: "first_day", day_number: 1, time_block: "9:00 AM", duration_minutes: 30, item_type: "introduction", owner_name: "Supervisor or Buddy", location: "Main office", sort_order: 1 },
      { title: "Role expectations with supervisor", description: "Discuss role, priorities, communication style, and first-week goals.", phase: "first_day", day_number: 1, time_block: "10:00 AM", duration_minutes: 45, item_type: "meeting", owner_name: "Supervisor", location: "Supervisor's office", sort_order: 2 },
      { title: "Systems & tools overview", description: "Walk through key systems, shared folders, and reporting tools.", phase: "first_day", day_number: 1, time_block: "11:00 AM", duration_minutes: 45, item_type: "training", owner_name: "IT / Supervisor", location: "Desk", sort_order: 3 },
      { title: "Lunch with team or buddy", description: "Informal lunch to build relationships.", phase: "first_day", day_number: 1, time_block: "12:00 PM", duration_minutes: 60, item_type: "introduction", owner_name: "Buddy/Mentor", location: "", sort_order: 4 },
      { title: "Shadow a session or task", description: "Observe a current activity to understand day-to-day operations.", phase: "first_day", day_number: 1, time_block: "1:30 PM", duration_minutes: 90, item_type: "shadowing", owner_name: "Team member", location: "", sort_order: 5 },
      { title: "End-of-day check-in", description: "Quick review of the day, address questions, and preview tomorrow.", phase: "first_day", day_number: 1, time_block: "4:30 PM", duration_minutes: 15, item_type: "review", owner_name: "Supervisor", location: "", sort_order: 6 },

      // First Week
      { title: "Hands-on role training", description: "Begin learning the core tasks and responsibilities of the role with guided instruction.", phase: "first_week", day_number: 2, time_block: "Morning", duration_minutes: 120, item_type: "training", owner_name: "Supervisor or Program Lead", location: "", sort_order: 1 },
      { title: "Shadow a full session or shift", description: "Observe a complete session or shift from start to finish to see the full workflow.", phase: "first_week", day_number: 2, time_block: "Afternoon", duration_minutes: 120, item_type: "shadowing", owner_name: "Team member", location: "", sort_order: 2 },
      { title: "Key introductions across teams", description: "Meet the key people the role interacts with — other departments, program leads, and partners.", phase: "first_week", day_number: 3, time_block: "Morning", duration_minutes: 60, item_type: "introduction", owner_name: "Supervisor", location: "", sort_order: 3 },
      { title: "Practice with guidance", description: "Try out the core tasks hands-on with a buddy or supervisor nearby for support.", phase: "first_week", day_number: 3, time_block: "Afternoon", duration_minutes: 120, item_type: "task", owner_name: "Supervisor or Buddy", location: "", sort_order: 4 },
      { title: "Review policies & procedures", description: "Walk through key workplace policies, safety procedures, and role-specific protocols.", phase: "first_week", day_number: 4, time_block: "Morning", duration_minutes: 60, item_type: "training", owner_name: "HR / Supervisor", location: "Meeting room", sort_order: 5 },
      { title: "Independent task with check-in", description: "Take on a small task independently, with a mid-point check-in to confirm direction.", phase: "first_week", day_number: 4, time_block: "Afternoon", duration_minutes: 120, item_type: "task", owner_name: "Self (with supervisor support)", location: "", sort_order: 6 },
      { title: "End-of-week review & next-week goals", description: "Review the first week, share feedback, and set goals for the coming week.", phase: "first_week", day_number: 5, time_block: "Afternoon", duration_minutes: 45, item_type: "review", owner_name: "Supervisor", location: "Supervisor's office", sort_order: 7 },
    ],
  },
];

export function getTemplatesForPlanType(planType) {
  return TRAINING_TEMPLATES.filter(t => t.plan_types.includes(planType));
}

export function getTemplateById(id) {
  return TRAINING_TEMPLATES.find(t => t.id === id);
}