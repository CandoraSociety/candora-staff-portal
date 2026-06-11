import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Users, FileText, BarChart3,
  Bell, BookMarked, Settings, Library
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LOGO_URL = 'https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png';

const NAV_ITEMS = [
  { label: "Home",             path: "/grants",            icon: LayoutDashboard, exact: true },
  { label: "Projects",         path: "/grants/projects",   icon: FolderOpen },
  { label: "Funders",          path: "/grants/funders",    icon: Users },
  { label: "Funding DB",       path: "/grants/funding-db", icon: Library },
  { label: "Proposals",        path: "/grants/proposals",  icon: FileText },
  { label: "Reports",          path: "/grants/reports",    icon: BarChart3 },
  { label: "Reminders",        path: "/grants/reminders",  icon: Bell },
  { label: "Templates",        path: "/grants/templates",  icon: BookMarked },
  { label: "Org Info",         path: "/grants/org-info",   icon: Settings },
];

export default function GrantsLayout() {
  const location = useLocation();

  const isActive = (item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-14">
            {/* Logo → app home */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 mr-2">
              <img src={LOGO_URL} alt="Candora" className="h-8 w-8 rounded-lg object-contain" />
              <span className="font-display font-bold text-sm text-foreground hidden sm:block leading-tight">
                Grant / Proposal<br />
                <span className="text-muted-foreground font-normal text-xs">Manager</span>
              </span>
            </Link>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    isActive(item)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile scrollable nav */}
        <div className="md:hidden border-t border-border px-3 py-1.5 flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all",
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

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}