import { useAuth } from '@/lib/AuthContext';
import { getReceptionPortalSession } from '@/lib/receptionPortalSession';

// Who is working the desk right now: the kiosk sign-in name on the external
// Reception portal, or the signed-in staff member inside the app.
export function useReceptionOperator() {
  const { user } = useAuth();
  const session = getReceptionPortalSession();
  if (session?.name) return { full_name: session.name, email: '' };
  return user || null;
}