export const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'executive_director', label: 'Executive Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'team_lead', label: 'Team Lead / Supervisor' },
  { value: 'frontline_staff', label: 'Frontline Staff' },
  { value: 'board', label: 'Board Member' },
  { value: 'extended', label: 'Extended (Volunteers, Practicum)' },
];

export const CARD_CATEGORIES = [
  { value: 'operations', label: 'Operations', color: '#2a9d8f' },
  { value: 'finance', label: 'Finance', color: '#e76f51' },
  { value: 'hr', label: 'Human Resources', color: '#264653' },
  { value: 'communications', label: 'Communications', color: '#e9963e' },
  { value: 'reporting', label: 'Reporting & Analytics', color: '#7c3aed' },
  { value: 'administration', label: 'Administration', color: '#0891b2' },
  { value: 'other', label: 'Other', color: '#6b7280' },
];

export const CATEGORY_MAP = Object.fromEntries(CARD_CATEGORIES.map(c => [c.value, c]));