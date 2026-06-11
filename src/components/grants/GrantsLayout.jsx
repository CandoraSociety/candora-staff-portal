import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  LayoutDashboard, FolderOpen, Users, FileText, BarChart3,
  Bell, BookOpen, Settings, ChevronLeft, Menu, X, BookMarked,
  Search, Library
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGO_URL = 'https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png';

const NAV_ITEMS = [
  { label: "Home", path: "/grants", icon: LayoutDashboard, exact: true },
  { label: "Projects", path: "/grants/projects", icon: FolderOpen },
  { label: "Funders", path: "/grants/funders", icon: Users },
  { label: "Funding Database", path: "/grants/funding-db", icon: Library },
  { label: "Proposals", path: "/grants/proposals", icon: FileText },
  { label: "Reports", path: "/grants/reports", icon: BarChart3 },
  { label: "Reminders", path: "/grants/reminders", icon: Bell },
  { label: "Templates", path: "/grants/templates", icon: BookMarked },
  { label: "Org Info", path: "/grants/org-info", icon: Settings },
];

export default function GrantsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const NavLink = ({ item }) => (
    <Link
      to={item.path}
      onClick={() => setSidebarOpen(false)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        isActive(item)
          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      }`}
    >
      <item.icon className="h-4 w-4 flex-shrink-0" />
      {item.label}
    </Link>
  );

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo / Home */}
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
        <Link to="/" title="Candora Home">
          <img src={LOGO_URL} alt="Candora" className="h-9 w-9 rounded-lg object-contain" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sidebar-primary font-display font-bold text-sm leading-tight">Grant / Proposal</p>
          <p className="text-sidebar-foreground/60 text-xs">Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => <NavLink key={item.path} item={item} />)}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <Link
          to="/grants"
          className="flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors rounded-lg"
        >
          <span className="truncate">{user?.full_name || 'Staff'}</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-col flex-shrink-0 border-r border-sidebar-border">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-56 h-full flex flex-col">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-display font-bold text-sm text-foreground">Grant / Proposal Manager</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}