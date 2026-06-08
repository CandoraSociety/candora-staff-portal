import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Briefcase, Calendar, Clock,
  Award, GraduationCap, FileText, CheckSquare,
  ChevronLeft, ChevronRight, LogOut, Upload, Mail,
  Cake, Trophy, CalendarDays, ExternalLink, ClipboardList
} from 'lucide-react';

const navItems = [
  { path: '/volunteermgr', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/volunteermgr/volunteers', label: 'Volunteers', icon: Users },
  { path: '/volunteermgr/positions', label: 'Positions', icon: Briefcase },
  { path: '/volunteermgr/events', label: 'Events', icon: Calendar },
  { path: '/volunteermgr/schedule', label: 'Schedule', icon: CalendarDays },
  { path: '/volunteermgr/timelogs', label: 'Time Logs', icon: Clock },
  { path: '/volunteermgr/training', label: 'Training', icon: GraduationCap },
  { path: '/volunteermgr/recognition', label: 'Recognition', icon: Award },
  { path: '/volunteermgr/documents', label: 'Documents', icon: FileText },
  { path: '/volunteermgr/approvals', label: 'Approvals', icon: CheckSquare },
  { path: '/volunteermgr/import', label: 'Import', icon: Upload },
  { path: '/volunteermgr/email', label: 'Email', icon: Mail },
  { path: '/volunteermgr/milestones', label: 'Milestones', icon: Trophy },
  { path: '/volunteermgr/staff-requests', label: 'Staff Requests', icon: ClipboardList },
];


const externalLinks = [
  { href: '/volunteer-portal', label: 'Volunteer Portal', icon: ExternalLink },
  { href: '/staff-portal', label: 'Staff Portal', icon: ExternalLink },
];

function VolunteerSidebar({ collapsed, setCollapsed }) {
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pendingApprovalsCount = 0 } = useQuery({
    queryKey: ['vol-approvals-pending-count'],
    queryFn: async () => {
      const [approvals, profileChanges, cohortRequests, practicumRequests] = await Promise.all([
        base44.entities.VolunteerApproval.filter({ status: 'pending' }),
        base44.entities.VolunteerProfileChange.filter({ status: 'pending' }),
        base44.entities.VolunteerCohortRequest.filter({ status: 'pending' }),
        base44.entities.VolunteerApproval.filter({ request_type: 'practicum_placement', status: 'pending' }),
      ]);
      return approvals.length + profileChanges.length + cohortRequests.length + practicumRequests.length;
    },
    refetchInterval: 30000,
  });

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside className={cn(
      'h-screen flex flex-col transition-all duration-300 shrink-0',
      'bg-[hsl(230,60%,12%)]',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo area */}
      <div className="border-b border-[hsl(230,50%,18%)] px-3 pt-4 pb-3">
        <Link to="/" className={cn('flex items-center gap-2 group', collapsed ? 'justify-center' : '')}>
          {collapsed ? (
            <img
              src="https://media.base44.com/images/public/6a15e361478575d63a95c265/562a66657_Candoracirclelogo_noanniversary.png"
              alt="Candora"
              className="w-9 h-9 object-contain"
            />
          ) : (
            <img
              src="https://media.base44.com/images/public/6a15e361478575d63a95c265/ded6d4d7a_Candoralogo_noanniversary.png"
              alt="The Candora Society"
              className="h-24 object-contain"
            />
          )}
        </Link>
        <div className={cn('flex items-center mt-2', collapsed ? 'justify-center' : 'justify-between')}>
          {!collapsed && (
            <span className="text-[10px] uppercase tracking-widest text-[hsl(45,60%,70%)] font-semibold">
              Volunteer Manager
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-[hsl(230,55%,20%)] text-[hsl(45,60%,70%)] transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item);
          const hasNotifications = item.path === '/volunteermgr/approvals' && pendingApprovalsCount > 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-[hsl(45,92%,53%)] text-[hsl(230,60%,12%)] font-semibold'
                  : 'text-[hsl(45,60%,80%)] hover:bg-[hsl(230,55%,20%)] hover:text-[hsl(45,92%,90%)]',
                collapsed && 'justify-center'
              )}
            >
              <div className="relative">
                <Icon className="w-4 h-4 shrink-0" />
                {hasNotifications && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[hsl(230,60%,12%)]" />
                )}
              </div>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* External links */}
      <div className="px-2 py-2 border-t border-[hsl(230,50%,18%)] space-y-0.5">
        {externalLinks.map(link => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors',
              'text-[hsl(45,60%,65%)] hover:bg-[hsl(230,55%,20%)] hover:text-[hsl(45,92%,90%)]',
              collapsed && 'justify-center'
            )}
          >
            <link.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{link.label} ↗</span>}
          </a>
        ))}
      </div>

      {/* User + sign out */}
      <div className={cn('p-2 border-t border-[hsl(230,50%,18%)] space-y-0.5', collapsed && 'flex flex-col items-center')}>
        {!collapsed && user && (
          <p className="text-[11px] text-[hsl(45,40%,60%)] px-2 mb-1 truncate">{user.full_name || user.email}</p>
        )}
        <button
          onClick={() => base44.auth.logout()}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm transition-colors',
            'text-[hsl(45,60%,65%)] hover:bg-[hsl(230,55%,20%)] hover:text-[hsl(45,92%,90%)]',
            collapsed && 'justify-center w-auto'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && 'Sign Out'}
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