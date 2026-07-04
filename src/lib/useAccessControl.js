import { useMemo } from 'react';
import { LOCKED_PORTAL_ACCESS } from '@/lib/tierPermissionPresets';

const ADMIN_ROLES = ['super_admin', 'executive_director', 'admin'];

const ROLE_HIERARCHY = {
  super_admin: 7,
  executive_director: 6,
  manager: 5,
  team_lead: 4,
  frontline_staff: 3,
  board: 2,
  extended: 1,
};

export function useAccessControl(user, permissions = [], orgTier = null, tierPortalAccess = {}) {
  const helpers = useMemo(() => {
    const userRole = user?.role || 'frontline_staff';
    const userId = user?.id;
    const userEmail = user?.email;
    const userDeptId = user?.department_id;

    const isAdmin = ADMIN_ROLES.includes(userRole);
    const isSuperAdmin = userRole === 'super_admin' || userRole === 'admin';

    function canAccessModule(moduleId) {
      if (isAdmin) return true;

      // 1. Individual override (allow or deny)
      const individual = permissions.find(p =>
        p.target_type === 'module' &&
        p.target_id === moduleId &&
        p.scope_type === 'individual' &&
        (p.scope_value === userId || p.scope_value === userEmail) &&
        p.is_active
      );
      if (individual) return individual.permission === 'allow';

      // 2. Locked portal (e.g. ED portal always allowed for executive_director tier)
      if (LOCKED_PORTAL_ACCESS[moduleId] === orgTier) return true;

      // 3. Tier-based access from OrgSettings
      if (orgTier && tierPortalAccess?.[orgTier]?.includes(moduleId)) return true;

      return false;
    }

    function canAccessCard(card) {
      if (!card?.is_enabled) return false;
      if (isSuperAdmin) return true;

      const individualOverride = permissions.find(
        p => p.target_type === 'portal_card' &&
          p.target_id === card.id &&
          p.scope_type === 'individual' &&
          p.scope_value === userId &&
          p.is_active
      );
      if (individualOverride) return individualOverride.permission === 'allow';

      if (userDeptId) {
        const deptPermission = permissions.find(
          p => p.target_type === 'portal_card' &&
            p.target_id === card.id &&
            p.scope_type === 'department' &&
            p.scope_value === userDeptId &&
            p.is_active
        );
        if (deptPermission) return deptPermission.permission === 'allow';
      }

      if (card.allowed_roles && card.allowed_roles.length > 0) {
        return card.allowed_roles.includes(userRole);
      }

      const rolePermission = permissions.find(
        p => p.target_type === 'portal_card' &&
          p.target_id === card.id &&
          p.scope_type === 'role' &&
          p.scope_value === userRole &&
          p.is_active
      );
      if (rolePermission) return rolePermission.permission === 'allow';

      if (isAdmin) return true;
      return (!card.allowed_roles || card.allowed_roles.length === 0);
    }

    return { isAdmin, isSuperAdmin, canAccessCard, canAccessModule, userRole, orgTier, ROLE_HIERARCHY };
  }, [user, permissions, orgTier, tierPortalAccess]);

  return helpers;
}

export { ADMIN_ROLES, ROLE_HIERARCHY };