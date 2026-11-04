import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// Simple mode — a per-user setting that trims the main page and the Reception
// portal down to the essentials for basic ****** tasks. Stored on the same
// UserDashboardPreference record the dashboard already uses. The external
// Reception portal has no user, so there it lives in the browser instead.
const KIOSK_KEY = 'reception_portal_simple_mode';

export function useSimpleMode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const kiosk = !user;
  const [kioskSimple, setKioskSimple] = useState(() => {
    const stored = localStorage.getItem(KIOSK_KEY);
    return stored === null ? true : stored === 'true';
  });

  const { data: preferences = null } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      const prefs = await base44.entities.UserDashboardPreference.filter({ user_id: user?.id });
      return prefs[0] || null;
    },
    enabled: !!user?.id,
  });

  const simpleMode = kiosk ? kioskSimple : !!preferences?.simple_mode;

  const setSimpleMode = async (value) => {
    const next = !!value;
    if (kiosk) {
      localStorage.setItem(KIOSK_KEY, String(next));
      setKioskSimple(next);
      return;
    }
    // Update the cached record straight away so the switch feels instant.
    queryClient.setQueryData(['userPreferences', user?.id], (current) => ({ ...(current || { user_id: user?.id }), simple_mode: next }));
    if (preferences) {
      await base44.entities.UserDashboardPreference.update(preferences.id, { simple_mode: next });
    } else {
      await base44.entities.UserDashboardPreference.create({ user_id: user.id, simple_mode: next });
    }
    queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.id] });
  };

  return { simpleMode, setSimpleMode };
}