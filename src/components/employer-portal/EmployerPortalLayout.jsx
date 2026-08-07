import { Outlet, Link } from 'react-router-dom';
import { getEmployerSession, clearEmployerSession } from '@/lib/employerPortalSession';
import { LogOut, ArrowLeft } from 'lucide-react';

export default function EmployerPortalLayout() {
  const portalEmployerId = getEmployerSession();
  const isStaff = !portalEmployerId;

  const handleLogout = () => {
    clearEmployerSession();
    window.location.href = '/employer-portal/login';
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
            </div>
          </div>
          <div className="flex items-center gap-3">
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