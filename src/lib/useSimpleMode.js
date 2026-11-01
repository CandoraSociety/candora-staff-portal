import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// Simple mode — a per-user setting that trims the main page and the Reception
// portal down to the essentials for basic day-to-day tasks. Stored on the same
// UserDashboardPreference record the dashboard already uses.
export function useSimpleMode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences = null } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      const prefs = await base44.entities.UserDashboardPreference.filter({ user_id: user?.id });
      return prefs[0] || null;
    },
    enabled: !!user?.id,
  });

  const simpleMode = !!preferences?.simple_mode;

  const setSimpleMode = async (value) => {
    const next = !!value;
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