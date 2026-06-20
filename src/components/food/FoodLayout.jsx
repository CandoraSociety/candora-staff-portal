import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag, Package,
  BookOpen, CalendarDays, Users, ChevronLeft, ChevronRight,
  LogOut, Menu, Coffee, Heart, Soup, ChevronDown, ChevronUp
} from 'lucide-react';
import LogoutConfirmationDialog from '@/components/auth/LogoutConfirmationDialog';

const AREAS = [
  {
    label: 'Catering',
    icon: CalendarDays,
    color: 'text-amber-400',
    links: [
      { label: 'Quotes & Bookings', path: '/food/catering' },
      { label: 'Customers', path: '/food/customers' },
    ],
  },
  {
    label: 'Cafe Candeur',
    icon: Coffee,
    color: 'text-sky-400',
    links: [
      { label: 'Menu', path: '/food/cafe-candeur/menu' },
      { label: 'Orders', path: '/food/cafe-candeur/orders' },
      { label: 'Recipes', path: '/food/cafe-candeur/recipes' },
    ],
  },
  {
    label: "Auntie Bev's",
    icon: Heart,
    color: 'text-rose-400',
    links: [
      { label: 'Menu', path: '/food/auntie-bevs/menu' },
      { label: 'Orders', path: '/food/auntie-bevs/orders' },
      { label: 'Recipes', path: '/food/auntie-bevs/recipes' },
    ],
  },
  {
    label: 'Community Lunch',
    icon: Soup,
    color: 'text-green-400',
    links: [
      { label: 'Orders', path: '/food/community-lunch/orders' },
      { label: 'Inventory', path: '/food/inventory' },
    ],
  },
];

export default function FoodLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [openAreas, setOpenAreas] = useState({ Catering: true, 'Cafe Candeur': true, "Auntie Bev's": true, 'Community Lunch': true });

  const toggleArea = (label) => setOpenAreas(prev => ({ ...prev, [label]: !prev[label] }));

  const isActive = (path) => location.pathname === path || (path.length > 6 && location.pathname.startsWith(path));

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <img
          src="https://media.base44.com/images/public/6a249282cb496579542673b7/64f97b9c9_CandoraFoodServiceslogoyellowletters.png"
          alt="Candora Food Services"
          className={`object-contain flex-shrink-0 ${collapsed ? 'w-8 h-8' : 'w-44 h-14'}`}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {/* Dashboard */}
        <Link
          to="/food"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-2 ${
            location.pathname === '/food'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        {/* Area sections */}
        {AREAS.map(({ label, icon: Icon, color, links }) => (
          <div key={label} className="mb-1">
            {collapsed ? (
              <div className={`flex items-center justify-center py-2 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
            ) : (
              <button
                onClick={() => toggleArea(label)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  {label}
                </span>
                {openAreas[label] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
            {(openAreas[label] || collapsed) && links.map(({ label: lbl, path }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${collapsed ? 'justify-center' : 'pl-7'} ${
                  isActive(path)
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                {!collapsed && <span>{lbl}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
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
      {/* Desktop sidebar */}
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

      <LogoutConfirmationDialog
        open={showLogout}
        onOpenChange={setShowLogout}
        onConfirm={() => { setShowLogout(false); logout('/login'); }}
      />
    </div>
  );
}