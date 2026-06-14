import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAccessLevel } from '@/lib/useAuth';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { useOrgSettings } from '@/lib/useOrgSettings';
import {
  LayoutDashboard, Users, FileText, ClipboardList, AlertTriangle,
  GraduationCap, Scale, BookOpen, TrendingUp, DollarSign,
  Shield, ChevronLeft, ChevronRight, LogOut, Award, Home, Clock, Star, Mail
} from 'lucide-react';

const allNavItems = [
  { path: '/nexushr', label: 'Dashboard', icon: LayoutDashboard, access: 'manager' },
  { path: '/nexushr/employees', label: 'Employees', icon: Users, access: 'manager' },
  { path: '/nexushr/reviews', label: 'Performance Reviews', icon: ClipboardList, access: 'manager' },
  { path: '/nexushr/incidents', label: 'Incident Reports', icon: AlertTriangle, access: 'manager' },
  { path: '/nexushr/training', label: 'Training & Certs', icon: GraduationCap, access: 'manager' },
  { path: '/nexushr/documents', label: 'Documents', icon: BookOpen, access: 'manager' },
  { path: '/nexushr/time-logs', label: 'Time Logs', icon: Clock, access: 'manager' },
  { path: '/nexushr/recognition', label: 'Recognition', icon: Star, access: 'manager' },
  { path: '/nexushr/email-employees', label: 'Email Employees', icon: Mail, access: 'manager' },
  { path: '/nexushr/contracts', label: 'Contracts', icon: FileText, access: 'hr_admin' },
  { path: '/nexushr/corrective-actions', label: 'Corrective Actions', icon: Shield, access: 'hr_admin' },
  { path: '/nexushr/legal', label: 'Legal Cases', icon: Scale, access: 'hr_admin' },
  { path: '/nexushr/career-plans', label: 'Career & Succession', icon: TrendingUp, access: 'hr_admin' },
  { path: '/nexushr/pay-grid', label: 'Pay Grid', icon: DollarSign, access: 'hr_admin' },
  { path: '/nexushr/service-awards', label: 'Service Awards', icon: Award, access: 'hr_admin' },
  { path: '/nexushr/onboarding', label: 'Onboarding', icon: Users, access: 'hr_admin' },
];

function NexusSidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { isHRAdmin, isManager } = useAccessLevel();
  const { logoUrl } = useOrgSettings();
  const [user, setUser] = React.useState(null);
  React.useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const filteredItems = allNavItems.filter(item => {
    if (item.access === 'hr_admin') return isHRAdmin;
    if (item.access === 'manager') return isManager;
    return true;
  });

  return (
    <aside className={cn(
      'h-screen flex flex-col transition-all duration-300 flex-shrink-0',
      collapsed ? 'w-16' : 'w-60'
    )} style={{ backgroundColor: 'hsl(var(--sidebar-background))', borderRight: '1px solid hsl(var(--sidebar-border))' }}>

      {/* Logo / Branding */}
      <div className={cn('flex items-center gap-3 px-3 py-4 border-b', collapsed ? 'justify-center' : '')}
        style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src={logoUrl} alt="Candora" className="w-8 h-8 rounded-full flex-shrink-0" />
        </Link>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display font-bold text-sm leading-none" style={{ color: 'hsl(var(--sidebar-primary))' }}>CANDORA</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'hsl(var(--sidebar-foreground)/0.6)' }}>HR Management</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn('ml-auto p-1 rounded transition-colors hover:bg-white/10', collapsed && 'ml-0')}
          style={{ color: 'hsl(var(--sidebar-foreground)/0.5)' }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Back to Home */}
      <Link
        to="/"
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-white/10',
          collapsed ? 'justify-center' : ''
        )}
        style={{ color: 'hsl(var(--sidebar-foreground)/0.7)', borderBottom: '1px solid hsl(var(--sidebar-border))' }}
      >
        <Home className="w-4 h-4 flex-shrink-0" />
        {!collapsed && <span className="text-xs">Back to Dashboard</span>}
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {filteredItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors',
                collapsed && 'justify-center'
              )}
              style={active
                ? { backgroundColor: 'hsl(var(--sidebar-primary))', color: 'hsl(var(--sidebar-primary-foreground))' }
                : { color: 'hsl(var(--sidebar-foreground)/0.75)' }
              }
              onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'hsl(var(--sidebar-accent))'; e.currentTarget.style.color = 'hsl(var(--sidebar-accent-foreground))'; }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'hsl(var(--sidebar-foreground)/0.75)'; } }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn('p-2 space-y-0.5', collapsed && 'flex flex-col items-center')}
        style={{ borderTop: '1px solid hsl(var(--sidebar-border))' }}>
        {!collapsed && user && (
          <p className="text-xs px-2 mb-1 truncate" style={{ color: 'hsl(var(--sidebar-foreground)/0.5)' }}>
            <span>{user.full_name || user.email}</span>
          </p>
        )}
        <button
          onClick={() => base44.auth.logout()}
          className={cn('flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm transition-colors hover:bg-white/10', collapsed && 'justify-center w-auto')}
          style={{ color: 'hsl(var(--sidebar-foreground)/0.6)' }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

export default function NexusLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <NexusSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}