import { useMemo } from 'react';

const ADMIN_ROLES = ['super_admin', 'executive_director'];

const ROLE_HIERARCHY = {
  super_admin: 7,
  executive_director: 6,
  manager: 5,
  team_lead: 4,
  frontline_staff: 3,
  board: 2,
  extended: 1,
};

export function useAccessControl(user, permissions = []) {
  const helpers = useMemo(() => {
    const userRole = user?.role || 'frontline_staff';
    const userId = user?.id;
    const userDeptId = user?.department_id;

    const isAdmin = ADMIN_ROLES.includes(userRole);
    const isSuperAdmin = userRole === 'super_admin';

    function canAccessCard(card) {
      if (!card?.is_enabled) return false;
      if (isSuperAdmin) return true;

      // Check individual override first
      const individualOverride = permissions.find(
        p => p.target_type === 'portal_card' &&
          p.target_id === card.id &&
          p.scope_type === 'individual' &&
          p.scope_value === userId &&
          p.is_active
      );
      if (individualOverride) return individualOverride.permission === 'allow';

      // Check department permissions
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

      // Check role-based (card's allowed_roles)
      if (card.allowed_roles && card.allowed_roles.length > 0) {
        return card.allowed_roles.includes(userRole);
      }

      // Check role permissions in AccessPermission entity
      const rolePermission = permissions.find(
        p => p.target_type === 'portal_card' &&
          p.target_id === card.id &&
          p.scope_type === 'role' &&
          p.scope_value === userRole &&
          p.is_active
      );
      if (rolePermission) return rolePermission.permission === 'allow';

      // Default: admins can see everything, others see cards with no restrictions
      if (isAdmin) return true;
      return (!card.allowed_roles || card.allowed_roles.length === 0);
    }

    return { isAdmin, isSuperAdmin, canAccessCard, userRole, ROLE_HIERARCHY };
  }, [user, permissions]);

  return helpers;
}

export { ADMIN_ROLES, ROLE_HIERARCHY };