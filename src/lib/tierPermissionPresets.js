/**
 * Default portal access presets per position type (org tier).
 * These initialize OrgSettings.tier_configs and tier_portal_access.
 * Admins can customize everything from the Users & Access → Access Presets tab.
 */

// Default position type definitions
export const DEFAULT_TIER_CONFIGS = [
  { id: 'executive_director',   label: 'Executive Director' },
  { id: 'director',             label: 'Director' },
  { id: 'manager',              label: 'Manager' },
  { id: 'supervisor_team_lead', label: 'Supervisor / Team Lead' },
  { id: 'frontline',            label: 'Frontline Worker' },
  { id: 'assistant',            label: 'Assistant' },
];

// Default module access per tier (module IDs each tier can access)
export const DEFAULT_TIER_PORTAL_ACCESS = {
  executive_director:   ['grants','volunteermgr','eventsmgr','marketing','reporting','filemanager','food','ed'],
  director:             ['grants','volunteermgr','eventsmgr','marketing','reporting','filemanager','food'],
  manager:              ['volunteermgr','eventsmgr','reporting','filemanager','food'],
  supervisor_team_lead: ['volunteermgr','eventsmgr','filemanager'],
  frontline:            ['filemanager'],
  assistant:            ['filemanager'],
};

// Portals locked to a specific tier — cannot be toggled in the presets UI.
// module_id -> tier_id that always has access (and only that tier).
export const LOCKED_PORTAL_ACCESS = {
  ed: 'executive_director',
};

// Tiers that cannot be removed from the presets
export const LOCKED_TIER_IDS = ['executive_director'];

// Backward compatibility
export const PORTAL_MODULES = [
  { id: 'nexushr',          label: 'NexusHR',                        route: '/nexushr' },
  { id: 'pathways',         label: 'Pathways Case Mgmt',              route: '/pathways' },
  { id: 'grants',           label: 'Grants & Proposals',              route: '/grants' },
  { id: 'volunteermgr',     label: 'Volunteer Manager',              route: '/volunteermgr' },
  { id: 'eventsmgr',        label: 'Events / Programs / Projects',   route: '/eventsmgr' },
  { id: 'marketing',        label: 'Marketing & Fundraising',        route: '/marketing' },
  { id: 'reporting',        label: 'Reports Portal',                  route: '/reporting' },
  { id: 'filemanager',      label: 'File Manager',                   route: '/filemanager' },
  { id: 'food',             label: 'Food Services',                   route: '/food' },
  { id: 'ed',               label: 'Executive Director Portal',       route: '/ed' },
  { id: 'board',            label: 'Board of Directors',              route: '/board' },
  { id: 'outlook',          label: 'Outlook',                         route: '/outlook' },
  { id: 'lms',              label: 'Learning Management',              route: '/lms' },
  { id: 'community',        label: 'Community Programs',              route: '/community' },
  { id: 'digilit',          label: 'Digital Literacy',                route: '/digilit' },
  { id: 'ell',              label: 'English Language Learning',      route: '/ell' },
  { id: 'empoweru',         label: 'EmpowerU',                        route: '/empoweru' },
  { id: 'rc',               label: 'Resource Centre',                 route: '/rc' },
  { id: 'childminding',     label: 'Childminding',                   route: '/childminding' },
  { id: 'reception',        label: 'Reception',                      route: '/reception' },
  { id: 'phac',             label: 'PHAC Programs',                   route: '/phac' },
  { id: 'frn',              label: 'FRN Programs',                   route: '/frn' },
  { id: 'archives',         label: 'Candora Archives',                route: '/archives' },
  { id: 'winter-wonderland', label: 'Winter Wonderland',              route: '/winter-wonderland' },
];

export const TIER_PRESETS = DEFAULT_TIER_PORTAL_ACCESS;
export const TIER_LABELS = Object.fromEntries(DEFAULT_TIER_CONFIGS.map(t => [t.id, t.label]));

/**
 * @deprecated Tier-based access is now managed via OrgSettings.tier_portal_access.
 * Returns [] — individual overrides can be added manually per-user if needed.
 */
export function buildPresetsForTier() {
  return [];
}