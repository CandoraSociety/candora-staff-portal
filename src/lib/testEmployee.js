import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useAuth';

// Identity used by the Executive Director's test tabs. Submissions are filed
// under this fake employee so the real approval flows can be exercised safely.
export const TEST_EMPLOYEE = {
  full_name: 'Test Employee',
  email: 'test.employee@candora.test',
};

// Only the Executive Director gets the test tabs. Their own submissions skip
// supervisor routing; the Test Employee's submissions route to them.
export function useExecutiveDirector() {
  const { user } = useCurrentUser();
  const { data: mine = [] } = useQuery({
    queryKey: ['my-employee-record', user?.email],
    queryFn: () => base44.entities.Employee.filter({ email: user.email }),
    enabled: !!user?.email,
  });
  const me = (mine || []).find(e => !e.is_deleted);
  const isExecutiveDirector = me?.org_tier === 'executive_director';
  return {
    isExecutiveDirector,
    supervisor: isExecutiveDirector && user
      ? { email: user.email, name: user.full_name || user.email }
      : null,
  };
}