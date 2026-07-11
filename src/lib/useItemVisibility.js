import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Provides item-level visibility filtering.
 * Non-admin users cannot see items where is_hidden = true.
 * Admins see everything.
 */
export function useItemVisibility() {
  const { data: user } = useQuery({
    queryKey: ['visibility-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = user?.role === 'admin';

  function filterVisible(items = []) {
    if (isAdmin) return items;
    return items.filter(item => !item.is_hidden);
  }

  return { isAdmin, filterVisible };
}