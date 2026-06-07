import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Briefcase, Calendar, Clock,
  Award, GraduationCap, FileText, CheckSquare, ChevronLeft,
  ChevronRight, LogOut, Upload, Mail, Cake, Trophy
} from 'lucide-react';

const navItems = [
  { path: '/volunteermgr', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/volunteermgr/volunteers', label: 'Volunteers', icon: Users },
  { path: '/volunteermgr/positions', label: 'Positions', icon: Briefcase },
  { path: '/volunteermgr/events', label: 'Events', icon: Calendar },
  { path: '/volunteermgr/timelogs', label: 'Time Logs', icon: Clock },
  { path: '/volunteermgr/training', label: 'Training', icon: GraduationCap },
  { path: '/volunteermgr/recognition', label: 'Recognition', icon: Award },
  { path: '/volunteermgr/documents', label: 'Documents', icon: FileText },
  { path: '/volunteermgr/approvals', label: 'Approvals', icon: CheckSquare },
  { path: '/volunteermgr/import', label: 'Import', icon: Upload },
  { path: '/volunteermgr/email', label: 'Email', icon: Mail },
  { path: '/volunteermgr/import', label: 'Import', icon: Upload },
  { path: '/volunteermgr/email', label: 'Email', icon: Mail },
  { path: '/volunteermgr/birthdays', label: 'Birthdays', icon: Cake },
  { path: '/volunteermgr/milestones', label: 'Milestones', icon: Trophy },
];

function VolunteerSidebar({ collapsed, setCollapsed }) {
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  return (
    <aside className={cn(
      'h-screen flex flex-col bg-card border-r border-border transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>
      <div className="border-b border-border">
        <Link
          to="/"
          className={cn(
            'flex items-center gap-2 px-3 py-3 w-full hover:bg-primary/10 transition-colors group',
            collapsed ? 'justify-center' : ''
          )}
        >
          <ChevronLeft className="w-4 h-4 shrink-0 text-primary group-hover:text-primary" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-muted-foreground leading-none">← Back to</span>
              <span className="font-bold text-sm text-primary truncate">Dashboard</span>
            </div>
          )}
        </Link>
        <div className={cn('flex items-center h-10 px-3 border-t border-border/50', collapsed ? 'justify-center' : 'justify-between')}>
          {!collapsed && <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Volunteer Manager</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-muted text-muted-foreground">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={cn(
              'flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors',
              active ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center'
            )}>
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn('p-2 border-t border-border space-y-0.5', collapsed && 'flex flex-col items-center')}>
        {!collapsed && user && <p className="text-xs text-muted-foreground px-2 mb-1 truncate">{user.full_name || user.email}</p>}
        <button
          onClick={() => base44.auth.logout()}
          className={cn('flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors', collapsed && 'justify-center w-auto')}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}

export default function VolunteerMgrLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <VolunteerSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}