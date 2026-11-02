// External resource library shown on the Learn tab. Every link here is free to
// open and was checked before being added; where a certificate itself has a fee
// (ProServe, food safety, security training) the card says so. Cards open in a
// new tab; nothing is mirrored inside the app.
//
// Shape:
//   RESOURCE_SECTIONS[]  → one nav tab each
//     { value, label, blurb, groups: [{ title, note?, items: [] }] }
//   The "industries" section instead carries INDUSTRY_TRACKS[] — a second-level
//   picker so a client can go straight to the sector they are applying in.
//
// Item shape: { title, description, url, tag, entryLevel? }
// "entryLevel: true" shows the gold Entry level badge — the roles and training
// that need no experience and no ticket.

const ALIS = 'https://alis.alberta.ca/occinfo/occupations-in-alberta/occupation-profiles';
const JB = 'https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring=';

const alisProfile = (title, description, slug) => ({
  title,
  description,
  url: `${ALIS}/${slug}/`,
  tag: 'Career profile',
  entryLevel: true,
});

const openings = (title, description, search) => ({
  title,
  description,
  url: `${JB}${search}`,
  tag: 'Job Bank',
  entryLevel: true,
});

const courseSearch = (title, description, query) => ({
  title,
  description,
  url: `https://alison.com/courses?query=${query}`,
  tag: 'Free course',
});

// ── Industry tracks ────────────────────────────────────────────────────────
// Ordered by how often we place people into them — the first four cover most
// entry-level placements at the centre.
export const INDUSTRY_TRACKS = [
  {
    value: 'retail',
    label: 'Retail & Customer Service',
    blurb:
      'The biggest entry-level door in Alberta: cash, stocking shelves, helping customers. Almost none of it needs experience or a certificate — employers hire for reliability and people skills.',
    entryRoles: ['Cashier', 'Retail salesperson', 'Stock associate', 'Customer service'],
    groups: [
      {
        title: 'What the work is really like',
        items: [
          alisProfile('Retail salesperson', 'Duties, wages, outlook and how people get in — the most common first job.', 'retail-salesperson'),
          alisProfile('Cashier', 'Handling money, tills and customers, and what employers expect.', 'cashier'),
        ],
      },
      {
        title: 'Free training to get hired',
        items: [
          courseSearch('Customer service courses', 'Short free courses on serving customers, handling complaints and retail basics.', 'customer+service'),
          courseSearch('Retail courses', 'Free short courses on retail operations and sales.', 'retail'),
        ],
      },
      {
        title: 'Who is hiring now',
        items: [
          openings('Retail openings — Job Bank', 'Current retail jobs across Canada; narrow it to your city.', 'retail'),
          openings('Cashier openings — Job Bank', 'Cash and front-counter jobs, including part-time and evenings.', 'cashier'),
        ],
      },
    ],
  },
  {
    value: 'food',
    label: 'Food Service & Hospitality',
    blurb:
      'Cooks, servers, dishwashers and baristas — constantly hiring, with shifts that fit school or caregiving. Only serving alcohol needs a certificate (ProServe).',
    entryRoles: ['Cook / line cook', 'Server', 'Dishwasher', 'Barista', 'Kitchen helper'],
    groups: [
      {
        title: 'What the work is really like',
        items: [
          alisProfile('Cook', 'Kitchen duties, wages, outlook, and the difference between cook and chef.', 'cook'),
          alisProfile('Food and beverage server', 'Serving work, tips, and what a shift looks like.', 'food-and-beverage-server'),
          alisProfile('Bartender', 'Serving alcohol, licences and late shifts.', 'bartender'),
        ],
      },
      {
        title: 'Certificates employers ask for',
        note: 'Food safety and ProServe both charge a course fee — check the current price on the official page.',
        items: [
          {
            title: 'Food safety training — Alberta Health Services',
            description: 'The food safety certification Alberta restaurants require, and where to take it.',
            url: 'https://www.albertahealthservices.ca/eph/page3151.aspx',
            tag: 'Certificate',
          },
          {
            title: 'ProServe liquor staff training — AGLC',
            description: 'Required to serve or sell alcohol in Alberta. Official AGLC course.',
            url: 'https://aglc.ca/training/proserve-liquor-staff-training',
            tag: 'Certificate',
          },
        ],
      },
      {
        title: 'Free training to get hired',
        items: [
          courseSearch('Cooking courses', 'Free short courses on kitchen basics and food preparation.', 'cooking'),
          courseSearch('Hospitality courses', 'Free courses on hospitality service and guest care.', 'hospitality'),
        ],
      },
      {
        title: 'Who is hiring now',
        items: [
          openings('Cook openings — Job Bank', 'Kitchen jobs, from dishwasher up to line cook.', 'cook'),
          openings('Server openings — Job Bank', 'Serving and front-of-house jobs.', 'server'),
        ],
      },
    ],
  },
  {
    value: 'healthcare',
    label: "Healthcare & Seniors' Care",
    blurb:
      "Health care aide is one of the steadiest entry-level jobs in Alberta — a short college certificate, then you're working. Medical office, dental and pharmacy assistant are the other three common doors.",
    entryRoles: ['Health care aide', 'Medical office assistant', 'Dental assistant', 'Pharmacy assistant'],
    groups: [
      {
        title: 'What the work is really like',
        items: [
          alisProfile('Health care aide', 'Personal care in continuing care — duties, wages and the certificate you need.', 'health-care-aide'),
          alisProfile('Medical office assistant', 'Front desk, booking and records in a clinic.', 'medical-office-assistant'),
          alisProfile('Dental assistant', 'Chairside assisting, and the accredited program that leads to it.', 'dental-assistant'),
          alisProfile('Pharmacy assistant', 'Dispensing support in a pharmacy, and how people get in.', 'pharmacy-assistant'),
        ],
      },
      {
        title: 'Where the jobs are posted',
        items: [
          {
            title: 'Alberta Health Services — careers',
            description: 'The largest healthcare employer in the province; postings and how to apply.',
            url: 'https://www.albertahealthservices.ca/careers/',
            tag: 'Employer',
          },
          openings('Health care aide openings — Job Bank', 'Aide and support-worker jobs across the province.', 'health+care+aide'),
        ],
      },
      {
        title: 'Free training before you commit',
        items: [
          courseSearch('Health care courses', 'Free introductory courses on care, safety and the body — a good look before paying for a certificate.', 'health+care'),
          {
            title: 'Safe work in healthcare — CCOHS',
            description: 'Free guidance on infection control, lifting and workplace hazards in care settings.',
            url: 'https://www.ccohs.ca/education/',
            tag: 'Free info',
          },
        ],
      },
    ],
  },
  {
    value: 'trades',
    label: 'Trades & Construction',
    blurb:
      'Labourer and helper jobs get you on site with no ticket. Apprenticeship is how you get paid while you learn a trade — and it starts with being hired by a sponsor.',
    entryRoles: ['Construction labourer', 'Carpenter helper', 'Apprentice carpenter', 'Apprentice electrician'],
    groups: [
      {
        title: 'What the work is really like',
        items: [
          alisProfile('Carpenter', 'Duties, wages, apprenticeship and certification.', 'carpenter'),
          alisProfile('Electrician', 'How the apprenticeship works and what it pays.', 'electrician'),
          alisProfile('Heavy equipment operator', 'Machine work, tickets and wages.', 'heavy-equipment-operator'),
        ],
      },
      {
        title: 'Apprenticeship and safety',
        items: [
          {
            title: 'Trades and apprenticeship — Alberta',
            description: 'How registered apprenticeship works, what trades exist, and how to find a sponsor.',
            url: 'https://www.alberta.ca/trades',
            tag: 'Official',
          },
          {
            title: 'WHMIS and hazardous materials — CCOHS',
            description: 'What WHMIS is and why every construction site requires it.',
            url: 'https://www.ccohs.ca/oshanswers/chemicals/whmis_ghs/',
            tag: 'Free info',
          },
          {
            title: 'Young worker safety — Alberta',
            description: 'Your rights and your employer duties on a job site.',
            url: 'https://www.alberta.ca/young-workers',
            tag: 'Free info',
          },
        ],
      },
      {
        title: 'Free training to get hired',
        items: [courseSearch('Trades courses', 'Free short courses on tools, measurement and site safety.', 'trades')],
      },
      {
        title: 'Who is hiring now',
        items: [
          openings('General labourer openings — Job Bank', 'Entry site work — the usual way into the trades.', 'general+labourer'),
          openings('Apprentice openings — Job Bank', 'Postings that will take an apprentice.', 'apprentice'),
        ],
      },
    ],
  },
  {
    value: 'warehouse',
    label: 'Warehouse, Logistics & Driving',
    blurb:
      'Picking and packing, shipping and receiving, forklift, delivery and driving. Many of these hire with no experience and train you on the equipment.',
    entryRoles: ['Warehouse worker', 'Shipper / receiver', 'Delivery driver', 'Truck driver'],
    groups: [
      {
        title: 'What the work is really like',
        items: [
          alisProfile('Truck driver', 'Licences, long haul versus local, and what it pays.', 'truck-driver'),
          alisProfile('Bus driver', 'Transit, school and charter driving, and the licence you need.', 'bus-driver'),
          alisProfile('Heavy equipment operator', 'Forklift and machine work, and the tickets involved.', 'heavy-equipment-operator'),
        ],
      },
      {
        title: 'Licences and free training',
        items: [
          {
            title: 'Get a driver’s licence — Alberta',
            description: 'Class 5 and beyond: what each class allows and how to book the test.',
            url: 'https://www.alberta.ca/get-drivers-licence',
            tag: 'Official',
          },
          courseSearch('Warehouse courses', 'Free courses on stock handling, inventory and warehouse safety.', 'warehouse'),
          courseSearch('Logistics courses', 'Free courses on supply chains and moving goods.', 'logistics'),
        ],
      },
      {
        title: 'Who is hiring now',
        items: [
          openings('Warehouse openings — Job Bank', 'Picking, packing and shipping jobs.', 'warehouse'),
          openings('General labourer openings — Job Bank', 'Yard, dock and loading work.', 'general+labourer'),
        ],
      },
    ],
  },
  {
    value: 'office',
    label: 'Office & Administration',
    blurb:
      'Receptionist, office assistant, accounting clerk — the entry path for anyone comfortable with a computer. Typing speed and Excel are what get hired.',
    entryRoles: ['Receptionist', 'Administrative assistant', 'Accounting technician', 'Data entry'],
    groups: [
      {
        title: 'What the work is really like',
        items: [
          alisProfile('Administrative assistant', 'Duties, wages, and the office software employers expect.', 'administrative-assistant'),
          alisProfile('Receptionist', 'Front desk work and the people skills it needs.', 'receptionist'),
          alisProfile('Accounting technician', 'Bookkeeping and payroll work, and the certificate route.', 'accounting-technician'),
        ],
      },
      {
        title: 'Free training to get hired',
        items: [
          {
            title: 'Typing practice — Keybr',
            description: 'Build the speed most office postings ask for.',
            url: 'https://www.keybr.com',
            tag: 'Free',
            entryLevel: true,
          },
          {
            title: 'Microsoft Learn',
            description: 'Free Excel, Word, Outlook and Teams training straight from Microsoft.',
            url: 'https://learn.microsoft.com/en-us/training/',
            tag: 'Free training',
            entryLevel: true,
          },
          {
            title: 'GCFGlobal',
            description: 'Free lessons on computers, Word, Excel and everyday job skills.',
            url: 'https://edu.gcfglobal.org/en/',
            tag: 'Free',
            entryLevel: true,
          },
          courseSearch('Office administration courses', 'Free short courses on office systems and admin tasks.', 'office+administration'),
        ],
      },
      {
        title: 'Who is hiring now',
        items: [
          openings('Administrative assistant openings — Job Bank', 'Office and admin support jobs.', 'administrative+assistant'),
          openings('Receptionist openings — Job Bank', 'Front desk and phone work.', 'receptionist'),
        ],
      },
    ],
  },
  {
    value: 'childcare',
    label: 'Childcare & Education Support',
    blurb:
      'Childcare is hiring across Alberta. Certification has three levels, and Level 1 can be earned with a short online course — you can often start working while you do it.',
    entryRoles: ['Child care assistant', 'Early childhood educator', 'Educational assistant'],
    groups: [
      {
        title: 'What the work is really like',
        items: [
          alisProfile('Early childhood educator', 'Duties, wages, and the three certification levels.', 'early-childhood-educator'),
          alisProfile('Educational assistant', 'Support work in schools, and how school boards hire.', 'educational-assistant'),
        ],
      },
      {
        title: 'Certification — the official route',
        items: [
          {
            title: 'Apply for childcare certification — Alberta',
            description: 'Levels, requirements, the online Level 1 course and how to apply.',
            url: 'https://www.alberta.ca/apply-for-certification',
            tag: 'Official',
          },
          {
            title: 'Childcare for early childhood educators',
            description: 'Certification, the ECE lookup, and working in a licensed program.',
            url: 'https://www.alberta.ca/childcare-for-early-childhood-educators',
            tag: 'Official',
          },
        ],
      },
      {
        title: 'Free training and openings',
        items: [
          courseSearch('Childcare courses', 'Free short courses on child development and caring for children.', 'childcare'),
          openings('Childcare openings — Job Bank', 'Assistant and educator jobs across the province.', 'childcare'),
        ],
      },
    ],
  },
  {
    value: 'cleaning',
    label: 'Cleaning & Facilities',
    blurb:
      'Custodial and cleaning work hires quickly, often evenings or weekends, and needs no certificate. Good first job and a reliable second income.',
    entryRoles: ['Custodian', 'Light duty cleaner', 'Janitor', 'Building services'],
    groups: [
      {
        title: 'What the work is really like',
        items: [alisProfile('Custodian', 'Building cleaning and upkeep — duties, shifts and wages.', 'custodian')],
      },
      {
        title: 'Safety and free training',
        items: [
          {
            title: 'Cleaning chemicals and WHMIS — CCOHS',
            description: 'Safe handling of the chemicals used on the job — employers expect this knowledge.',
            url: 'https://www.ccohs.ca/oshanswers/chemicals/whmis_ghs/',
            tag: 'Free info',
          },
          courseSearch('Cleaning courses', 'Free short courses on cleaning practice and workplace safety.', 'cleaning'),
        ],
      },
      {
        title: 'Who is hiring now',
        items: [
          openings('Cleaner openings — Job Bank', 'Cleaning and janitorial jobs, including part-time.', 'cleaner'),
          openings('Custodian openings — Job Bank', 'Schools, hospitals and building services.', 'custodian'),
        ],
      },
    ],
  },
  {
    value: 'security',
    label: 'Security',
    blurb:
      'Security work in Alberta needs a licence: an approved training course, a criminal record check and a licence fee. Once licensed, shifts are steady and often overnight.',
    entryRoles: ['Security guard', 'Concierge', 'Event security'],
    groups: [
      {
        title: 'What the work is really like',
        items: [alisProfile('Security guard', 'Duties, wages, shifts and the licence requirement.', 'security-guard')],
      },
      {
        title: 'Licensing — the official route',
        items: [
          {
            title: 'Security service worker licence — Alberta',
            description: 'The approved training course, record check, fee and how to apply.',
            url: 'https://www.alberta.ca/security-service-worker-licence',
            tag: 'Official',
          },
          courseSearch('Security courses', 'Free short courses on site security and conflict awareness.', 'security'),
        ],
      },
      {
        title: 'Who is hiring now',
        items: [openings('Security guard openings — Job Bank', 'Guard and concierge postings, many part-time or overnight.', 'security+guard')],
      },
    ],
  },
  {
    value: 'agriculture',
    label: 'Agriculture & Outdoor Work',
    blurb:
      'Farm, greenhouse and grounds work — seasonal and hands-on, and usually happy to train someone who shows up reliably. A driver’s licence matters more than experience here.',
    entryRoles: ['Farm labourer', 'Greenhouse worker', 'Groundskeeper', 'Equipment operator'],
    groups: [
      {
        title: 'Info and licences',
        items: [
          {
            title: 'Agriculture in Alberta',
            description: 'Sectors, seasons and the programs that support agricultural workers.',
            url: 'https://www.alberta.ca/agriculture',
            tag: 'Official',
            entryLevel: true,
          },
          {
            title: 'Get a driver’s licence — Alberta',
            description: 'Most outdoor work expects a Class 5 licence.',
            url: 'https://www.alberta.ca/get-drivers-licence',
            tag: 'Official',
          },
        ],
      },
      {
        title: 'Free training and openings',
        items: [
          courseSearch('Agriculture courses', 'Free short courses on farming and food production.', 'agriculture'),
          openings('Farm openings — Job Bank', 'Farm, greenhouse and harvest work.', 'farm'),
        ],
      },
    ],
  },
];

// ── Main sections ──────────────────────────────────────────────────────────
export const RESOURCE_SECTIONS = [
  {
    value: 'entry_level',
    label: 'Entry Level',
    blurb:
      'Start here if you have little or no work experience, or no certificates yet. Everything on this tab is free and can be done from a Job Lab computer.',
    groups: [
      {
        title: 'Start with the basics',
        note: 'If a computer is the hard part, these come first — no sign-in needed.',
        items: [
          {
            title: 'Computer basics — GCFGlobal',
            description: 'Using a mouse and keyboard, files and folders, the internet — step by step.',
            url: 'https://edu.gcfglobal.org/en/',
            tag: 'Free course',
            entryLevel: true,
          },
          {
            title: 'DigitalLearn',
            description: 'Short free courses on computers, email and staying safe online.',
            url: 'https://www.digitallearn.org',
            tag: 'Free course',
            entryLevel: true,
          },
          {
            title: 'Typing practice — Keybr',
            description: 'Build typing speed — the one skill most office postings ask about.',
            url: 'https://www.keybr.com',
            tag: 'Free practice',
            entryLevel: true,
          },
          {
            title: 'Khan Academy',
            description: 'Free math, reading and grammar lessons at your own level.',
            url: 'https://www.khanacademy.org',
            tag: 'Free course',
            entryLevel: true,
          },
        ],
      },
      {
        title: 'Free certificates that help on any resume',
        items: [
          {
            title: 'WHMIS and hazardous materials — CCOHS',
            description: 'What WHMIS is and what it covers. Most entry-level workplaces require it.',
            url: 'https://www.ccohs.ca/oshanswers/chemicals/whmis_ghs/',
            tag: 'Free info',
            entryLevel: true,
          },
          {
            title: 'Workplace safety courses — CCOHS',
            description: 'Free and low-cost safety courses employers recognize, including WHMIS.',
            url: 'https://www.ccohs.ca/education/',
            tag: 'Free & paid',
            entryLevel: true,
          },
          {
            title: 'IBM SkillsBuild',
            description: 'Free courses and digital credentials in workplace and tech skills.',
            url: 'https://skillsbuild.org/',
            tag: 'Free credential',
            entryLevel: true,
          },
          {
            title: 'HP LIFE',
            description: 'Short free business and IT courses, each with a certificate.',
            url: 'https://www.life-global.org/',
            tag: 'Free certificate',
            entryLevel: true,
          },
        ],
      },
      {
        title: 'Know your rights at work',
        note: 'Worth reading before a first shift — these are the rules that protect you.',
        items: [
          {
            title: 'Young worker safety — Alberta',
            description: 'Your rights, your employer’s duties, and jobs you are not allowed to do under 18.',
            url: 'https://www.alberta.ca/young-workers',
            tag: 'Official',
            entryLevel: true,
          },
          {
            title: 'Occupational health and safety — Alberta',
            description: 'The right to refuse unsafe work, and how to report a problem.',
            url: 'https://www.alberta.ca/ohs',
            tag: 'Official',
            entryLevel: true,
          },
          {
            title: 'Employment standards — Alberta',
            description: 'Hours, breaks, overtime, days off and what an employer must give you.',
            url: 'https://www.alberta.ca/employment-standards',
            tag: 'Official',
            entryLevel: true,
          },
          {
            title: 'Minimum wage — Alberta',
            description: 'The current minimum wage, including the student rate.',
            url: 'https://www.alberta.ca/minimum-wage',
            tag: 'Official',
            entryLevel: true,
          },
        ],
      },
      {
        title: 'Find a first job',
        items: [
          {
            title: 'Job Bank — all openings',
            description: 'The Government of Canada job board. Filter by city, part-time and no experience.',
            url: 'https://www.jobbank.gc.ca/jobsearch/',
            tag: 'Job Bank',
            entryLevel: true,
          },
          openings('General labourer openings — Job Bank', 'The classic no-experience start: yards, sites, moving and cleaning.', 'general+labourer'),
          {
            title: 'ALIS — Look for work',
            description: 'Alberta’s own guide to finding work, applying and getting hired.',
            url: 'https://alis.alberta.ca/look-for-work/',
            tag: 'Guide',
            entryLevel: true,
          },
          {
            title: 'What employers look for in an application',
            description: 'What gets an application read when you have no experience to list.',
            url: 'https://alis.alberta.ca/look-for-work/apply-for-work/what-employers-are-looking-for-in-a-job-application/',
            tag: 'Guide',
            entryLevel: true,
          },
        ],
      },
    ],
  },
  {
    value: 'industries',
    label: 'By Industry',
    blurb:
      'Pick the kind of workplace you want. Each one has what the job is really like, the free training and certificates that get you hired, and who is hiring now.',
    industries: INDUSTRY_TRACKS,
  },
  {
    value: 'certificates',
    label: 'Free Certificates',
    blurb: 'Free courses that end in a certificate or digital credential you can put on a resume.',
    groups: [
      {
        title: 'Free certificates and credentials',
        items: [
          {
            title: 'Google Skillshop',
            description: 'Free Google courses and certifications in digital marketing, analytics and ads.',
            url: 'https://skillshop.withgoogle.com/',
            tag: 'Free certificate',
          },
          {
            title: 'freeCodeCamp',
            description: 'Free, self-paced coding certifications — web development, data and more.',
            url: 'https://www.freecodecamp.org/learn',
            tag: 'Free certificate',
          },
          {
            title: 'Cisco Skills for All',
            description: 'Free IT, networking and cybersecurity courses that earn digital badges.',
            url: 'https://skillsforall.com/',
            tag: 'Free certificate',
          },
          {
            title: 'IBM SkillsBuild',
            description: 'Free courses and digital credentials in tech and workplace skills.',
            url: 'https://skillsbuild.org/',
            tag: 'Free credential',
          },
          {
            title: 'HP LIFE',
            description: 'Free short business and IT courses, each with a certificate of completion.',
            url: 'https://www.life-global.org/',
            tag: 'Free certificate',
          },
          {
            title: 'Microsoft Learn',
            description: 'Free self-paced training for Microsoft 365, Excel and cloud skills, with badges.',
            url: 'https://learn.microsoft.com/en-us/training/',
            tag: 'Free training',
          },
        ],
      },
    ],
  },
  {
    value: 'training',
    label: 'Free Training',
    blurb: 'Free courses that build the skills employers ask about — computers, math, typing and workplace safety.',
    groups: [
      {
        title: 'Everyday and workplace skills',
        items: [
          {
            title: 'GCFGlobal',
            description: 'Free lessons on computers, Word, Excel and everyday job skills.',
            url: 'https://edu.gcfglobal.org/en/',
            tag: 'Free',
          },
          {
            title: 'DigitalLearn',
            description: 'Short free courses on using a computer, email and the internet safely.',
            url: 'https://www.digitallearn.org',
            tag: 'Free',
          },
          {
            title: 'Khan Academy',
            description: 'Free lessons in math, reading, grammar and life skills.',
            url: 'https://www.khanacademy.org',
            tag: 'Free',
          },
          {
            title: 'Keybr Typing Practice',
            description: 'Free typing practice that builds speed and accuracy for work.',
            url: 'https://www.keybr.com',
            tag: 'Free',
          },
          {
            title: 'Alison — free short courses',
            description: 'Hundreds of free short courses, from customer service to healthcare and trades.',
            url: 'https://alison.com/',
            tag: 'Free course',
          },
          {
            title: 'CCOHS — workplace safety education',
            description: 'Free and low-cost safety courses, including WHMIS, for most workplaces.',
            url: 'https://www.ccohs.ca/education/',
            tag: 'Free & paid',
          },
        ],
      },
    ],
  },
  {
    value: 'videos',
    label: 'Training Videos',
    blurb: 'Follow-along video, if you learn better by watching someone do it.',
    groups: [
      {
        title: 'Training videos',
        items: [
          {
            title: 'Microsoft 365 — YouTube',
            description: 'Official video tutorials for Word, Excel, Outlook and Teams.',
            url: 'https://www.youtube.com/@Microsoft365',
            tag: 'YouTube',
          },
          {
            title: 'Kevin Stratvert — YouTube',
            description: 'Popular step-by-step tutorials for Excel, Word and PowerPoint.',
            url: 'https://www.youtube.com/@KevinStratvert',
            tag: 'YouTube',
          },
          {
            title: 'LearnFree — YouTube',
            description: 'Short, friendly videos on computer basics, email and job skills.',
            url: 'https://www.youtube.com/@LearnFree',
            tag: 'YouTube',
          },
          {
            title: 'freeCodeCamp — YouTube',
            description: 'Full-length free coding courses you can follow at your own pace.',
            url: 'https://www.youtube.com/@freeCodeCamp',
            tag: 'YouTube',
          },
          {
            title: 'Indeed — YouTube',
            description: 'Job search, resume and interview advice from Indeed’s career experts.',
            url: 'https://www.youtube.com/@Indeed',
            tag: 'YouTube',
          },
          {
            title: 'Grow with Google — YouTube',
            description: 'Free career and digital-skills workshops and talks.',
            url: 'https://www.youtube.com/@GrowWithGoogle',
            tag: 'YouTube',
          },
        ],
      },
    ],
  },
  {
    value: 'job_search',
    label: 'Job Search',
    blurb: 'Where the openings actually are, and how to read the market before you apply.',
    groups: [
      {
        title: 'Job boards and tools',
        items: [
          {
            title: 'Job Bank — Job Search',
            description: 'Search government job listings across Canada.',
            url: 'https://www.jobbank.gc.ca/jobsearch/',
            tag: 'Free',
          },
          {
            title: 'ALIS — Look for Work',
            description: 'Job search, applications and workplace advice for Albertans.',
            url: 'https://alis.alberta.ca/look-for-work/',
            tag: 'Free',
          },
          {
            title: 'ALIS — Find Work',
            description: 'Where to look, how to contact employers and staying organized.',
            url: 'https://alis.alberta.ca/look-for-work/find-work/',
            tag: 'Guide',
          },
          {
            title: 'ALIS — Job Banks',
            description: 'A list of job boards and work search tools worth checking.',
            url: 'https://alis.alberta.ca/look-for-work/job-banks/',
            tag: 'Guide',
          },
        ],
      },
      {
        title: 'Know the market',
        items: [
          {
            title: 'OCCinfo — Occupations in Alberta',
            description: 'Wages, outlook and requirements for over 550 jobs, filterable by industry.',
            url: 'https://alis.alberta.ca/occinfo/occupations-in-alberta/',
            tag: 'Free',
          },
          {
            title: 'Job Bank — Labour Market Trends',
            description: 'Wages and demand by job and region, so you know what pays.',
            url: 'https://www.jobbank.gc.ca/trend-analysis',
            tag: 'Free',
          },
          {
            title: 'Job Bank — Industry profiles',
            description: 'What is happening inside a specific industry, province by province.',
            url: 'https://www.jobbank.gc.ca/trend-analysis/job-market-reports/sectoral-profile',
            tag: 'Free',
          },
        ],
      },
    ],
  },
  {
    value: 'resumes',
    label: 'Resumes',
    blurb: 'A Canadian-style resume, plus the cover letters and application habits that get it read.',
    groups: [
      {
        title: 'Resumes and applications',
        items: [
          {
            title: 'ALIS — Resumes and References',
            description: 'Build a Canadian-style resume and choose your references.',
            url: 'https://alis.alberta.ca/look-for-work/resumes-and-references/',
            tag: 'Guide',
          },
          {
            title: 'ALIS — Cover Letters',
            description: 'Write a cover letter for the job you actually want.',
            url: 'https://alis.alberta.ca/look-for-work/cover-letters/',
            tag: 'Guide',
          },
          {
            title: 'ALIS — Apply for Work',
            description: 'Applications, online forms and how to send your resume package.',
            url: 'https://alis.alberta.ca/look-for-work/apply-for-work/',
            tag: 'Guide',
          },
          {
            title: 'What Employers Look for in an Application',
            description: 'What gets an application read — and what gets it passed over.',
            url: 'https://alis.alberta.ca/look-for-work/apply-for-work/what-employers-are-looking-for-in-a-job-application/',
            tag: 'Guide',
          },
        ],
      },
    ],
  },
  {
    value: 'interviews',
    label: 'Interviews',
    blurb: 'How interviews work here, what to prepare, and how to handle an offer.',
    groups: [
      {
        title: 'Interview preparation',
        items: [
          {
            title: 'ALIS — Interviews and Offers',
            description: 'How interviews work, what to prepare and how to handle an offer.',
            url: 'https://alis.alberta.ca/look-for-work/interviews-and-offers/',
            tag: 'Guide',
          },
          {
            title: 'How to Answer Common Interview Questions',
            description: 'Prepare clear answers to the questions employers actually ask.',
            url: 'https://alis.alberta.ca/look-for-work/interviews-and-offers/how-to-answer-common-interview-questions/',
            tag: 'Guide',
          },
          {
            title: 'Phone and Online Interviews',
            description: 'Set up and present well when the interview happens on a call or screen.',
            url: 'https://alis.alberta.ca/look-for-work/interviews-and-offers/how-to-ace-your-phone-or-online-interview/',
            tag: 'Guide',
          },
          {
            title: 'Indeed — Interview Advice',
            description: 'Free articles on interview preparation and follow-up.',
            url: 'https://www.indeed.com/career-advice/interviewing',
            tag: 'Free',
          },
        ],
      },
    ],
  },
  {
    value: 'career_planning',
    label: 'Career Planning',
    blurb: 'Choosing a direction, and what it takes to get there from where you are now.',
    groups: [
      {
        title: 'Plan a direction',
        items: [
          {
            title: 'ALIS CareerInsite',
            description: 'Free assessments and planning tools to choose a direction.',
            url: 'https://alis.alberta.ca/careerinsite/',
            tag: 'Free',
          },
          {
            title: 'OCCinfo — Occupations in Alberta',
            description: 'Wages, outlook and education for over 550 jobs — filter by industry or education level.',
            url: 'https://alis.alberta.ca/occinfo/occupations-in-alberta/',
            tag: 'Free',
          },
          {
            title: 'ALIS — Explore Education and Training',
            description: 'Programs, funding and upgrading options in Alberta.',
            url: 'https://alis.alberta.ca/explore-education-and-training/',
            tag: 'Free',
          },
          {
            title: 'ALIS — Networking',
            description: 'How to build contacts who can point you to work.',
            url: 'https://alis.alberta.ca/look-for-work/networking/',
            tag: 'Guide',
          },
          {
            title: 'ALIS — Stay Organized in Your Job Search',
            description: 'Keep track of applications, contacts and follow-ups.',
            url: 'https://alis.alberta.ca/look-for-work/find-work/stay-organized-as-you-search-for-work/',
            tag: 'Guide',
          },
          {
            title: 'ALIS — Employment and Training Services Directory',
            description: 'Free local Alberta services for job search and training help.',
            url: 'https://alis.alberta.ca/look-for-work/employment-and-training-services-directory/',
            tag: 'Free',
          },
        ],
      },
    ],
  },
];