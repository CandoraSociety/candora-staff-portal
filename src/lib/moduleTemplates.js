// Pre-built module templates for users unfamiliar with creating training content.
// Each template provides a complete structure: details, objectives, slides, and quiz.

export const MODULE_TEMPLATES = [
  {
    id: "new_employee_onboarding",
    name: "New Employee Onboarding",
    description: "A comprehensive welcome module covering org overview, policies, workplace tour, and IT setup.",
    icon: "UserPlus",
    category: "onboarding",
    difficulty: "beginner",
    duration_minutes: 45,
    tags: ["onboarding", "new-hire", "orientation"],
    template: {
      title: "Welcome to Candora — New Employee Onboarding",
      description: "A comprehensive welcome module that introduces new employees to the organization, its mission, key policies, workplace facilities, and essential IT setup.",
      category: "onboarding",
      content_type: "presentation",
      difficulty: "beginner",
      duration_minutes: 45,
      tags: ["onboarding", "new-hire", "orientation"],
      learning_objectives: [
        "Understand the organization's mission, values, and history",
        "Identify key workplace policies and where to find them",
        "Navigate the physical workspace and know emergency procedures",
        "Complete essential IT and account setup",
        "Know who to contact for common questions"
      ],
      slides: [
        { title: "Welcome to the Team!", layout: "section_divider", bullets: [], speaker_notes: "Warm welcome, introduce yourself, set a positive tone for the session." },
        { title: "Our Mission & Values", layout: "title_bullets", bullets: ["Mission: Empowering community through connection", "Values: Compassion, Integrity, Inclusion, Excellence", "History: Serving the community since 1985", "Impact: 10,000+ lives touched annually"], speaker_notes: "Share a brief story about the org's founding. Connect values to everyday work." },
        { title: "Who We Are", layout: "title_bullets", bullets: ["Non-profit community organization", "Programs: Food services, resource centre, digital literacy, community programs", "Funded by: Government grants, donations, fundraising", "Team: ~50 staff and 200+ volunteers"], speaker_notes: "Give a sense of scale and the breadth of programs." },
        { title: "Key Policies to Know", layout: "title_bullets", bullets: ["Code of Conduct — expected behavior standards", "Confidentiality — protecting client and org information", "Health & Safety — your rights and responsibilities", "Anti-Harassment — zero tolerance, how to report", "Time & Attendance — recording hours, breaks"], speaker_notes: "Don't read every policy — point to where they're found and highlight the most critical items." },
        { title: "Workplace Tour", layout: "title_bullets", bullets: ["Front desk / reception area", "Staff kitchen and break room", "Meeting rooms and booking system", "Program spaces", "Emergency exits and muster point"], speaker_notes: "Actually walk them through the space after this slide." },
        { title: "IT & Account Setup", layout: "title_bullets", bullets: ["Email account login and setup", "Staff portal access and navigation", "Phone system basics", "File storage and SharePoint", "Who to contact: IT support"], speaker_notes: "Have their credentials ready. Walk through login together." },
        { title: "Your First Week", layout: "title_bullets", bullets: ["Day 1: Setup, tour, meet your team", "Day 2-3: Role-specific orientation", "Week 1: Shadowing and training modules", "Week 2: Begin independent work with check-ins", "30-day check-in with supervisor"], speaker_notes: "Set expectations clearly. Reassure them that questions are welcome." },
        { title: "Questions & Support", layout: "title_only", bullets: [], speaker_notes: "Open floor for questions. Remind them of key contacts: supervisor, HR, IT." }
      ],
      quiz_questions: [
        { question: "What should you do if you witness harassment in the workplace?", options: ["Ignore it — it's not your business", "Report it following the anti-harassment policy", "Confront the person directly", "Wait and see if it happens again"], correct_index: 1, explanation: "Candora has a zero-tolerance policy. All incidents should be reported through the proper channels." },
        { question: "Where can you find the organization's policies?", options: ["Ask a coworker each time", "The staff portal / SharePoint", "They're only in the HR office", "There are no written policies"], correct_index: 1, explanation: "All policies are documented and accessible through the staff portal." },
        { question: "What is the recommended first step in your onboarding?", options: ["Start working immediately", "Complete IT setup and workplace tour", "Read every policy document", "Attend a board meeting"], correct_index: 1, explanation: "Day 1 focuses on setup, tour, and meeting the team to ease the transition." }
      ]
    }
  },
  {
    id: "workplace_safety",
    name: "Workplace Safety Basics",
    description: "Essential safety training covering hazard identification, PPE, emergency procedures, and incident reporting.",
    icon: "HardHat",
    category: "safety",
    difficulty: "beginner",
    duration_minutes: 30,
    tags: ["safety", "compliance", "required"],
    template: {
      title: "Workplace Safety Fundamentals",
      description: "Essential safety training that covers identifying workplace hazards, proper use of personal protective equipment, emergency response procedures, and how to report incidents.",
      category: "safety",
      content_type: "presentation",
      difficulty: "beginner",
      duration_minutes: 30,
      tags: ["safety", "compliance", "required"],
      learning_objectives: [
        "Identify common workplace hazards",
        "Understand when and how to use PPE",
        "Know emergency evacuation procedures",
        "Report incidents and near-misses correctly",
        "Locate safety equipment and first aid kits"
      ],
      slides: [
        { title: "Workplace Safety Fundamentals", layout: "section_divider", bullets: [], speaker_notes: "Emphasize that safety is everyone's responsibility." },
        { title: "Why Safety Matters", layout: "title_bullets", bullets: ["Protects you and your coworkers", "Legal requirement under OHS legislation", "Reduces workplace injuries and lost time", "Creates a culture of care"], speaker_notes: "Share a relevant statistic about workplace safety." },
        { title: "Common Hazards", layout: "title_bullets", bullets: ["Slips, trips, and falls", "Electrical hazards", "Chemical exposure (cleaning supplies)", "Ergonomic strain (lifting, repetitive motion)", "Fire hazards"], speaker_notes: "Ask participants to identify hazards they've noticed in the workplace." },
        { title: "Personal Protective Equipment (PPE)", layout: "title_bullets", bullets: ["Gloves — for handling chemicals or food", "Safety shoes — in kitchen or warehouse areas", "Eye protection — when using tools", "Know where PPE is stored", "Replace damaged PPE immediately"], speaker_notes: "Show examples of PPE available in the workplace." },
        { title: "Emergency Procedures", layout: "title_bullets", bullets: ["Know your exit routes — check the map", "Muster point: front parking lot", "Fire alarm: evacuate immediately, do not use elevators", "First aid: trained first aiders are designated per shift", "Emergency contacts posted at every workstation"], speaker_notes: "Point out the nearest exit and fire extinguisher." },
        { title: "Reporting Incidents", layout: "title_bullets", bullets: ["Report ALL incidents — even near-misses", "Use the incident report form on the staff portal", "Report within 24 hours", "Include: what, when, where, who, witnesses", "Photos are helpful"], speaker_notes: "Stress that reporting near-misses helps prevent future incidents." },
        { title: "Your Safety Responsibilities", layout: "title_bullets", bullets: ["Follow safe work procedures", "Use PPE when required", "Report hazards immediately", "Keep walkways clear", "Ask if you're unsure — don't take risks"], speaker_notes: "Reinforce that asking questions is always better than risking injury." }
      ],
      quiz_questions: [
        { question: "When should you report a near-miss incident?", options: ["Only if someone gets hurt", "Within 24 hours, even if no one was injured", "Never — near-misses don't count", "Only if a supervisor sees it"], correct_index: 1, explanation: "Near-misses are leading indicators of potential incidents. Reporting them helps prevent future injuries." },
        { question: "What should you do when the fire alarm sounds?", options: ["Finish your current task first", "Check if it's a real fire before leaving", "Evacuate immediately using the nearest exit", "Use the elevator to exit quickly"], correct_index: 2, explanation: "Always evacuate immediately when the alarm sounds. Never use elevators during a fire." },
        { question: "Where is the muster point located?", options: ["Inside the building lobby", "Front parking lot", "Back of the building", "Anywhere outside"], correct_index: 1, explanation: "The designated muster point is the front parking lot where a headcount will be taken." }
      ]
    }
  },
  {
    id: "code_of_conduct",
    name: "Code of Conduct & Ethics",
    description: "An ethics training module covering organizational values, expected behavior, conflicts of interest, and reporting mechanisms.",
    icon: "ShieldCheck",
    category: "compliance",
    difficulty: "beginner",
    duration_minutes: 25,
    tags: ["ethics", "compliance", "required"],
    template: {
      title: "Code of Conduct & Workplace Ethics",
      description: "This module covers the organization's code of conduct, ethical decision-making, conflicts of interest, and how to raise concerns or report violations.",
      category: "compliance",
      content_type: "presentation",
      difficulty: "beginner",
      duration_minutes: 25,
      tags: ["ethics", "compliance", "required"],
      learning_objectives: [
        "Understand the organization's code of conduct",
        "Recognize and manage conflicts of interest",
        "Apply ethical decision-making in daily work",
        "Know how to raise concerns and report violations",
        "Understand confidentiality obligations"
      ],
      slides: [
        { title: "Code of Conduct & Ethics", layout: "section_divider", bullets: [], speaker_notes: "Set the tone: ethics is about doing the right thing, even when no one is watching." },
        { title: "Our Core Values in Action", layout: "title_bullets", bullets: ["Compassion — treat everyone with dignity", "Integrity — do the right thing, always", "Inclusion — welcome and respect all", "Excellence — strive for quality in all we do"], speaker_notes: "Connect each value to real workplace scenarios." },
        { title: "Expected Behavior", layout: "title_bullets", bullets: ["Treat colleagues, clients, and volunteers with respect", "Communicate honestly and transparently", "Respect confidentiality of client and org information", "Avoid discriminatory or harassing behavior", "Use org resources responsibly"], speaker_notes: "Give examples of both positive and unacceptable behavior." },
        { title: "Conflicts of Interest", layout: "title_bullets", bullets: ["A conflict exists when personal interests affect professional judgment", "Examples: hiring a family member, accepting gifts from vendors", "Disclose potential conflicts to your supervisor", "When in doubt, disclose"], speaker_notes: "Use a relatable example to illustrate." },
        { title: "Confidentiality", layout: "title_bullets", bullets: ["Client information is strictly confidential", "Don't discuss clients outside of work", "Secure documents and screens", "Report any data breaches immediately", "Social media: never post about clients or internal matters"], speaker_notes: "Emphasize that confidentiality continues even after leaving the organization." },
        { title: "Speaking Up", layout: "title_bullets", bullets: ["Report concerns to: supervisor, HR, or ED", "Whistleblower protection applies", "Retaliation is prohibited", "Can report anonymously", "All reports are taken seriously"], speaker_notes: "Reassure that raising concerns in good faith is always the right thing to do." }
      ],
      quiz_questions: [
        { question: "What should you do if you realize you have a conflict of interest?", options: ["Ignore it — it's probably fine", "Disclose it to your supervisor", "Quit your job immediately", "Only mention it if someone asks"], correct_index: 1, explanation: "Always disclose potential conflicts to your supervisor so they can be properly managed." },
        { question: "Can you discuss client information with your family?", options: ["Yes, if you trust them", "Yes, if you don't use names", "No — client information is strictly confidential", "Only if it's an emergency"], correct_index: 2, explanation: "Client information must never be shared outside of the workplace, regardless of the circumstances." },
        { question: "What happens if you report a concern in good faith?", options: ["You may face retaliation", "You are protected from retaliation", "Your report will be ignored", "You must prove your claim first"], correct_index: 1, explanation: "Whistleblower protections ensure that reporting concerns in good faith will not result in retaliation." }
      ]
    }
  },
  {
    id: "customer_service",
    name: "Customer Service Excellence",
    description: "A soft skills module on communication, handling difficult interactions, and maintaining service standards.",
    icon: "HeartHandshake",
    category: "soft_skills",
    difficulty: "beginner",
    duration_minutes: 35,
    tags: ["communication", "service", "soft-skills"],
    template: {
      title: "Customer Service Excellence",
      description: "This module develops essential customer service skills including effective communication, de-escalating difficult situations, and maintaining consistent service standards.",
      category: "soft_skills",
      content_type: "presentation",
      difficulty: "beginner",
      duration_minutes: 35,
      tags: ["communication", "service", "soft-skills"],
      learning_objectives: [
        "Apply active listening techniques",
        "Communicate clearly and professionally",
        "Handle difficult interactions with empathy",
        "De-escalate tense situations",
        "Maintain consistent service standards"
      ],
      slides: [
        { title: "Customer Service Excellence", layout: "section_divider", bullets: [], speaker_notes: "Every interaction is an opportunity to make someone's day better." },
        { title: "The Service Mindset", layout: "title_bullets", bullets: ["Every person who walks through our door matters", "You are the face of the organization", "Small kindnesses make a big difference", "Service is a skill that can be developed"], speaker_notes: "Share a personal story about great customer service you've received." },
        { title: "Active Listening", layout: "title_bullets", bullets: ["Give your full attention — put down the phone", "Make eye contact and nod", "Don't interrupt — let them finish", "Paraphrase to confirm understanding", "Ask clarifying questions"], speaker_notes: "Practice with a partner: one describes a problem, the other reflects back." },
        { title: "Communication Basics", layout: "title_bullets", bullets: ["Greet warmly — smile and use their name", "Use clear, simple language", "Avoid jargon and acronyms", "Check for understanding", "Thank them for coming in"], speaker_notes: "Demonstrate tone of voice — the same words can sound very different." },
        { title: "Handling Difficult Interactions", layout: "title_bullets", bullets: ["Stay calm — don't take it personally", "Acknowledge their feelings: 'I understand this is frustrating'", "Listen fully before responding", "Focus on what you CAN do, not what you can't", "Offer options when possible"], speaker_notes: "Role-play a difficult interaction. Show the difference between reacting and responding." },
        { title: "De-escalation Techniques", layout: "title_bullets", bullets: ["Lower your voice and slow your speech", "Give them space — don't crowd", "Use 'I' statements: 'I want to help'", "Offer to involve a supervisor if needed", "Know when to step away for safety"], speaker_notes: "Emphasize that safety always comes first — never tolerate abuse." },
        { title: "Service Standards", layout: "title_bullets", bullets: ["Greet within 30 seconds of arrival", "Follow up on commitments within 24 hours", "Keep the reception area clean and welcoming", "Refer to the right person when unsure", "End every interaction positively"], speaker_notes: "Review the actual service standards specific to this organization." }
      ],
      quiz_questions: [
        { question: "What is the first step in active listening?", options: ["Give advice immediately", "Give your full attention", "Interrupt to ask questions", "Take detailed notes"], correct_index: 1, explanation: "Active listening starts with giving your full, undivided attention to the speaker." },
        { question: "When handling a difficult interaction, you should:", options: ["Take it personally", "Argue your point firmly", "Stay calm and acknowledge their feelings", "Tell them to calm down"], correct_index: 2, explanation: "Staying calm and acknowledging feelings de-escalates tension and shows you care." },
        { question: "If you don't know the answer to a client's question, you should:", options: ["Make something up to seem helpful", "Say 'I don't know' and walk away", "Find the right person or resource to help", "Tell them to come back later"], correct_index: 2, explanation: "It's always better to find the right answer than to guess. Refer to the right person or resource." }
      ]
    }
  },
  {
    id: "volunteer_orientation",
    name: "Volunteer Orientation",
    description: "An orientation module for new volunteers covering the mission, expectations, procedures, and available support.",
    icon: "HandHeart",
    category: "volunteer",
    difficulty: "beginner",
    duration_minutes: 30,
    tags: ["volunteer", "orientation", "onboarding"],
    template: {
      title: "Volunteer Orientation — Welcome!",
      description: "This orientation module welcomes new volunteers, introduces them to the organization's mission and programs, sets clear expectations, and provides essential procedural information.",
      category: "volunteer",
      content_type: "presentation",
      difficulty: "beginner",
      duration_minutes: 30,
      tags: ["volunteer", "orientation", "onboarding"],
      learning_objectives: [
        "Understand the organization's mission and impact",
        "Know volunteer expectations and commitments",
        "Understand key procedures (signing in, reporting, communication)",
        "Identify who to contact for support",
        "Feel welcomed and valued as part of the team"
      ],
      slides: [
        { title: "Welcome, Volunteer!", layout: "section_divider", bullets: [], speaker_notes: "Express genuine gratitude. Volunteers give their time freely — make them feel valued." },
        { title: "Our Mission & Impact", layout: "title_bullets", bullets: ["Mission: Empowering community through connection", "Programs: Food services, resource centre, digital literacy, community programs", "Last year: 200+ volunteers, 15,000+ volunteer hours", "Your role makes this possible"], speaker_notes: "Make the impact tangible — share a specific story." },
        { title: "Volunteer Expectations", layout: "title_bullets", bullets: ["Arrive on time for your shift", "Sign in and out each visit", "Communicate absences in advance", "Follow the code of conduct", "Respect confidentiality of clients"], speaker_notes: "Be clear but warm — these are expectations, not demands." },
        { title: "Procedures to Know", layout: "title_bullets", bullets: ["Sign-in sheet at front desk", "Volunteer portal for scheduling", "Report incidents to staff immediately", "Park in the volunteer lot", "Break room and kitchen available"], speaker_notes: "Walk through procedures step by step." },
        { title: "Your Role & Training", layout: "title_bullets", bullets: ["Role-specific training will be provided", "Shadow experienced volunteers first", "Ask questions — that's how we learn", "Feedback is always welcome"], speaker_notes: "Match expectations to their specific role." },
        { title: "Support & Resources", layout: "title_bullets", bullets: ["Volunteer coordinator: your main contact", "Staff are always available to help", "Volunteer portal: schedules, documents, resources", "Recognition events and appreciation program", "We're a team — support each other"], speaker_notes: "Introduce the volunteer coordinator by name." },
        { title: "Thank You!", layout: "title_only", bullets: [], speaker_notes: "End with sincere thanks. Give them a tour of the space." }
      ],
      quiz_questions: [
        { question: "What should you do if you can't make your volunteer shift?", options: ["Just don't show up", "Communicate your absence in advance", "Send another volunteer in your place", "Wait until they call you"], correct_index: 1, explanation: "Advance communication allows the coordinator to arrange coverage and ensures programs run smoothly." },
        { question: "Who is your main point of contact for questions?", options: ["The Executive Director", "Any random staff member", "The volunteer coordinator", "No one — figure it out yourself"], correct_index: 2, explanation: "The volunteer coordinator is your dedicated support person for all volunteer-related matters." },
        { question: "What is expected regarding client confidentiality?", options: ["You can share if you don't use names", "Always respect client confidentiality", "Only staff need to worry about it", "It's fine to discuss on social media"], correct_index: 1, explanation: "All volunteers must respect client confidentiality, just like staff members." }
      ]
    }
  },
  {
    id: "data_privacy",
    name: "Data Privacy & Security",
    description: "A module covering data protection principles, secure handling of information, and breach response procedures.",
    icon: "Lock",
    category: "compliance",
    difficulty: "intermediate",
    duration_minutes: 25,
    tags: ["privacy", "security", "compliance"],
    template: {
      title: "Data Privacy & Information Security",
      description: "This module covers how to protect personal and organizational data, recognize security threats, and respond to potential data breaches.",
      category: "compliance",
      content_type: "presentation",
      difficulty: "intermediate",
      duration_minutes: 25,
      tags: ["privacy", "security", "compliance"],
      learning_objectives: [
        "Understand what constitutes personal data",
        "Apply secure data handling practices",
        "Recognize common security threats (phishing, social engineering)",
        "Know the breach response procedure",
        "Use strong passwords and authentication"
      ],
      slides: [
        { title: "Data Privacy & Security", layout: "section_divider", bullets: [], speaker_notes: "Data breaches can harm clients and the organization. Everyone plays a role in protection." },
        { title: "What Is Personal Data?", layout: "title_bullets", bullets: ["Names, addresses, phone numbers", "Email addresses", "Date of birth", "Health information", "Financial information", "Any information that identifies a person"], speaker_notes: "Emphasize that even seemingly harmless data can be sensitive when combined." },
        { title: "Secure Data Handling", layout: "title_bullets", bullets: ["Lock screens when away from desk", "Store documents in approved systems only", "Shred paper documents with personal data", "Don't email personal data — use secure file sharing", "Clear desk policy: no sensitive data left out"], speaker_notes: "Walk through the approved systems used at this organization." },
        { title: "Recognizing Threats", layout: "title_bullets", bullets: ["Phishing: suspicious emails asking for info or links", "Social engineering: someone impersonating staff or vendors", "Unexpected attachments or links", "Urgent requests for personal data", "When in doubt — don't click, ask IT"], speaker_notes: "Show a real phishing example and dissect the red flags." },
        { title: "Password Security", layout: "title_bullets", bullets: ["Use strong passwords: 12+ characters, mix of types", "Never reuse passwords across systems", "Use the approved password manager", "Enable two-factor authentication", "Never share passwords — even with IT"], speaker_notes: "IT will never ask for your password." },
        { title: "Breach Response", layout: "title_bullets", bullets: ["Report immediately — within 1 hour", "Contact: IT support and your supervisor", "Do NOT try to fix it yourself", "Document what happened", "Preserve evidence (don't delete emails)"], speaker_notes: "Speed matters in breach response. When in doubt, report." },
        { title: "Your Role", layout: "title_bullets", bullets: ["You are the first line of defense", "Be vigilant — question unusual requests", "Report concerns promptly", "Keep learning — threats evolve", "Ask for help when unsure"], speaker_notes: "Security is a team effort." }
      ],
      quiz_questions: [
        { question: "You receive an email that looks like it's from IT asking for your password. What do you do?", options: ["Reply with your password — it's IT", "Ignore it — IT already knows your password", "Don't respond — IT will never ask for your password. Report it.", "Forward it to coworkers"], correct_index: 2, explanation: "IT will never ask for your password. This is a phishing attempt — report it immediately." },
        { question: "How quickly should you report a suspected data breach?", options: ["Within a week", "Within 24 hours", "Within 1 hour", "Only if confirmed"], correct_index: 2, explanation: "Report within 1 hour. Speed is critical in containing and responding to data breaches." },
        { question: "What is an example of personal data?", options: ["A company's public address", "A client's phone number", "A published newsletter", "A job posting"], correct_index: 1, explanation: "A client's phone number is personal data that must be protected under privacy regulations." }
      ]
    }
  }
];

export function getTemplateById(id) {
  return MODULE_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category) {
  if (!category || category === "all") return MODULE_TEMPLATES;
  return MODULE_TEMPLATES.filter(t => t.category === category);
}