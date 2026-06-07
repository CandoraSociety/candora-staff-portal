import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAccessLevel } from '@/lib/useAuth';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, FileText, ClipboardList, AlertTriangle,
  GraduationCap, Scale, BookOpen, TrendingUp, DollarSign,
  Shield, ChevronLeft, ChevronRight, LogOut, Award
} from 'lucide-react';

const allNavItems = [
  { path: '/nexushr', label: 'Dashboard', icon: LayoutDashboard, access: 'manager' },
  { path: '/nexushr/employees', label: 'Employees', icon: Users, access: 'manager' },
  { path: '/nexushr/reviews', label: 'Performance Reviews', icon: ClipboardList, access: 'manager' },
  { path: '/nexushr/incidents', label: 'Incident Reports', icon: AlertTriangle, access: 'manager' },
  { path: '/nexushr/training', label: 'Training & Certs', icon: GraduationCap, access: 'manager' },
  { path: '/nexushr/documents', label: 'Documents', icon: BookOpen, access: 'manager' },
  { path: '/nexushr/contracts', label: 'Contracts', icon: FileText, access: 'hr_admin' },
  { path: '/nexushr/corrective-actions', label: 'Corrective Actions', icon: Shield, access: 'hr_admin' },
  { path: '/nexushr/legal', label: 'Legal Cases', icon: Scale, access: 'hr_admin' },
  { path: '/nexushr/career-plans', label: 'Career & Succession', icon: TrendingUp, access: 'hr_admin' },
  { path: '/nexushr/pay-grid', label: 'Pay Grid', icon: DollarSign, access: 'hr_admin' },
  { path: '/nexushr/service-awards', label: 'Service Awards', icon: Award, access: 'hr_admin' },
];

function NexusSidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { isHRAdmin, isManager, user } = useAccessLevel();

  const filteredItems = allNavItems.filter(item => {
    if (item.access === 'hr_admin') return isHRAdmin;
    if (item.access === 'manager') return isManager;
    return true;
  });

  return (
    <aside className={cn(
      'h-screen flex flex-col bg-card border-r border-border transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>
      <div className={cn('flex items-center h-14 px-3 border-b border-border', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && <span className="font-bold text-sm text-foreground">HR Management</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-muted text-muted-foreground">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {filteredItems.map(item => {
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
        <Link
          to="/"
          className={cn('flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors', collapsed && 'justify-center w-auto')}
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          {!collapsed && 'Back to Portal'}
        </Link>
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