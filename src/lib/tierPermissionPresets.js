/**
 * Default portal access presets per org tier.
 * Each entry maps an org_tier value to an array of portal module keys.
 * These are applied automatically when a new employee is created.
 * Admins can customise these presets from the Users & Access page.
 */

export const PORTAL_MODULES = [
  { id: 'nexushr',      label: 'NexusHR',                    route: '/nexushr' },
  { id: 'pathways',     label: 'Pathways Case Mgmt',         route: '/pathways' },
  { id: 'grants',       label: 'Grants & Proposals',         route: '/grants' },
  { id: 'volunteermgr', label: 'Volunteer Manager',          route: '/volunteermgr' },
  { id: 'eventsmgr',   label: 'Events / Programs / Projects',route: '/eventsmgr' },
  { id: 'marketing',   label: 'Marketing & Fundraising',     route: '/marketing' },
  { id: 'reporting',   label: 'Reports Portal',              route: '/reporting' },
  { id: 'filemanager', label: 'File Manager',                route: '/filemanager' },
  { id: 'food',        label: 'Food Services',               route: '/food' },
];

/**
 * Default module access per tier (true = allowed by default).
 * NOTE: The Executive Director portal ('/ed') is admin-only and NOT grantable
 * through the employee access system. The Board portal ('/board') is restricted
 * to active board members and admins — also not grantable here.
 */
export const TIER_PRESETS = {
  executive_director: ['nexushr','grants','volunteermgr','eventsmgr','marketing','reporting','filemanager','food'],
  director:           ['nexushr','grants','volunteermgr','eventsmgr','marketing','reporting','filemanager','food'],
  manager:            ['nexushr','volunteermgr','eventsmgr','reporting','filemanager','food'],
  supervisor_team_lead: ['volunteermgr','eventsmgr','filemanager'],
  frontline:          ['filemanager'],
  assistant:          ['filemanager'],
};

export const TIER_LABELS = {
  executive_director:   'Executive Director',
  director:             'Director',
  manager:              'Manager',
  supervisor_team_lead: 'Supervisor / Team Lead',
  frontline:            'Frontline Worker',
  assistant:            'Assistant',
};

/**
 * Build AccessPermission records for a given org tier + user id.
 * Returns an array of objects ready to pass to AccessPermission.create().
 */
export function buildPresetsForTier(tier, userId) {
  const allowed = TIER_PRESETS[tier] || [];
  return PORTAL_MODULES.map(mod => ({
    target_type: 'module',
    target_id:   mod.id,
    scope_type:  'individual',
    scope_value: userId,
    permission:  allowed.includes(mod.id) ? 'allow' : 'deny',
    is_active:   true,
  }));
}