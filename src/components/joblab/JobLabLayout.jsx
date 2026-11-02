import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home, Search, ClipboardList, FileText, Route, BookOpen, UserRound, LogOut, X, AlertTriangle,
} from 'lucide-react';
import { useParticipant } from '@/lib/joblab/ParticipantContext';
import JobLabBrand, { CandoraMark } from '@/components/joblab/JobLabBrand';
import JobLabBottomNav from '@/components/joblab/JobLabBottomNav';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/joblab/dashboard', label: 'Home', icon: Home },
  { to: '/joblab/job-search', label: 'Find jobs', icon: Search },
  { to: '/joblab/job-tracker', label: 'Applications', icon: ClipboardList },
  { to: '/joblab/resume-builder', label: 'My resume', icon: FileText },
  { to: '/joblab/career-path', label: 'Career path', icon: Route },
  { to: '/joblab/resources', label: 'Learn', icon: BookOpen },
  { to: '/joblab/profile', label: 'Profile', icon: UserRound },
];

export default function JobLabLayout() {
  const { participant, isGuest, logout } = useParticipant();
  const navigate = useNavigate();
  const [more, setMore] = useState(false);

  const signOut = () => {
    logout();
    navigate('/joblab', { replace: true });
  };

  const initial = (participant?.name || 'G')[0].toUpperCase();

  return (
    <div className="joblab flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-jl-gold/30 bg-jl-navy">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/joblab/dashboard" aria-label="Job Lab home">
            <JobLabBrand compact />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-jl-gold text-jl-navy'
                      : 'text-jl-navy-fg/70 hover:bg-white/10 hover:text-jl-navy-fg'
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isGuest && (
              <span className="hidden rounded-full bg-jl-accent px-2.5 py-0.5 text-[10px] font-bold text-white sm:inline">
                Guest
              </span>
            )}
            <Link
              to="/joblab/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-jl-gold text-sm font-bold text-jl-navy"
              aria-label="My profile"
            >
              {initial}
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium text-jl-navy-fg/70 transition-colors hover:bg-white/10 hover:text-jl-navy-fg"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:pb-14">
        <Outlet />
      </main>

      <JobLabBottomNav onMore={() => setMore(true)} />

      {more && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMore(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-5 pb-8 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="jl-heading text-base font-semibold text-jl-fg">More in Job Lab</p>
              <button onClick={() => setMore(false)} aria-label="Close menu" className="rounded-lg p-1 text-jl-muted-fg">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              {NAV_ITEMS.slice(4).map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMore(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-jl-fg hover:bg-jl-secondary"
                >
                  <Icon className="h-4 w-4 text-jl-primary" />
                  {label}
                </Link>
              ))}
            </div>

            {isGuest && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-jl-accent/10 px-3 py-2 text-[11px] text-jl-accent">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Guest session — nothing is saved after you sign out.</span>
              </div>
            )}

            <div className="mt-4 border-t border-jl-border pt-3">
              <div className="flex items-center gap-2 px-1">
                <CandoraMark className="h-6 w-6" />
                <p className="text-[10px] leading-tight text-jl-muted-fg">
                  Candora Society · Employment &amp; Community Development
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}