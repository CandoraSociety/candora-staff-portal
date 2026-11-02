// Curated skill catalogue for the typeahead. Grouped for readability in code
// only — the suggestions themselves are shown as a flat fuzzy list.
export const SKILL_CATALOGUE = [
  // general workplace
  'Microsoft Office', 'Excel', 'Word', 'PowerPoint', 'Outlook', 'Google Workspace',
  'Data Entry', 'Filing', 'Scheduling', 'Customer Service', 'Cash Handling', 'POS Systems',
  'Communication', 'Teamwork', 'Time Management', 'Problem Solving', 'Leadership',
  'Adaptability', 'Multitasking', 'Attention to Detail', 'Critical Thinking', 'Conflict Resolution',
  // trades & labour
  'Forklift Operation', 'Warehouse Management', 'Inventory Control', 'Shipping & Receiving',
  'Heavy Equipment', 'Hand Tools', 'Power Tools', 'Blueprint Reading', 'WHMIS', 'First Aid',
  'Safety Compliance', 'Welding', 'Electrical', 'Plumbing', 'Carpentry', 'Painting',
  // tech
  'JavaScript', 'Python', 'HTML/CSS', 'React', 'SQL', 'Data Analysis', 'Social Media',
  'Graphic Design', 'Adobe Photoshop', 'Canva', 'IT Support', 'Networking', 'Cybersecurity',
  // healthcare & services
  'Patient Care', 'Medical Terminology', 'CPR', 'Food Handling', 'Food Safety', 'Cooking',
  'Cleaning & Sanitation', 'Childcare', 'Elder Care', 'Personal Support',
  // sales & marketing
  'Sales', 'Cold Calling', 'Account Management', 'Marketing', 'Content Writing', 'SEO',
  'Social Media Marketing', 'Event Planning', 'Public Speaking', 'Negotiation',
  // finance & admin
  'Bookkeeping', 'QuickBooks', 'Accounts Payable', 'Accounts Receivable', 'Payroll',
  'Administrative Support', 'Reception', 'Record Keeping', 'Project Management',
];

export function suggestSkills(query, existing = []) {
  const term = String(query || '').trim().toLowerCase();
  if (!term) return [];
  return SKILL_CATALOGUE
    .filter((skill) => skill.toLowerCase().includes(term))
    .filter((skill) => !existing.includes(skill))
    .slice(0, 7);
}

const CURRENT_YEAR = new Date().getFullYear();

export const YEAR_OPTIONS = [
  ...Array.from({ length: 61 }, (_, i) => String(CURRENT_YEAR - i)),
];