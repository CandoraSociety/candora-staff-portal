import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import EAFloatingWidget from '@/components/ed/EAFloatingWidget';
import ModuleGate from '@/components/shared/ModuleGate';
import { LayoutDashboard, Wallet, Briefcase, UtensilsCrossed, Receipt, PiggyBank, CreditCard, PenTool, FileText, ChevronDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrgSettings } from '@/lib/useOrgSettings';

const NAV_ITEMS = [
  { path: '/finance',          label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { path: '/finance/payroll',      label: 'Payroll',                  icon: Wallet },
  { path: '/finance/pathways',     label: 'Pathways',                 icon: Briefcase },
  { path: '/finance/invoice-generator', label: 'Invoice Generator',  icon: FileText },
  {
    path: '/finance/reimbursements', label: 'Expense Claims', icon: Receipt,
    matchPaths: ['/finance/reimbursements', '/finance/mastercard'],
    children: [
      { path: '/finance/reimbursements', label: 'Staff Reimbursements', icon: Receipt },
      { path: '/finance/mastercard', label: 'Candora MasterCard', icon: CreditCard },
    ],
  },
  { path: '/finance/cash-flow',    label: 'Cash Flow',               icon: TrendingUp },
  { path: '/finance/budgets',      label: 'Budgets',                 icon: PiggyBank },
  { path: '/finance/food',         label: 'Food Services',            icon: UtensilsCrossed },
  { path: '/finance/e-signatures', label: 'E-Signatures',             icon: PenTool },
];

export default function FinanceLayout() {
  const location = useLocation();
  const { logoUrl } = useOrgSettings();

  const isActive = (item) =>
    item.matchPaths
      ? item.matchPaths.some((p) => location.pathname.startsWith(p))
      : item.exact
        ? location.pathname === item.path
        : location.pathname.startsWith(item.path);

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
                {NAV_ITEMS.map((item) => item.children ? (
                  <div key={item.path} className="relative group">
                    <Link
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
                      <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                    </Link>
                    <div className="absolute left-0 top-full pt-1.5 hidden group-hover:block z-50">
                      <div className="bg-accent rounded-lg shadow-lg border border-white/10 py-1 min-w-[240px]">
                        {item.children.map((child) => {
                          const childActive = location.pathname.startsWith(child.path);
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all",
                                childActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-accent-foreground/80 hover:bg-white/10 hover:text-accent-foreground"
                              )}
                            >
                              <child.icon className="w-4 h-4" />
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
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
            {NAV_ITEMS.flatMap((item) => item.children || [item]).map((item) => (
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