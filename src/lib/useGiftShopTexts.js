import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// All texts exchanged with Kids Gift Shop families, kept live so a reply appears
// on the desk's screen as it arrives.
export function useGiftShopTexts() {
  const [texts, setTexts] = useState([]);

  const refresh = useCallback(async () => {
    const res = await base44.entities.GiftShopText.list({ sort: '-sent_at', limit: 300 });
    setTexts(Array.isArray(res) ? res : res?.items || []);
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = base44.entities.GiftShopText.subscribe(() => refresh());
    return unsubscribe;
  }, [refresh]);

  return { texts, refresh };
}