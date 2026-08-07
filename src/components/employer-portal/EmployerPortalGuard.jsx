import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getEmployerSession } from '@/lib/employerPortalSession';

// Guards the isolated Employer Portal. A self-contained portal employer
// (sessionStorage employer id) passes directly. Authenticated Base44 users
// (staff reviewing a specific employer) also pass. Everyone else is sent to
// the employer login.
export default function EmployerPortalGuard() {
  const { isLoadingAuth, authChecked, isAuthenticated } = useAuth();
  const portalEmployerId = getEmployerSession();

  if (portalEmployerId) return <Outlet />;

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/employer-portal/login" replace />;

  return <Outlet />;
}