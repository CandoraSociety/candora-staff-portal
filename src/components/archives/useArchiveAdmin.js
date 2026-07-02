import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAccessControl } from '@/lib/useAccessControl';

export function useArchiveAdmin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const { isAdmin } = useAccessControl(user, []);
  return { user, isAdmin, loading };
}