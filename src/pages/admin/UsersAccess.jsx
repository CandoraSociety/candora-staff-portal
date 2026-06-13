import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Search, Shield, Building2, Activity, AppWindow, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ROLES } from '@/lib/constants';

const roleColors = {
  super_admin: 'bg-destructive/10 text-destructive border-destructive/20',
  executive_director: 'bg-primary/10 text-primary border-primary/20',
  manager: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  team_lead: 'bg-accent/10 text-accent-foreground border-accent/20',
  frontline_staff: 'bg-secondary text-secondary-foreground border-border',
  board: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  extended: 'bg-muted text-muted-foreground border-border',
};

function UserListPanel({ users, departments, search, setSearch }) {
  const deptMap = Object.fromEntries(departments.map(d => [d.id, d]));

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.entities.AccessPermission.list(),
  });

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const getUserPermissionCount = (userId) =>
    permissions.filter(p => p.scope_type === 'individual' && p.scope_value === userId).length;

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid gap-3">
        {filteredUsers.map(user => {
          const initials = (user.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          const dept = deptMap[user.department_id];
          const roleLabel = ROLES.find(r => r.value === user.role)?.label || user.role || 'No role';
          const permCount = getUserPermissionCount(user.id);

          return (
            <Card key={user.id} className="shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{user.full_name || 'Unnamed'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  {dept && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Building2 className="w-3 h-3" />
                      {dept.name}
                    </Badge>
                  )}
                  <Badge className={`text-[10px] border ${roleColors[user.role] || roleColors.frontline_staff}`}>
                    {roleLabel}
                  </Badge>
                  {permCount > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Shield className="w-3 h-3" />
                      {permCount} overrides
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LiveDataPanel({ users, departments }) {
  const { data: cards = [] } = useQuery({
    queryKey: ['portalCards'],
    queryFn: () => base44.entities.PortalCard.list(),
  });

  const adminCount = users.filter(u => u.role === 'admin' || u.role === 'super_admin' || u.role === 'executive_director').length;
  const staffCount = users.length - adminCount;
  const activePortals = cards.filter(c => c.is_enabled).length;

  const roleBreakdown = ROLES.map(r => ({
    label: r.label,
    value: r.value,
    count: users.filter(u => u.role === r.value).length,
  })).filter(r => r.count > 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: 'text-primary bg-primary/10' },
          { label: 'Active Portals', value: activePortals, icon: AppWindow, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Departments', value: departments.length, icon: Building2, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-border/50 bg-card p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color} mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-display font-bold text-foreground"><span>{item.value}</span></p>
              <p className="text-xs text-muted-foreground mt-0.5"><span>{item.label}</span></p>
            </div>
          );
        })}
      </div>

      {/* Role breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Users by Role</h3>
        <div className="space-y-2">
          {roleBreakdown.map(r => (
            <div key={r.value} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-36 truncate"><span>{r.label}</span></span>
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${users.length ? (r.count / users.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs font-medium text-foreground w-6 text-right"><span>{r.count}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Departments */}
      {departments.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Departments</h3>
          <div className="flex flex-wrap gap-2">
            {departments.map(d => (
              <Badge key={d.id} variant="outline" className="text-xs gap-1">
                <Building2 className="w-3 h-3" />
                {d.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recently joined */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Recently Joined</h3>
        <div className="space-y-2">
          {[...users].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 8).map(u => (
            <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate"><span>{u.full_name || u.email}</span></p>
                <p className="text-xs text-muted-foreground"><span>{u.email}</span></p>
              </div>
              <Badge className={`text-[10px] border capitalize ${roleColors[u.role] || roleColors.frontline_staff}`}>
                {ROLES.find(r => r.value === u.role)?.label || u.role || 'user'}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UsersAccess() {
  const { access } = useOutletContext();
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  if (!access.isAdmin) return <p className="text-muted-foreground">Access denied</p>;

  const isExecutiveDirector = access.userRole === 'executive_director';
  const visibleUsers = isExecutiveDirector
    ? users
    : users.filter(u => u.role !== 'executive_director');

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'live', label: 'Live Data', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Users & Access
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage users and monitor platform activity.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'users' && (
        <UserListPanel users={visibleUsers} departments={departments} search={search} setSearch={setSearch} />
      )}
      {activeTab === 'live' && (
        <LiveDataPanel users={visibleUsers} departments={departments} />
      )}
    </div>
  );
}