import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import EAFloatingWidget from '@/components/ed/EAFloatingWidget';
import ModuleGate from '@/components/shared/ModuleGate';
import { LayoutDashboard, Wallet, Briefcase, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrgSettings } from '@/lib/useOrgSettings';

const NAV_ITEMS = [
  { path: '/finance',          label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { path: '/finance/payroll',  label: 'Payroll',        icon: Wallet },
  { path: '/finance/pathways', label: 'Pathways',       icon: Briefcase },
  { path: '/finance/food',     label: 'Food Services',  icon: UtensilsCrossed },
];

export default function FinanceLayout() {
  const location = useLocation();
  const { logoUrl } = useOrgSettings();

  const isActive = (item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  return (
    <ModuleGate moduleId="finance">
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-accent text-accent-foreground shadow-md">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-3">
                <img src={logoUrl} alt="Candora" className="h-9 w-9 rounded-lg object-contain" />
                <span className="font-display font-bold text-sm text-primary leading-tight">
                  Candora<br />
                  <span className="text-accent-foreground/60 font-normal text-xs">Finance Portal</span>
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      isActive(item)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-accent-foreground/70 hover:text-accent-foreground hover:bg-white/10"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className="md:hidden border-t border-white/10 px-4 py-2 flex gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all",
                  isActive(item)
                    ? "bg-primary text-primary-foreground"
                    : "text-accent-foreground/70 hover:bg-white/10"
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
        <EAFloatingWidget />
      </div>
    </ModuleGate>
  );
}