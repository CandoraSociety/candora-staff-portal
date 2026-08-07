import { Outlet, Link } from 'react-router-dom';
import { getEmployerSession, clearEmployerSession } from '@/lib/employerPortalSession';
import { useOrgSettings } from '@/lib/useOrgSettings';
import { LogOut, ArrowLeft } from 'lucide-react';

export default function EmployerPortalLayout() {
  const portalEmployerId = getEmployerSession();
  const isStaff = !portalEmployerId;
  const { logoUrl } = useOrgSettings();

  const handleLogout = () => {
    clearEmployerSession();
    window.location.href = '/employer-portal/login';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 shadow" style={{ background: 'hsl(231,64%,20%)' }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Candora logo" className="h-9 w-9 object-contain rounded-full" />
            ) : (
              <div className="h-9 w-9 rounded bg-amber-400 text-slate-900 font-bold flex items-center justify-center text-sm">C</div>
            )}
            <span className="text-white font-bold text-sm tracking-wide" style={{ fontFamily: "'Arial Black','Impact',sans-serif" }}>
              <span style={{ color: 'hsl(42,100%,54%)' }}>CANDORA</span>
              <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.85)', marginLeft: 4 }}>Pathways</span>
              <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.6)', marginLeft: 8, fontSize: 11, letterSpacing: '0.04em' }}>Employer Portal</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isStaff ? (
              <Link to="/pathways/employers" className="flex items-center gap-1 text-xs text-white/80 hover:text-white">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Staff App
              </Link>
            ) : (
              <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-white/80 hover:text-white">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            )}
          </div>
        </div>
        <div style={{ height: 3, background: 'hsl(42,100%,54%)' }} />
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}