import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AppChangeRequestsWidget from '@/components/appchanges/AppChangeRequestsWidget';
import { 
  Shield, Users, AppWindow, LayoutDashboard, Megaphone, Settings, 
  CheckCircle2, ArrowRight, Building2, Bell, UserCog
} from 'lucide-react';

const ADMIN_TOOLS = [
  { path: '/admin/cards', label: 'Manage Cards', description: 'Configure portal cards visible to staff', icon: AppWindow, color: '#3b82f6' },
  { path: '/admin/widgets', label: 'Manage Widgets', description: 'Control dashboard widgets and defaults', icon: LayoutDashboard, color: '#8b5cf6' },
  { path: '/admin/users', label: 'Users & Access', description: 'Manage user roles, permissions & access', icon: Users, color: '#22c55e' },
  { path: '/admin/announcements', label: 'Announcements', description: 'Create and manage staff announcements', icon: Megaphone, color: '#f59e0b' },
  { path: '/admin/settings', label: 'Org Settings', description: 'Organization branding and configuration', icon: Settings, color: '#ec4899' },
  { path: '/dev-tasks', label: 'Dev Tasks', description: 'Development task tracking', icon: CheckCircle2, color: '#64748b' },
];

export default function AdminDashboard() {
  const { user, access, permissions } = useOutletContext();

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: cards = [] } = useQuery({
    queryKey: ['portalCards'],
    queryFn: () => base44.entities.PortalCard.list(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date'),
  });

  const stats = [
    { label: 'Total Users', value: allUsers.length, icon: Users, color: '#22c55e', href: '/admin/users' },
    { label: 'Portal Cards', value: cards.filter(c => c.is_enabled).length, icon: AppWindow, color: '#3b82f6', href: '/admin/cards' },
    { label: 'Departments', value: departments.length, icon: Building2, color: '#8b5cf6', href: '/admin/users' },
    { label: 'Permissions', value: permissions.length, icon: UserCog, color: '#ec4899', href: '/admin/users' },
    { label: 'Announcements', value: announcements.filter(a => a.is_active).length, icon: Bell, color: '#f59e0b', href: '/admin/announcements' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
          <Shield className="h-6 w-6 text-accent-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System administration & configuration overview</p>
        </div>
      </div>

      {/* App Change Requests — admin review panel */}
      {user?.email?.toLowerCase() === 'graham.currie@candorasociety.com' && (
        <AppChangeRequestsWidget />
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium">{stat.label}</CardTitle>
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: stat.color + '20' }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Admin Tools */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-3">Admin Tools</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ADMIN_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.path} to={tool.path}>
                <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full group">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tool.color + '22' }}>
                        <Icon className="h-5 w-5" style={{ color: tool.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{tool.label}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Latest staff accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {allUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users found.</p>
          ) : (
            <div className="space-y-2">
              {allUsers.slice(0, 5).map(u => (
                <div key={u.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{u.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                    {u.role || 'user'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}