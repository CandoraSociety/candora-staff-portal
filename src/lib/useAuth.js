import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { normalizeUser } from '@/lib/userDisplayName';
import { useActingUser } from '@/lib/ActingUserContext';

export function useCurrentUser() {
  const actingUser = useActingUser();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(normalizeUser(u));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Inside an ActingUserProvider (Executive Director's test-employee tabs),
  // report the acting user instead of the signed-in one.
  return { user: actingUser || user, loading: actingUser ? false : loading };
}

export function useAccessLevel() {
  const { user, loading } = useCurrentUser();

  const isHRAdmin = user?.role === 'admin' || user?.role === 'hr_admin';
  const isManager = user?.role === 'manager' || isHRAdmin;

  return {
    user,
    loading,
    isHRAdmin,
    isManager,
    role: user?.role || 'user'
  };
}