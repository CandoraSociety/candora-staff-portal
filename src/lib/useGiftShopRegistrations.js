import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// One shared source for the Kids Gift Shop registrations, so the registration
// tab, the sign-in tab and the check-in window all read and update the same
// rows. Sign-ins are written to ProgramRegistration, so a live subscription
// refreshes every area the moment a child is signed in anywhere.
export const GIFT_SHOP_REGISTRATIONS_KEY = ['kidsGiftShopRegistrations'];

export function useGiftShopRegistrations() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: GIFT_SHOP_REGISTRATIONS_KEY,
    queryFn: () => base44.entities.ProgramRegistration.filter(
      { program_name: 'Kids Gift Shop' },
      { sort: '-created_date', limit: 500 }
    ).then(res => res.items || []),
  });

  useEffect(() => {
    const unsubscribe = base44.entities.ProgramRegistration.subscribe((event) => {
      if (event?.type === 'delete' || event?.data?.program_name === 'Kids Gift Shop') {
        qc.invalidateQueries({ queryKey: GIFT_SHOP_REGISTRATIONS_KEY });
        qc.invalidateQueries({ queryKey: ['kgsSlotCounts'] });
      }
    });
    return unsubscribe;
  }, [qc]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: GIFT_SHOP_REGISTRATIONS_KEY });
    qc.invalidateQueries({ queryKey: ['kgsSlotCounts'] });
  };

  return { ...query, refresh };
}