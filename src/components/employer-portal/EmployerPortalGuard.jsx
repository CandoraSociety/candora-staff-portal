import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

// Guards the isolated Employer Portal. Only logged-in users who have a linked
// Employer profile may enter; everyone else is sent away (authed staff users
// back to the main app, unauthed users to the employer login).
export default function EmployerPortalGuard() {
  const { isAuthenticated, isLoadingAuth, authChecked, employerProfile } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/employer-portal/login" replace />;
  if (!employerProfile) return <Navigate to="/" replace />;

  return <Outlet />;
}