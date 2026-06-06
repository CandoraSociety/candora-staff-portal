import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Search, Shield, Building2 } from 'lucide-react';
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

export default function UsersAccess() {
  const { access } = useOutletContext();
  const [search, setSearch] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.entities.AccessPermission.list(),
  });

  if (!access.isAdmin) return <p className="text-muted-foreground">Access denied</p>;

  const deptMap = Object.fromEntries(departments.map(d => [d.id, d]));
  
  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const getUserPermissionCount = (userId) => {
    return permissions.filter(p => p.scope_type === 'individual' && p.scope_value === userId).length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Users & Access
        </h1>
        <p className="text-sm text-muted-foreground mt-1">View all users and their current access summary. Full permission management is in the HR module.</p>
      </div>

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