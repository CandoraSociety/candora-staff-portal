import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return { user, loading };
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