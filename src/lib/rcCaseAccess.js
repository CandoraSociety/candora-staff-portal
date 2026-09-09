import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Whether the signed-in staff member has permission for Intensive Services
// casework (full FRN workflow access). Granted per caseworker via Manage Portal Users.
export function useIntensiveAccess(user) {
  const email = (user?.email || '').toLowerCase();
  const { data: caseworkers = [], isLoading } = useQuery({
    queryKey: ['rc-caseworkers'],
    queryFn: () => base44.entities.RCCaseworker.list(),
    enabled: !!email,
  });
  const hasAccess = (caseworkers || []).some(
    (cw) => (cw.staff_email || '').toLowerCase() === email && cw.intensive_access === true
  );
  return { hasAccess, isLoading };
}

// Case-insensitive match of a client/case "assigned worker" field against the
// signed-in user's full name or email — used for the My Case Management scope.
export function matchesWorker(value, user) {
  if (!value || !user) return false;
  const v = String(value).trim().toLowerCase();
  if (!v) return false;
  const name = (user.full_name || '').trim().toLowerCase();
  const email = (user.email || '').trim().toLowerCase();
  return (!!name && v === name) || (!!email && v === email);
}