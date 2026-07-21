import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAccessControl } from '@/lib/useAccessControl';
import { useOrgSettings } from '@/lib/useOrgSettings';
import { ShieldOff } from 'lucide-react';

/**
 * Wraps a portal layout — if the user doesn't have access to the given moduleId,
 * shows a denial screen and redirects back to the dashboard after 3s.
 */
export default function ModuleGate({ moduleId, allowAnyOf = [], children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null); // null = loading
  const navigate = useNavigate();
  const { tierPortalAccess, ownerEmail, isLoading: orgSettingsLoading } = useOrgSettings();

  useEffect(() => {
    let mounted = true;

    // Fetch user separately so a permissions failure doesn't lose the user
    base44.auth.me().then(u => {
      if (mounted) setUser(u);
    }).catch(() => {});

    // Fetch permissions separately
    base44.functions.invoke('getMyPermissions', {})
      .then(res => {
        if (mounted) setPermissions(res.data?.permissions || []);
      })
      .catch((err) => {
        console.error('ModuleGate: getMyPermissions failed:', err?.message || err);
        if (mounted) setPermissions([]);
      });

    return () => { mounted = false; };
  }, []);

  // Fetch employee record for org_tier (determines tier-based portal access)
  const { data: employees = [], isLoading: employeeLoading } = useQuery({
    queryKey: ['module-gate-employee', user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.Employee.filter({ email: user.email }),
  });
  const orgTier = employees[0]?.org_tier || null;

  const access = useAccessControl(user, permissions || [], orgTier, tierPortalAccess, ownerEmail);

  // Still loading — wait for permissions, org settings, and employee record
  if (permissions === null || orgSettingsLoading || (user?.email && employeeLoading)) return null;

  // Admin always passes
  if (access.isAdmin) {
    return typeof children === 'function' ? children({ isSupervisorOnly: false }) : children;
  }

  // Check module access — main module OR any alternate (e.g. pathways_supervisor)
  const hasMainAccess = access.canAccessModule(moduleId);
  const hasAlternateAccess = allowAnyOf.some(id => access.canAccessModule(id));

  if (!hasMainAccess && !hasAlternateAccess) {
    return <AccessDeniedScreen onGoHome={() => navigate('/')} />;
  }

  // If user only has alternate access (not main), they're in a restricted mode
  const isSupervisorOnly = !hasMainAccess && hasAlternateAccess;
  return typeof children === 'function' ? children({ isSupervisorOnly }) : children;
}

function AccessDeniedScreen({ onGoHome }) {
  useEffect(() => {
    const t = setTimeout(onGoHome, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 p-8">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <ShieldOff className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Access Restricted</h2>
        <p className="text-gray-500 max-w-xs mx-auto">
          You don't have permission to access this module. Contact your administrator if you believe this is an error.
        </p>
        <p className="text-sm text-gray-400">Redirecting to dashboard…</p>
        <button onClick={onGoHome} className="text-sm text-blue-600 hover:underline">Go now</button>
      </div>
    </div>
  );
}