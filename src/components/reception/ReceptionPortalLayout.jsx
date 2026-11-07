import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, DoorOpen, UserSearch, Users, ClipboardList,
  Search, Siren, Menu, X, LogOut, ShoppingBasket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrgSettings } from '@/lib/useOrgSettings';
import SimpleModeToggle from '@/components/shared/SimpleModeToggle';
import { useSimpleMode } from '@/lib/useSimpleMode';
import { endReceptionPortalSession, getReceptionPortalSession } from '@/lib/receptionPortalSession';
import LeaveMessageButton from '@/components/reception/LeaveMessageButton';

// The external Reception portal mirrors the internal one but keeps its own
// paths, offers no way back into the staff app, and shows who is at the desk.
const FULL_NAV = [
  { path: '/reception-portal', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/reception-portal/appointments', label: 'Appointments', icon: CalendarDays },
  { path: '/reception-portal/client-visit', label: 'Client Visit', icon: UserSearch },
  { path: '/reception-portal/staff', label: 'Staff Directory', icon: Users },
  { path: '/reception-portal/registration', label: 'Program Registration', icon: ClipboardList },
  { path: '/reception-portal/resources', label: 'Resource Finder', icon: Search },
  { path: '/reception-portal/urgent', label: 'Urgent Alerts', icon: Siren },
];

const SIMPLE_NAV = [
  { path: '/reception-portal', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/reception-portal/appointments', label: 'Appointments', icon: CalendarDays },
  { path: '/reception-portal/dropins', label: 'Drop-Ins', icon: DoorOpen },
  { path: '/reception-portal/client-visit', search: '?type=grab_and_go', label: 'Grab and Go Resources', icon: ShoppingBasket },
];

export default function ReceptionPortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logoUrl, orgName } = useOrgSettings();
  const { simpleMode, setSimpleMode } = useSimpleMode();
  const operatorName = getReceptionPortalSession()?.name || 'Front desk';

  const navItems = simpleMode ? SIMPLE_NAV : FULL_NAV;
  const isActive = (path) => (path === '/reception-portal'
    ? location.pathname === '/reception-portal'
    : location.pathname.startsWith(path));

  const handleEndSession = () => {
    if (!window.confirm(`End ${operatorName}'s session? The next person will need to sign in.`)) return;
    endReceptionPortalSession();
    navigate('/reception-portal', { replace: true });
    // Remount the guard so the sign-in screen appears.
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2 px-4 lg:px-6 h-14">
          <div className="flex items-center gap-3 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={orgName} className="h-8 w-auto object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-display font-bold text-sm">R</span>
              </div>
            )}
            <div>
              <h1 className="text-sidebar-foreground font-display font-bold text-sm leading-tight">Reception</h1>
              <p className="text-sidebar-foreground/60 text-xs leading-tight">Front Desk Portal</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1 min-w-0 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={`${item.path}${item.search || ''}`}
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

          <div className="flex items-center gap-3 shrink-0">
            <LeaveMessageButton fromName={operatorName} onDark />
            <div className="hidden sm:block">
              <SimpleModeToggle simpleMode={simpleMode} onChange={setSimpleMode} onDark />
            </div>
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-sidebar-border">
              <span className="text-xs text-sidebar-foreground/70 max-w-[120px] truncate" title={operatorName}>
                {operatorName}
              </span>
              <button
                onClick={handleEndSession}
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
                title="End session"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <button className="lg:hidden text-sidebar-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden flex flex-col p-2 border-t border-sidebar-border">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={`${item.path}${item.search || ''}`}
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
            <button
              onClick={handleEndSession}
              className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70"
            >
              <LogOut className="h-4 w-4" /> End session ({operatorName})
            </button>
          </nav>
        )}
      </header>

      <main className="p-4 lg:p-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}