import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// One shared source for the Kids Gift Shop registrations, so the registration
// tab, the sign-in tab, the check-in window and the children window all read and
// update the same rows. Sign-ins and edits are written to ProgramRegistration,
// so a live subscription refreshes every area the moment anything changes —
// including in another window.
export const GIFT_SHOP_REGISTRATIONS_KEY = ['kidsGiftShopRegistrations'];

export function useGiftShopRegistrations() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: GIFT_SHOP_REGISTRATIONS_KEY,
    queryFn: () => base44.entities.ProgramRegistration.filter(
      { program_name: 'Kids Gift Shop' },
      { sort: '-created_date', limit: 500 }
    ).then(res => res.items || []),
    // A slow safety net in case a live event is ever missed.
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const unsubscribe = base44.entities.ProgramRegistration.subscribe((event) => {
      const cached = qc.getQueryData(GIFT_SHOP_REGISTRATIONS_KEY) || [];
      const eventId = event?.data?.id || event?.id;
      // Refresh on any change to a gift shop row — whether the event names the
      // program or is an update to a row already on screen.
      const touchesGiftShop = event?.data?.program_name === 'Kids Gift Shop'
        || cached.some(r => r.id === eventId);
      if (touchesGiftShop) {
        qc.invalidateQueries({ queryKey: GIFT_SHOP_REGISTRATIONS_KEY });
      }
    });
    return unsubscribe;
  }, [qc]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: GIFT_SHOP_REGISTRATIONS_KEY });
  };

  return { ...query, refresh };
}