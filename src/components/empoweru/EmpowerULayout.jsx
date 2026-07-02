import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Layers, Users, UserPlus, Landmark, Compass, Menu, X, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrgSettings } from '@/lib/useOrgSettings';
import EAFloatingWidget from '@/components/ed/EAFloatingWidget';

const NAV_ITEMS = [
  { path: '/empoweru', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/empoweru/cohorts', label: 'Cohorts', icon: Layers },
  { path: '/empoweru/participants', label: 'Participants', icon: Users },
  { path: '/empoweru/intake', label: 'Intake', icon: UserPlus },
  { path: '/empoweru/account-setup', label: 'Account Setup', icon: Landmark },
  { path: '/empoweru/service-nav', label: 'Service Nav', icon: Compass },
];

export default function EmpowerULayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logoUrl, orgName } = useOrgSettings();

  const isActive = (path) => path === '/empoweru' ? location.pathname === '/empoweru' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sidebar-foreground/60 hover:text-sidebar-foreground"><ArrowLeft className="h-4 w-4" /></Link>
            {logoUrl ? <img src={logoUrl} alt={orgName} className="h-8 w-auto object-contain" /> : <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center"><span className="text-sidebar-primary-foreground font-display font-bold text-sm">E</span></div>}
            <div><h1 className="text-sidebar-foreground font-display font-bold text-sm leading-tight">EmpowerU</h1><p className="text-sidebar-foreground/60 text-xs leading-tight">Financial Literacy Program</p></div>
          </div>
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(item => { const Icon = item.icon; return (
              <Link key={item.path} to={item.path} className={cn('flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors', isActive(item.path) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground')}><Icon className="h-4 w-4" />{item.label}</Link>
            ); })}
          </nav>
          <button className="lg:hidden text-sidebar-foreground" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {mobileOpen && <nav className="lg:hidden flex flex-col p-2 border-t border-sidebar-border">{NAV_ITEMS.map(item => { const Icon = item.icon; return (
          <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium', isActive(item.path) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50')}><Icon className="h-4 w-4" />{item.label}</Link>
        ); })}</nav>}
      </header>
      <main className="p-4 lg:p-6 max-w-7xl mx-auto"><Outlet /></main>
      <EAFloatingWidget />
    </div>
  );
}