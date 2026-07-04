import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LOCKED_PORTAL_ACCESS, DEFAULT_TIER_CONFIGS } from '@/lib/tierPermissionPresets';
import { ADMIN_ROLES } from '@/lib/useAccessControl';
import { Search, Shield, AlertCircle, CheckCircle2, Lock, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const ADMIN_ROLE_NAMES = ['super_admin', 'executive_director', 'admin'];

export default function UserPortalAccessPanel() {
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['allEmployees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: cards = [] } = useQuery({
    queryKey: ['portalCards'],
    queryFn: () => base44.entities.PortalCard.list(),
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.entities.AccessPermission.list(),
  });

  const { data: orgSettingsList = [] } = useQuery({
    queryKey: ['orgSettings'],
    queryFn: () => base44.entities.OrgSettings.list(),
  });

  const tierConfigs = orgSettingsList[0]?.tier_configs?.length > 0
    ? orgSettingsList[0].tier_configs
    : DEFAULT_TIER_CONFIGS;
  const tierLabels = Object.fromEntries(tierConfigs.map(t => [t.id, t.label]));
  const tierPortalAccess = orgSettingsList[0]?.tier_portal_access || {};

  // Derive portal modules from PortalCards (same logic as the matrix)
  const portalModules = useMemo(() => {
    const fromCards = cards
      .filter(c => c.is_enabled && c.url && !c.is_external)
      .map(c => ({
        id: c.url.replace(/^\//, '').split('/')[0],
        label: c.name,
        route: c.url,
      }))
      .filter(m => m.id && m.id !== 'admin')
      .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i);

    for (const modId of Object.keys(LOCKED_PORTAL_ACCESS)) {
      if (!fromCards.some(m => m.id === modId)) {
        fromCards.push({ id: modId, label: 'Executive Director Portal', route: '/ed' });
      }
    }
    return fromCards;
  }, [cards]);

  // Compute accessible portals for a given user
  const getUserPortals = (user) => {
    if (ADMIN_ROLE_NAMES.includes(user.role)) {
      return portalModules;
    }

    const emp = employees.find(e => e.email?.toLowerCase() === user.email?.toLowerCase());
    const orgTier = emp?.org_tier;
    const tierAccess = orgTier ? (tierPortalAccess[orgTier] || []) : [];

    const individualAllows = permissions
      .filter(p => p.target_type === 'module' && p.scope_type === 'individual' &&
        (p.scope_value === user.id || p.scope_value === user.email) && p.is_active && p.permission === 'allow')
      .map(p => p.target_id);

    const individualDenies = permissions
      .filter(p => p.target_type === 'module' && p.scope_type === 'individual' &&
        (p.scope_value === user.id || p.scope_value === user.email) && p.is_active && p.permission === 'deny')
      .map(p => p.target_id);

    const lockedForUser = orgTier
      ? Object.entries(LOCKED_PORTAL_ACCESS).filter(([, tier]) => tier === orgTier).map(([modId]) => modId)
      : [];

    return portalModules.filter(p => {
      if (individualDenies.includes(p.moduleId || p.id) || individualDenies.includes(p.id)) return false;
      if (individualAllows.includes(p.moduleId || p.id) || individualAllows.includes(p.id)) return true;
      if (lockedForUser.includes(p.id)) return true;
      if (tierAccess.includes(p.id)) return true;
      return false;
    });
  };

  const getUserTier = (user) => {
    const emp = employees.find(e => e.email?.toLowerCase() === user.email?.toLowerCase());
    return emp?.org_tier;
  };

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aAdmin = ADMIN_ROLE_NAMES.includes(a.role) ? 0 : 1;
    const bAdmin = ADMIN_ROLE_NAMES.includes(b.role) ? 0 : 1;
    if (aAdmin !== bAdmin) return aAdmin - bAdmin;
    return (a.full_name || '').localeCompare(b.full_name || '');
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>This view shows every user and the portals they can access, based on their role, position type, and any individual overrides. It updates automatically as users, employees, or access presets change.</p>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid gap-2">
        {sortedUsers.map(user => {
          const initials = (user.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          const isAdmin = ADMIN_ROLE_NAMES.includes(user.role);
          const tier = getUserTier(user);
          const tierLabel = tier ? (tierLabels[tier] || tier) : '—';
          const portals = getUserPortals(user);
          const isExpanded = expandedUser === user.id;

          return (
            <Card key={user.id} className="shadow-sm">
              <CardContent className="p-3">
                <button
                  onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                  className="flex items-center gap-3 w-full text-left"
                >
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{user.full_name || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    {isAdmin && (
                      <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                        Admin — All Access
                      </Badge>
                    )}
                    {!isAdmin && (
                      <Badge variant="outline" className="text-[10px]">
                        {tierLabel}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {portals.length} portal{portals.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    {!isAdmin && !tier && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        No employee record or position type found — this user has no portal access until they're added to HR with a position type.
                      </div>
                    )}
                    {portals.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No portal access.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {portals.map(p => (
                          <Badge
                            key={p.id}
                            variant="secondary"
                            className="text-[11px] gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            {LOCKED_PORTAL_ACCESS[p.id] && <Lock className="w-2.5 h-2.5" />}
                            {p.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {sortedUsers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}