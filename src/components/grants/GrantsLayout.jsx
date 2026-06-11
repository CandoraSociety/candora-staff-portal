import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, FileText, Bell, Archive, CheckSquare, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOGO_URL = 'https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png';

const NAV_ITEMS = [
  { path: '/grants',              label: 'Dashboard',      icon: LayoutDashboard, exact: true },
  { path: '/grants/projects',     label: 'Proposals',      icon: FolderOpen },
  { path: '/grants/proposals',    label: 'Submissions',    icon: CheckSquare },
  { path: '/grants/funding-db',   label: 'Funder Database', icon: Database },
  { path: '/grants/reports',      label: 'Reports',        icon: FileText },
  { path: '/grants/files',        label: 'Files',          icon: Archive },
];

export default function GrantsLayout() {
  const location = useLocation();

  const isActive = (item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo → app home */}
            <Link to="/" className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Candora" className="h-9 w-9 rounded-lg object-contain" />
              <span className="font-display font-bold text-sm text-foreground leading-tight">
                Grant / Proposal<br />
                <span className="text-muted-foreground font-normal text-xs">Manager</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive(item)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link to="/grants/reports" className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-border px-4 py-2 flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all",
                isActive(item)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}