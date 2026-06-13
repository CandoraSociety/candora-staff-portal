import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, AppWindow, Building2, Shield, Activity, ChevronRight, X } from 'lucide-react';

function UserListModal({ users, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">All Users</span>
            <Badge variant="secondary" className="text-xs">{users.length}</Badge>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-1">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/40 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate"><span>{u.full_name || '—'}</span></p>
                <p className="text-xs text-muted-foreground truncate"><span>{u.email}</span></p>
              </div>
              <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-xs capitalize flex-shrink-0">
                {u.role || 'user'}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LiveDataWidget({ stats, allUsers = [], departments = [], permissions = [] }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showUserList, setShowUserList] = useState(false);

  const { data: recentUsers = [] } = useQuery({
    queryKey: ['recentUsersActivity'],
    queryFn: () => base44.entities.User.list('-created_date', 5),
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'system', label: 'System', icon: AppWindow },
  ];

  return (
    <>
      {showUserList && <UserListModal users={allUsers} onClose={() => setShowUserList(false)} />}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Live Data
            </CardTitle>
            <div className="flex gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              {[
                { label: 'Registered Users', value: allUsers.length, icon: Users, color: 'text-primary bg-primary/10', clickable: true },
                { label: 'Active Portals', value: stats?.cards || 0, icon: AppWindow, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
                { label: 'Departments', value: departments.length, icon: Building2, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
                { label: 'Permission Roles', value: permissions.length, icon: Shield, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    onClick={item.clickable ? () => setShowUserList(true) : undefined}
                    className={`rounded-xl border border-border/50 bg-card p-4 ${item.clickable ? 'cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all group' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color} mb-2`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-display font-bold text-foreground flex items-center gap-1">
                      <span>{item.value}</span>
                      {item.clickable && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5"><span>{item.label}</span></p>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground"><span>{allUsers.length} total registered users</span></span>
                <button
                  onClick={() => setShowUserList(true)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  View all
                </button>
              </div>
              {/* Role breakdown */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {['admin', 'user'].map(role => {
                  const count = allUsers.filter(u => u.role === role).length;
                  return (
                    <div key={role} className="rounded-lg bg-muted/40 p-3 flex items-center justify-between">
                      <span className="text-xs font-medium capitalize text-foreground"><span>{role}s</span></span>
                      <Badge variant={role === 'admin' ? 'default' : 'secondary'} className="text-xs">{count}</Badge>
                    </div>
                  );
                })}
              </div>
              {/* Recently joined */}
              <p className="text-xs font-medium text-muted-foreground mb-1">Recently Joined</p>
              <div className="space-y-1">
                {recentUsers.slice(0, 5).map(u => (
                  <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-semibold text-primary">
                        {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-foreground flex-1 truncate"><span>{u.full_name || u.email}</span></span>
                    <Badge variant="secondary" className="text-[10px] capitalize">{u.role || 'user'}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Total Portal Cards', value: stats?.cards || 0, sub: 'Active modules' },
                  { label: 'Departments', value: departments.length, sub: departments.map(d => d.name).slice(0, 3).join(', ') || 'None configured' },
                  { label: 'Permission Roles', value: permissions.length, sub: permissions.slice(0, 3).join(', ') || 'None configured' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
                    <div>
                      <p className="text-xs font-medium text-foreground"><span>{item.label}</span></p>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[220px]"><span>{item.sub}</span></p>
                    </div>
                    <span className="text-lg font-display font-bold text-foreground"><span>{item.value}</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}