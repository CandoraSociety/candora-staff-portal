// External resource library shown on the Resources tab. Every card opens in a
// new tab — nothing here is mirrored inside the app.
export const RESOURCE_TABS = [
  {
    value: 'job_search',
    label: 'Job Search',
    items: [
      { title: 'ALIS Alberta – Look for Work', description: 'Job search, applications and workplace advice for Albertans.', url: 'https://alis.alberta.ca/look-for-work/' },
      { title: 'Job Bank Canada', description: 'Search government listings across Canada.', url: 'https://www.jobbank.gc.ca' },
      { title: 'WorkBC Career Guide', description: 'Step-by-step career planning and job search guidance.', url: 'https://www.workbc.ca/plan-career', tag: 'Guide' },
      { title: 'Canada Job Search Tips', description: 'Practical tips for finding work in Canada.', url: 'https://www.jobbank.gc.ca/findajob/resources' },
    ],
  },
  {
    value: 'interviews',
    label: 'Interviews',
    items: [
      { title: 'Common Interview Questions', description: 'What employers ask, and how to prepare an answer.', url: 'https://www.jobbank.gc.ca/findajob/resources/prepare-for-an-interview' },
      { title: 'STAR Method Guide', description: 'Answer behavioural questions with Situation, Task, Action, Result.', url: 'https://www.jobbank.gc.ca/findajob/resources/prepare-for-an-interview', tag: 'Guide' },
      { title: 'Virtual Interview Tips', description: 'Set up and present well on a video call.', url: 'https://www.jobbank.gc.ca/findajob/resources/virtual-job-interviews' },
    ],
  },
  {
    value: 'resumes',
    label: 'Resumes',
    items: [
      { title: 'ALIS Resume Writing', description: 'Build a Canadian-style resume that gets read.', url: 'https://alis.alberta.ca/look-for-work/find-and-apply-for-jobs/resumes/' },
      { title: 'Cover Letter Guide', description: 'Write a cover letter for the job you actually want.', url: 'https://alis.alberta.ca/look-for-work/find-and-apply-for-jobs/cover-letters/' },
      { title: 'LinkedIn Profile Tips', description: 'Make your profile work while you search.', url: 'https://www.jobbank.gc.ca/findajob/resources/social-media-job-search' },
    ],
  },
  {
    value: 'training',
    label: 'Training',
    items: [
      { title: 'LinkedIn Learning', description: 'Short courses on business and tech skills.', url: 'https://www.linkedin.com/learning/', tag: 'Paid' },
      { title: 'Coursera', description: 'University-level courses, many free to audit.', url: 'https://www.coursera.org', tag: 'Free / Paid' },
      { title: 'Google Career Certificates', description: 'Job-ready certificates in IT, data and project management.', url: 'https://grow.google/intl/en_ca/certificates/', tag: 'Paid' },
      { title: 'Khan Academy', description: 'Free lessons in math, reading and life skills.', url: 'https://www.khanacademy.org', tag: 'Free' },
      { title: 'Codecademy', description: 'Learn to code with hands-on exercises.', url: 'https://www.codecademy.com', tag: 'Free / Paid' },
      { title: 'Alberta Learning Information', description: 'Education and training programs in Alberta.', url: 'https://alis.alberta.ca/plan-your-education/', tag: 'Free' },
    ],
  },
  {
    value: 'career_planning',
    label: 'Career Planning',
    items: [
      { title: 'ALIS Explore Careers', description: 'Browse occupations, duties and outlooks.', url: 'https://alis.alberta.ca/explore-careers/' },
      { title: 'Career Quizzes', description: 'Work out what fits your interests and strengths.', url: 'https://alis.alberta.ca/explore-careers/know-yourself/' },
      { title: 'NOC System', description: 'The National Occupational Classification — how jobs are catalogued in Canada.', url: 'https://noc.esdc.gc.ca/' },
      { title: 'Labour Market Information', description: 'Wages, demand and outlook by region.', url: 'https://www.jobbank.gc.ca/trend-analysis' },
    ],
  },
];