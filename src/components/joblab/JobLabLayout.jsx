import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Briefcase, LayoutDashboard, Search, ClipboardList, FileText, Route, BookOpen,
  Menu, X, LogOut, AlertTriangle,
} from 'lucide-react';
import { useParticipant } from '@/lib/joblab/ParticipantContext';
import JobLabBrand, { CandoraMark } from '@/components/joblab/JobLabBrand';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/joblab/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/joblab/job-search', label: 'Job Search', icon: Search },
  { to: '/joblab/job-tracker', label: 'Job Tracker', icon: ClipboardList },
  { to: '/joblab/resume-builder', label: 'Resume Builder', icon: FileText },
  { to: '/joblab/career-path', label: 'Career Path', icon: Route },
  { to: '/joblab/resources', label: 'Resources', icon: BookOpen },
  { to: '/joblab/profile', label: 'My Profile', icon: Briefcase },
];

function NavItems({ onNavigate }) {
  return (
    <nav className="flex-1 space-y-1 px-3">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-jl-navy-accent text-jl-navy-fg shadow-[inset_3px_0_0_0_hsl(var(--jl-gold))]'
                : 'text-jl-navy-fg/70 hover:bg-white/5 hover:text-jl-navy-fg'
            )
          }
        >
          <Icon className="w-4 h-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function JobLabLayout() {
  const { participant, isGuest, logout } = useParticipant();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);

  const signOut = () => {
    logout();
    navigate('/joblab', { replace: true });
  };

  const initial = (participant?.name || 'G')[0].toUpperCase();

  const footer = (
    <div className="px-3 pb-4 space-y-3">
      {isGuest && (
        <div className="flex items-start gap-2 rounded-lg bg-jl-accent/15 px-3 py-2 text-[11px] text-jl-accent">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>Guest session — nothing is saved after you sign out.</span>
        </div>
      )}
      <div className="flex items-center gap-2.5 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-jl-primary text-sm font-semibold text-jl-primary-fg">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-jl-navy-fg">{participant?.name || 'Guest'}</p>
          <p className="truncate text-[11px] text-jl-navy-fg/60">{participant?.email || 'No email'}</p>
        </div>
      </div>
      <button
        onClick={signOut}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-jl-navy-fg/70 transition-colors hover:bg-white/5 hover:text-jl-navy-fg"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
      <div className="flex items-center gap-2 border-t border-white/10 px-1 pt-3">
        <CandoraMark className="h-5 w-5" />
        <p className="text-[10px] leading-tight text-jl-navy-fg/50">
          Candora Society
          <br />
          Employment &amp; Community Development
        </p>
      </div>
    </div>
  );

  return (
    <div className="joblab">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col bg-jl-navy lg:flex">
        <div className="px-5 py-5">
          <JobLabBrand />
        </div>
        <div className="mx-5 mb-3 h-px bg-gradient-to-r from-jl-gold/60 via-jl-gold/20 to-transparent" />
        <NavItems />
        {footer}
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between bg-jl-navy px-4 lg:hidden">
        <button onClick={() => setDrawer(true)} aria-label="Open menu" className="p-1 text-jl-navy-fg">
          <Menu className="w-5 h-5" />
        </button>
        <JobLabBrand compact />
        {isGuest ? (
          <span className="rounded-full bg-jl-accent px-2 py-0.5 text-[10px] font-bold text-white">Guest</span>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-jl-primary text-xs font-semibold text-jl-primary-fg">
            {initial}
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-jl-navy">
            <div className="flex items-center justify-between px-4 py-4">
              <JobLabBrand />
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className="text-jl-navy-fg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mx-4 mb-2 h-px bg-gradient-to-r from-jl-gold/60 via-jl-gold/20 to-transparent" />
            <NavItems onNavigate={() => setDrawer(false)} />
            {footer}
          </div>
        </div>
      )}

      <main className="pt-14 lg:ml-64 lg:pt-0">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}