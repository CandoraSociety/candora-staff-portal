import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard, CalendarDays, Coffee, Heart, Soup,
  TrendingUp, ChevronLeft, ChevronRight, LogOut, Menu, ExternalLink
} from 'lucide-react';
import LogoutConfirmationDialog from '@/components/auth/LogoutConfirmationDialog';

const NAV = [
  { label: 'Dashboard',       icon: LayoutDashboard, path: '/food' },
  { label: 'Catering',        icon: CalendarDays,    path: '/food/catering' },
  { label: 'Cafe Candeur',    icon: Coffee,          path: '/food/cafe-candeur' },
  { label: "Auntie Bev's",   icon: Heart,           path: '/food/auntie-bevs' },
  { label: 'Community Lunch', icon: Soup,            path: '/food/community-lunch' },
  { label: 'Sales',           icon: TrendingUp,      path: '/food/sales' },
];

export default function FoodLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const isActive = (path) => {
    if (path === '/food') return location.pathname === '/food';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <img
          src="https://media.base44.com/images/public/6a249282cb496579542673b7/64f97b9c9_CandoraFoodServiceslogoyellowletters.png"
          alt="Candora Food Services"
          className={`object-contain flex-shrink-0 ${collapsed ? 'w-8 h-8' : 'w-44 h-14'}`}
        />
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV.map(({ label, icon: Icon, path }) => (
          <Link
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(path)
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        <a href="/catering-portal" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Public Booking Portal</span>}
        </a>
        <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <ChevronLeft className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Back to Home</span>}
        </Link>
        {!collapsed && (
          <div className="px-2">
            <div className="text-xs font-medium truncate text-sidebar-foreground">{user?.full_name}</div>
            <div className="text-xs capitalize text-sidebar-foreground/50">{user?.role}</div>
          </div>
        )}
        <button
          onClick={() => setShowLogout(true)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-200 bg-sidebar ${collapsed ? 'w-[72px]' : 'w-56'}`}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border shadow-sm"
          style={{ top: '50%', transform: 'translateY(-50%)', left: collapsed ? 60 : 212, zIndex: 20 }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-56 h-full"><SidebarContent /></div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b bg-background md:hidden">
          <button onClick={() => setMobileOpen(true)}><Menu className="w-5 h-5" /></button>
          <span className="font-semibold text-sm">Food Services</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <LogoutConfirmationDialog
        open={showLogout}
        onOpenChange={setShowLogout}
        onConfirm={() => { setShowLogout(false); logout('/login'); }}
      />
    </div>
  );
}