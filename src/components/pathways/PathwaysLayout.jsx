import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const NAV_ITEMS = {
  admin: [
    { label: 'Intake',       path: '/pathways/intake' },
    { label: 'Master List',  path: '/pathways/master' },
    { label: 'Dashboard',    path: '/pathways/dashboard' },
    { label: 'Reports',      path: '/pathways/reports' },
    { label: 'Supervisor',   path: '/pathways/supervisor' },
    { label: 'Resources',    path: '/pathways/resources' },
    { label: 'Compass',      path: '/pathways/compass' },
    { label: 'Billing',      path: '/pathways/billing' },
  ],
  intake: [
    { label: 'Intake',       path: '/pathways/intake' },
    { label: 'Master List',  path: '/pathways/master' },
    { label: 'Reports',      path: '/pathways/reports' },
    { label: 'Resources',    path: '/pathways/resources' },
  ],
  worker: [
    { label: 'Dashboard',    path: '/pathways/dashboard' },
    { label: 'Resources',    path: '/pathways/resources' },
    { label: 'Compass',      path: '/pathways/compass' },
  ],
  supervisor: [
    { label: 'Supervisor',   path: '/pathways/supervisor' },
    { label: 'Resources',    path: '/pathways/resources' },
  ],
};

export default function PathwaysLayout() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    base44.auth.logout('/login');
  };

  const items = NAV_ITEMS[user?.role] ?? NAV_ITEMS.worker;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 shadow-sm z-50">
        <div className="h-full px-6 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[hsl(231,64%,20%)] flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-xl text-slate-900">Candora</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {items.map((item) => {
              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-[hsl(231,64%,20%)] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right: User menu (desktop) + Hamburger (mobile) */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-slate-600">{user?.full_name}</span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hidden md:inline-flex">
                  <User className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 px-4 pb-4 pt-2 space-y-1">
            {items.map((item) => {
              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-3 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-[hsl(231,64%,20%)] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Main Content — offset for fixed navbar */}
      <main className="w-full pt-16">
        <Outlet />
      </main>
    </div>
  );
}