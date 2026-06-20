import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag, Package,
  BookOpen, CalendarDays, Users, ChevronLeft, ChevronRight,
  LogOut, Menu, X
} from 'lucide-react';
import LogoutConfirmationDialog from '@/components/auth/LogoutConfirmationDialog';
import { useOrgSettings } from '@/lib/useOrgSettings';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/food' },
  { label: 'Menu', icon: UtensilsCrossed, path: '/food/menu' },
  { label: 'Orders', icon: ShoppingBag, path: '/food/orders' },
  { label: 'Inventory', icon: Package, path: '/food/inventory' },
  { label: 'Recipes', icon: BookOpen, path: '/food/recipes' },
  { label: 'Catering', icon: CalendarDays, path: '/food/catering' },
  { label: 'Customers', icon: Users, path: '/food/customers' },
];

export default function FoodLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const { settings } = useOrgSettings();

  const logoUrl = settings?.logo_url;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded" />
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 bg-sidebar-primary text-sidebar-primary-foreground">C</div>
        )}
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-xs font-semibold leading-tight text-sidebar-foreground">Candora</div>
            <div className="text-xs leading-tight text-sidebar-primary">Food Services</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path || (path !== '/food' && location.pathname.startsWith(path));
          return (
            <Link key={path} to={path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        {!collapsed && (
          <div className="px-2 mb-2">
            <div className="text-xs font-medium truncate text-sidebar-foreground">{user?.full_name}</div>
            <div className="text-xs capitalize text-sidebar-foreground/50">{user?.role}</div>
          </div>
        )}
        <button onClick={() => setShowLogout(true)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-200 bg-sidebar ${collapsed ? 'w-[72px]' : 'w-56'}`}>
        <SidebarContent />
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border shadow-sm"
          style={{ top: '50%', transform: 'translateY(-50%)', left: collapsed ? 60 : 212, zIndex: 20 }}>
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-56 h-full"><SidebarContent /></div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b bg-background md:hidden">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">Food Services</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <LogoutConfirmationDialog open={showLogout} onOpenChange={setShowLogout}
        onConfirm={() => { setShowLogout(false); logout('/login'); }} />
    </div>
  );
}