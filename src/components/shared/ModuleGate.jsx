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
export default function ModuleGate({ moduleId, asyncAccessCheck, children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null); // null = loading
  const [asyncResult, setAsyncResult] = useState(null); // null = pending, true/false = resolved
  const navigate = useNavigate();
  const { tierPortalAccess, ownerEmail, isLoading: orgSettingsLoading } = useOrgSettings();

  useEffect(() => {
    let mounted = true;

    base44.auth.me().then(u => {
      if (mounted) setUser(u);
    }).catch(() => {});

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

  const { data: employees = [], isLoading: employeeLoading } = useQuery({
    queryKey: ['module-gate-employee', user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.Employee.filter({ email: user.email }),
  });
  const orgTier = employees[0]?.org_tier || null;

  const access = useAccessControl(user, permissions || [], orgTier, tierPortalAccess, ownerEmail);

  const isLoading = permissions === null || orgSettingsLoading || (user?.email && employeeLoading);
  const hasMainAccess = !isLoading && (access.isAdmin || access.canAccessModule(moduleId));
  const needsAsyncCheck = !isLoading && !hasMainAccess && !!asyncAccessCheck && !!user?.email;

  // Run async access check when user lacks direct module access
  useEffect(() => {
    if (needsAsyncCheck && asyncResult === null) {
      let mounted = true;
      asyncAccessCheck(user)
        .then(result => { if (mounted) setAsyncResult(result); })
        .catch(() => { if (mounted) setAsyncResult(false); });
      return () => { mounted = false; };
    }
  }, [needsAsyncCheck, asyncResult, user, asyncAccessCheck]);

  if (isLoading) return null;

  if (access.isAdmin || hasMainAccess) {
    return typeof children === 'function' ? children({ isSupervisorOnly: false }) : children;
  }

  // Waiting for async check to resolve
  if (needsAsyncCheck && asyncResult === null) return null;

  if (asyncResult === true) {
    return typeof children === 'function' ? children({ isSupervisorOnly: true }) : children;
  }

  return <AccessDeniedScreen onGoHome={() => navigate('/')} />;
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