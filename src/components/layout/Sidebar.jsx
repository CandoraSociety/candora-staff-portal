import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, AppWindow, Settings, Users, Bell, 
  Building2, Shield, ChevronLeft, ChevronRight, LogOut,
  Megaphone, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { path: '/portal', label: 'Portal', icon: AppWindow, adminOnly: false },
];

const ADMIN_ITEMS = [
  { path: '/admin/cards', label: 'Manage Cards', icon: AppWindow, adminOnly: true },
  { path: '/admin/widgets', label: 'Manage Widgets', icon: LayoutDashboard, adminOnly: true },
  { path: '/admin/users', label: 'Users & Access', icon: Users, adminOnly: true },
  { path: '/admin/announcements', label: 'Announcements', icon: Megaphone, adminOnly: true },
  { path: '/admin/settings', label: 'Org Settings', icon: Settings, adminOnly: true },
  { path: '/dev-tasks', label: 'Dev Tasks', icon: CheckCircle2, adminOnly: true },
];

export default function Sidebar({ collapsed, setCollapsed, isAdmin }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    base44.auth.logout('/login');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col z-40 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}>
        {/* Logo and Collapse Toggle */}
        <div className="h-20 border-b border-border">
          <div className={cn(
            "flex items-center justify-between px-3 h-full",
            collapsed ? "justify-center" : ""
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-display font-bold text-lg">C</span>
              </div>
              {!collapsed && (
                <span className="font-display font-bold text-foreground text-xl truncate">Candora</span>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors"
                >
                  {collapsed ? (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{collapsed ? 'Expand' : 'Collapse'}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavItem key={item.path} item={item} collapsed={collapsed} active={isActive(item.path)} />
          ))}

          {isAdmin && (
            <>
              <div className={cn("pt-4 pb-2", collapsed ? "px-0" : "px-2")}>
                {!collapsed && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
                )}
                {collapsed && <div className="border-t border-border" />}
              </div>
              {ADMIN_ITEMS.map(item => (
                <NavItem key={item.path} item={item} collapsed={collapsed} active={isActive(item.path)} />
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                  collapsed && "justify-center px-0"
                )}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>Sign Out</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function NavItem({ item, collapsed, active }) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={item.path}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            collapsed && "justify-center px-0",
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className={cn("w-[18px] h-[18px] flex-shrink-0", active && "text-primary")} />
          {!collapsed && <span>{item.label}</span>}
        </Link>
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
    </Tooltip>
  );
}