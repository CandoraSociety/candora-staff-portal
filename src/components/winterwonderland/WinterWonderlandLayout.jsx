import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Layers, CalendarDays, Gift, TreePine, Bell, UtensilsCrossed, HeartHandshake, ArrowLeft, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrgSettings } from '@/lib/useOrgSettings';
import EAFloatingWidget from '@/components/ed/EAFloatingWidget';

const NAV_ITEMS = [
  { path: '/winter-wonderland', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/winter-wonderland/kids-gift-shop', label: 'Kids Gift Shop', icon: Gift },
  { path: '/winter-wonderland/santas-village', label: "Santa's Village", icon: TreePine },
  { path: '/winter-wonderland/sleigh-bells', label: 'Sleigh Bells and Snowflakes', icon: Bell },
  { path: '/winter-wonderland/community-lunch', label: 'Christmas Community Lunch', icon: UtensilsCrossed },
  { path: '/winter-wonderland/donation-drive', label: 'Donation Drive', icon: HeartHandshake },
  { path: '/winter-wonderland/schedule', label: 'Schedule', icon: CalendarDays },
  { path: '/winter-wonderland/components', label: 'Components', icon: Layers },
];

export default function WinterWonderlandLayout() {
  const location = useLocation();
  const { logoUrl, orgName } = useOrgSettings();

  const isActive = (path) => path === '/winter-wonderland' ? location.pathname === '/winter-wonderland' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-4 lg:px-6 h-14">
          <Link to="/" className="text-sidebar-foreground/60 hover:text-sidebar-foreground"><ArrowLeft className="h-4 w-4" /></Link>
          {logoUrl ? <img src={logoUrl} alt={orgName} className="h-8 w-auto object-contain" /> : <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center"><Snowflake className="h-4 w-4 text-sidebar-primary-foreground" /></div>}
          <div><h1 className="text-sidebar-foreground font-display font-bold text-sm leading-tight">Winter Wonderland Festival</h1><p className="text-sidebar-foreground/60 text-xs leading-tight">Annual Festival Portal</p></div>
        </div>
        <nav className="flex flex-wrap items-center gap-1 px-2 lg:px-4 pb-2">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />{item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="p-4 lg:p-6 max-w-7xl mx-auto"><Outlet /></main>
      <EAFloatingWidget />
    </div>
  );
}