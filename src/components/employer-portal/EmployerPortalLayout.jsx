import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { LogOut, ArrowLeft } from 'lucide-react';

export default function EmployerPortalLayout() {
  const { employerProfile, user } = useAuth();
  const isStaff = !employerProfile;

  const handleLogout = () => {
    base44.auth.logout('/employer-portal/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-amber-400 text-slate-900 font-bold flex items-center justify-center text-sm">
              C
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Candora Employer Portal</div>
              <div className="text-xs text-white/60">{employerProfile?.name || ''}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60 hidden sm:block">
              {employerProfile?.contact_name || user?.full_name || user?.email}
            </span>
            {isStaff ? (
              <Link
                to="/pathways/employers"
                className="flex items-center gap-1 text-xs text-white/80 hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Staff App
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-white/80 hover:text-white"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}