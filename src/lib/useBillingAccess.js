import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useBillingAccess() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['billing-access-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: employee, isLoading: employeeLoading } = useQuery({
    queryKey: ['billing-access-employee', user?.email],
    queryFn: async () => {
      const results = await base44.entities.Employee.filter({ email: user.email });
      return results[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = user?.role === 'admin';
  const isFinance = employee?.department === 'Finance';
  const isED = employee?.org_tier === 'executive_director';
  const hasBillingToggle = employee?.can_access_billing === true;

  const canAccessBilling = !!(isAdmin || isFinance || isED || hasBillingToggle);

  return { canAccessBilling, isLoading: userLoading || (!!user?.email && employeeLoading && !employee) };
}