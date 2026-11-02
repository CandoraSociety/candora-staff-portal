import { NavLink } from 'react-router-dom';
import { Home, Search, ClipboardList, FileText, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/joblab/dashboard', label: 'Home', icon: Home },
  { to: '/joblab/job-search', label: 'Find jobs', icon: Search },
  { to: '/joblab/job-tracker', label: 'Applications', icon: ClipboardList },
  { to: '/joblab/resume-builder', label: 'Resume', icon: FileText },
];

// Phone navigation: a plain bottom bar with the four things people actually come
// in to do, plus everything else behind "More".
export default function JobLabBottomNav({ onMore }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-jl-border bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="grid grid-cols-5">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-jl-primary' : 'text-jl-muted-fg'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-8 w-12 items-center justify-center rounded-full transition-colors',
                    isActive && 'bg-jl-gold/25'
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={onMore}
          className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-jl-muted-fg"
        >
          <span className="flex h-8 w-12 items-center justify-center rounded-full">
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </span>
          More
        </button>
      </div>
    </nav>
  );
}