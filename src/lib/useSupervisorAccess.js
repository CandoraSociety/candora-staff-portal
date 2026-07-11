import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Determines the current user's direct reports and HR access level.
 * - Admins/HR admins see everything
 * - Supervisors (employees whose manager_email matches the user's email) see only their direct reports' data
 *   For authored records (reviews, corrective actions, incidents), supervisors see only ones they authored
 */
export function useSupervisorAccess() {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setUserLoading(false);
    }).catch(() => setUserLoading(false));
  }, []);

  const { data: employees = [], isLoading: empLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list('-created_date', 500),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'hr_admin' || user?.role === 'super_admin';

  const directReports = useMemo(() => {
    if (!user?.email) return [];
    return employees.filter(e =>
      !e.is_deleted && e.manager_email?.toLowerCase() === user.email.toLowerCase()
    );
  }, [employees, user]);

  const directReportIds = useMemo(() => directReports.map(e => e.id), [directReports]);

  return {
    user,
    loading: userLoading || empLoading,
    isAdmin,
    employees,
    directReports,
    directReportIds,
    isSupervisor: directReports.length > 0,
    canAccessHR: isAdmin || directReports.length > 0,
  };
}