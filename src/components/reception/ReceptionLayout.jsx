import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, UserSearch, Users, ClipboardList, Search, Siren, Menu, X, ArrowLeft, DoorOpen, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrgSettings } from '@/lib/useOrgSettings';
import EAFloatingWidget from '@/components/ed/EAFloatingWidget';
import SimpleModeToggle from '@/components/shared/SimpleModeToggle';
import { useSimpleMode } from '@/lib/useSimpleMode';

const NAV_ITEMS = [
  { path: '/reception', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/reception/appointments', label: 'Appointments', icon: CalendarDays },
  { path: '/reception/client-visit', label: 'Client Visit', icon: UserSearch },
  { path: '/reception/staff', label: 'Staff Directory', icon: Users },
  { path: '/reception/registration', label: 'Program Registration', icon: ClipboardList },
  { path: '/reception/resources', label: 'Resource Finder', icon: Search },
  { path: '/reception/urgent', label: 'Urgent Alerts', icon: Siren },
];

// Simple mode keeps only the three moves a receptionist needs.
const SIMPLE_NAV_ITEMS = [
  { path: '/reception', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/reception/appointments', label: 'Appointments', icon: CalendarDays },
  { path: '/reception/dropins', label: 'Drop-Ins', icon: DoorOpen },
  { path: '/reception/registration', label: 'Program Registration', icon: ClipboardList },
];

export default function ReceptionLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logoUrl, orgName } = useOrgSettings();
  const { simpleMode, setSimpleMode } = useSimpleMode();

  const navItems = simpleMode ? SIMPLE_NAV_ITEMS : NAV_ITEMS;

  const isActive = (path) => path === '/reception' ? location.pathname === '/reception' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sidebar-foreground/60 hover:text-sidebar-foreground"><ArrowLeft className="h-4 w-4" /></Link>
            {logoUrl ? <img src={logoUrl} alt={orgName} className="h-8 w-auto object-contain" /> : <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center"><span className="text-sidebar-primary-foreground font-display font-bold text-sm">R</span></div>}
            <div><h1 className="text-sidebar-foreground font-display font-bold text-sm leading-tight">Reception</h1><p className="text-sidebar-foreground/60 text-xs leading-tight">Front Desk Portal</p></div>
          </div>
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => { const Icon = item.icon; return (
              <Link key={item.path} to={item.path} className={cn('flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors', isActive(item.path) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground')}><Icon className="h-4 w-4" />{item.label}</Link>
            ); })}
          </nav>
          <div className="flex items-center gap-4">
            <a
              href="/reception-portal"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-md bg-sidebar-primary px-3 py-2 text-xs font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90 transition-colors"
              title="Open the external front desk portal in a new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">External Portal</span>
            </a>
            <div data-tour="reception-simple-mode" className="hidden sm:block">
              <SimpleModeToggle simpleMode={simpleMode} onChange={setSimpleMode} onDark />
            </div>
            <button className="lg:hidden text-sidebar-foreground" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
        {mobileOpen && <nav className="lg:hidden flex flex-col p-2 border-t border-sidebar-border">{navItems.map(item => { const Icon = item.icon; return (
          <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium', isActive(item.path) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50')}><Icon className="h-4 w-4" />{item.label}</Link>
        ); })}</nav>}
      </header>
      <main className="p-4 lg:p-6 max-w-7xl mx-auto"><Outlet /></main>
      <EAFloatingWidget />
    </div>
  );
}