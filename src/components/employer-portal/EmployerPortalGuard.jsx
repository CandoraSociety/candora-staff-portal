import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

// Guards the isolated Employer Portal. Any authenticated user may enter —
// employer-profile users see their own company view; staff see a read/submit
// "review mode" with an employer picker. Unauthed users are sent to employer login.
// Employers themselves are kept out of the main app by ProtectedRoute.
export default function EmployerPortalGuard() {
  const { isAuthenticated, isLoadingAuth, authChecked } = useAuth();

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