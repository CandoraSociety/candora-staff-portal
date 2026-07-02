import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { CalendarDays, Users, LayoutDashboard, ClipboardList, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrgSettings } from '@/lib/useOrgSettings';
import EAFloatingWidget from '@/components/ed/EAFloatingWidget';

const NAV_ITEMS = [
  { path: '/phac', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/phac/programs', label: 'Programs', icon: ClipboardList },
  { path: '/phac/sessions', label: 'Sessions', icon: CalendarDays },
  { path: '/phac/participants', label: 'Families', icon: Users },
];

export default function PHACLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logoUrl, orgName } = useOrgSettings();

  const isActive = (path) => {
    if (path === '/phac') return location.pathname === '/phac';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={orgName} className="h-8 w-auto object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-display font-bold text-sm">P</span>
              </div>
            )}
            <div>
              <h1 className="text-sidebar-foreground font-display font-bold text-sm leading-tight">PHAC Programs</h1>
              <p className="text-sidebar-foreground/60 text-xs leading-tight">Drop-in Family Programs (Ages 0–6)</p>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive(item.path)
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button className="lg:hidden text-sidebar-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <nav className="lg:hidden flex flex-col p-2 border-t border-sidebar-border">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium',
                    isActive(item.path)
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
      <main className="p-4 lg:p-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
      <EAFloatingWidget />
    </div>
  );
}