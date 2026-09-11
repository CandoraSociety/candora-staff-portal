import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, AppWindow, Settings, Users, Bell, 
  Building2, Shield, ChevronLeft, ChevronRight, LogOut,
  Megaphone, CheckCircle2, LayoutPanelLeft, Calendar, Receipt,
  ShoppingBag, CreditCard, CalendarClock, PlaneTakeoff, ThermometerSun,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { useOrgSettings } from '@/lib/useOrgSettings';
import LogoutConfirmationDialog from '@/components/auth/LogoutConfirmationDialog';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { path: '/portal', label: 'Portals', icon: AppWindow, adminOnly: false },
  { path: '/meeting-manager', label: 'Meetings', icon: Calendar, adminOnly: false },
  { path: '/widget-customization', label: 'Add functions', icon: LayoutPanelLeft, adminOnly: false },
];

// Purchases — hover reveals the sub-tabs
const PURCHASES = {
  label: 'Purchases',
  icon: ShoppingBag,
  children: [
    { path: '/reimbursement-requests', label: 'Reimbursement Requests', icon: Receipt },
    { path: '/candora-cc-receipts', label: 'Candora CC Receipts', icon: CreditCard },
  ],
};

// Time & Attendance — hover reveals the sub-tabs
const TIME_ATTENDANCE = {
  label: 'Time & Attendance',
  icon: CalendarClock,
  children: [
    { path: '/time-off/vacation-request', label: 'Vacation / Time-off Request', icon: PlaneTakeoff },
    { path: '/time-off/sick-personal', label: 'Sick Time / Personal Day', icon: ThermometerSun },
    { path: '/time-off/timesheets', label: 'Timesheets', icon: ClipboardList },
  ],
};

const ADMIN_ITEMS = [
  { path: '/admin', label: 'Admin Dashboard', icon: Shield, adminOnly: true },
  { path: '/admin/cards', label: 'Manage Cards', icon: AppWindow, adminOnly: true },
  { path: '/admin/widgets', label: 'Manage Widgets', icon: LayoutDashboard, adminOnly: true },
  { path: '/admin/users', label: 'Users & Access', icon: Users, adminOnly: true },
  { path: '/admin/announcements', label: 'Announcements', icon: Megaphone, adminOnly: true },
  { path: '/admin/settings', label: 'Org Settings', icon: Settings, adminOnly: true },
  { path: '/dev-tasks', label: 'Dev Tasks', icon: CheckCircle2, adminOnly: true },
];

export default function Sidebar({ collapsed, setCollapsed, isAdmin }) {
  const location = useLocation();
  const { logoUrl, orgName } = useOrgSettings();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    base44.auth.logout();
    window.location.href = '/login';
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}>
        {/* Logo and Collapse Toggle */}
        <div className="h-20 border-b border-sidebar-border">
          <div className={cn(
            "flex items-center justify-between px-3 h-full",
            collapsed ? "justify-center" : ""
          )}>
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt={orgName}
                className="w-10 h-10 rounded-xl flex-shrink-0 object-contain"
              />
              {!collapsed && (
                <span className="font-display font-bold text-sidebar-primary text-sm truncate">{orgName}</span>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-sidebar-accent transition-colors"
                >
                  {collapsed ? (
                    <ChevronRight className="w-4 h-4 text-sidebar-foreground/60" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-sidebar-foreground/60" />
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

          <NavGroup item={PURCHASES} collapsed={collapsed} active={PURCHASES.children.some(c => isActive(c.path))} />

          <NavGroup item={TIME_ATTENDANCE} collapsed={collapsed} active={TIME_ATTENDANCE.children.some(c => isActive(c.path))} />

          {isAdmin && (
            <>
              <div className={cn("pt-4 pb-2", collapsed ? "px-0" : "px-2")}>
                {!collapsed && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">Admin</p>
                )}
                {collapsed && <div className="border-t border-sidebar-border" />}
              </div>
              {ADMIN_ITEMS.map(item => (
                <NavItem key={item.path} item={item} collapsed={collapsed} active={isActive(item.path)} />
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowLogoutDialog(true)}
                className={cn(
                  "flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
                  collapsed && "justify-center px-0"
                )}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="text-sidebar-foreground">Sign Out</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
          </Tooltip>
        </div>

        <LogoutConfirmationDialog
          open={showLogoutDialog}
          onOpenChange={setShowLogoutDialog}
          onConfirm={handleLogout}
        />
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
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
        >
          <Icon className={cn("w-[18px] h-[18px] flex-shrink-0", active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70")} />
          {!collapsed && <span>{item.label}</span>}
        </Link>
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
    </Tooltip>
  );
}

// Nav item with hover-revealed sub-tabs (e.g. Purchases)
function NavGroup({ item, collapsed, active }) {
  const location = useLocation();
  const Icon = item.icon;
  const childActive = (path) => location.pathname.startsWith(path);
  // The flyout is fixed-positioned at the row's edge — the nav's scroll
  // container would clip an absolutely-positioned flyout (overflow-y:auto
  // also clips on the x axis), which is why plain CSS positioning failed.
  const [pos, setPos] = useState(null); // { top, left } while hovering
  const open = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ top: r.top, left: r.right });
  };

  return (
    <div onMouseEnter={open} onMouseLeave={() => setPos(null)}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
          collapsed && "justify-center px-0",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <Icon className={cn("w-[18px] h-[18px] flex-shrink-0", active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70")} />
        {!collapsed && <span>{item.label}</span>}
      </div>
      {pos && (
        <div
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-50 min-w-[220px] rounded-lg border border-sidebar-border bg-sidebar py-1.5 px-1.5 shadow-xl"
        >
          {item.children.map(child => {
            const ChildIcon = child.icon;
            const isChildActive = childActive(child.path);
            return (
              <Link
                key={child.path}
                to={child.path}
                onClick={() => setPos(null)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isChildActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <ChildIcon className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}