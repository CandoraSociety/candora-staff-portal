import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, UserPlus, Search, Menu, X, CalendarPlus, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrgSettings } from '@/lib/useOrgSettings';
import { Button } from '@/components/ui/button';
import RWorkerNotifications from '@/components/rworker/RWorkerNotifications';
import AppointmentDialog from '@/components/rc/AppointmentDialog';

const NAV_ITEMS = [
  { path: '/rworker', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/rworker/case-management', label: 'Case Management', icon: ClipboardList },
  { path: '/rworker/client-visit', label: 'Client Visit', icon: UserPlus },
  { path: '/rworker/resources', label: 'Resource Finder', icon: Search },
];

// Simple Resource Worker portal — one ribbon across the top, a notification bell,
// and appointment scheduling reachable from every page.
export default function RWorkerLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);
  const { logoUrl, orgName } = useOrgSettings();

  const isActive = (path) => {
    if (path === '/rworker') return location.pathname === '/rworker';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-3 px-4 lg:px-6 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/portal" className="flex items-center text-sidebar-foreground/60 hover:text-sidebar-foreground" title="Back to Portal">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            {logoUrl ? (
              <img src={logoUrl} alt={orgName} className="h-8 w-auto object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-display font-bold text-sm">C</span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sidebar-foreground font-display font-bold text-sm leading-tight truncate">Resource Worker Portal</h1>
              <p className="text-sidebar-foreground/60 text-xs leading-tight truncate">Client Case Work</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
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

          <div className="flex items-center gap-1.5 shrink-0">
            <Button size="sm" className="gap-1.5 hidden sm:flex" onClick={() => setApptOpen(true)}>
              <CalendarPlus className="h-4 w-4" /> Schedule Appointment
            </Button>
            <RWorkerNotifications />
            <button className="lg:hidden text-sidebar-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="lg:hidden flex flex-col p-2 border-t border-sidebar-border">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium',
                    isActive(item.path) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Button size="sm" className="mt-1 gap-1.5" onClick={() => { setMobileOpen(false); setApptOpen(true); }}>
              <CalendarPlus className="h-4 w-4" /> Schedule Appointment
            </Button>
          </nav>
        )}
      </header>

      <main className="p-4 lg:p-6 max-w-7xl mx-auto">
        <Outlet />
      </main>

      <AppointmentDialog open={apptOpen} onOpenChange={setApptOpen} onSaved={() => setApptOpen(false)} />
    </div>
  );
}