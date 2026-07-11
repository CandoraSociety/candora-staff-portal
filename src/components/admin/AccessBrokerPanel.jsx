import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PORTAL_MODULES, DEFAULT_TIER_CONFIGS } from '@/lib/tierPermissionPresets';
import { Search, Shield, KeyRound, Eye, EyeOff, DollarSign, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

const ADMIN_ROLE_NAMES = ['super_admin', 'executive_director', 'admin'];
const FILE_ACCESS_LEVELS = [
  { id: 'manager', label: 'Manager Files', description: 'Access to manager-level documents' },
  { id: 'finance', label: 'Finance Files', description: 'Access to financial records' },
  { id: 'corporate', label: 'Corporate Files', description: 'Access to corporate/HR documents' },
];

export default function AccessBrokerPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [saving, setSaving] = useState(null);

  const { data: employees = [], isLoading: empLoading } = useQuery({
    queryKey: ['allEmployees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
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

  const userByEmail = useMemo(() => {
    const map = {};
    users.forEach(u => { if (u.email) map[u.email.toLowerCase()] = u; });
    return map;
  }, [users]);

  const sortedEmployees = useMemo(() => {
    return [...employees]
      .filter(e => !e.is_deleted)
      .sort((a, b) => {
        const aName = `${a.first_name} ${a.last_name}`.toLowerCase();
        const bName = `${b.first_name} ${b.last_name}`.toLowerCase();
        return aName.localeCompare(bName);
      });
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!search) return sortedEmployees;
    const q = search.toLowerCase();
    return sortedEmployees.filter(e => {
      const name = `${e.first_name} ${e.last_name}`.toLowerCase();
      return name.includes(q) || e.email?.toLowerCase().includes(q);
    });
  }, [sortedEmployees, search]);

  const selectedEmp = employees.find(e => e.id === selectedEmpId);
  const selectedUser = selectedEmp?.email ? userByEmail[selectedEmp.email.toLowerCase()] : null;
  const isAdmin = selectedUser && ADMIN_ROLE_NAMES.includes(selectedUser.role);

  const empModulePerms = useMemo(() => {
    if (!selectedEmp?.email) return { allows: [], denies: [] };
    return permissions
      .filter(p => p.target_type === 'module' && p.scope_type === 'individual' &&
        p.scope_value?.toLowerCase() === selectedEmp.email.toLowerCase() && p.is_active)
      .reduce((acc, p) => {
        if (p.permission === 'allow') acc.allows.push(p.target_id);
        if (p.permission === 'deny') acc.denies.push(p.target_id);
        return acc;
      }, { allows: [], denies: [] });
  }, [permissions, selectedEmp]);

  const empFilePerms = useMemo(() => {
    if (!selectedEmp?.email) return [];
    return permissions
      .filter(p => p.target_type === 'file_access' && p.scope_type === 'individual' &&
        p.scope_value?.toLowerCase() === selectedEmp.email.toLowerCase() &&
        p.permission === 'allow' && p.is_active)
      .map(p => p.target_id);
  }, [permissions, selectedEmp]);

  const tierModules = selectedEmp?.org_tier ? (tierPortalAccess[selectedEmp.org_tier] || []) : [];

  const handleBillingToggle = async (checked) => {
    if (!selectedEmp) return;
    setSaving('billing');
    try {
      await base44.entities.Employee.update(selectedEmp.id, { can_access_billing: checked });
      queryClient.invalidateQueries(['allEmployees']);
      toast({
        title: checked ? 'Billing access granted' : 'Billing access revoked',
        description: `${selectedEmp.first_name} ${selectedEmp.last_name}`,
      });
    } catch (err) {
      toast({ title: 'Failed to update billing access', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const handleModuleToggle = async (moduleId, grant) => {
    if (!selectedEmp?.email) return;
    setSaving(`module-${moduleId}`);
    try {
      const existing = permissions.find(p =>
        p.target_type === 'module' && p.scope_type === 'individual' &&
        p.scope_value?.toLowerCase() === selectedEmp.email.toLowerCase() &&
        p.target_id === moduleId
      );

      if (grant) {
        if (existing) {
          if (existing.permission === 'allow' && existing.is_active) {
            // already granted
          } else {
            await base44.entities.AccessPermission.update(existing.id, { permission: 'allow', is_active: true });
          }
        } else {
          await base44.entities.AccessPermission.create({
            target_type: 'module',
            target_id: moduleId,
            scope_type: 'individual',
            scope_value: selectedEmp.email,
            permission: 'allow',
            is_active: true,
          });
        }
      } else {
        if (existing) {
          await base44.entities.AccessPermission.update(existing.id, { is_active: false });
        }
      }
      queryClient.invalidateQueries(['permissions']);
    } catch (err) {
      toast({ title: 'Failed to update portal access', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const handleFileAccessToggle = async (levelId, grant) => {
    if (!selectedEmp?.email) return;
    setSaving(`file-${levelId}`);
    try {
      const existing = permissions.find(p =>
        p.target_type === 'file_access' && p.scope_type === 'individual' &&
        p.scope_value?.toLowerCase() === selectedEmp.email.toLowerCase() &&
        p.target_id === levelId
      );

      if (grant) {
        if (existing) {
          if (!existing.is_active) {
            await base44.entities.AccessPermission.update(existing.id, { is_active: true, permission: 'allow' });
          }
        } else {
          await base44.entities.AccessPermission.create({
            target_type: 'file_access',
            target_id: levelId,
            scope_type: 'individual',
            scope_value: selectedEmp.email,
            permission: 'allow',
            is_active: true,
          });
        }
      } else {
        if (existing) {
          await base44.entities.AccessPermission.update(existing.id, { is_active: false });
        }
      }
      queryClient.invalidateQueries(['permissions']);
    } catch (err) {
      toast({ title: 'Failed to update file access', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-violet-50 border border-violet-200 text-sm text-violet-800">
        <KeyRound className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>Centralized permission management. Select an employee to grant or revoke portal access, file access levels, and billing access — all in one place.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Employee list */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {empLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : filteredEmployees.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No employees found</p>
            ) : (
              filteredEmployees.map(emp => {
                const name = `${emp.first_name} ${emp.last_name}`;
                const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                const isSelected = emp.id === selectedEmpId;
                const linkedUser = emp.email ? userByEmail[emp.email.toLowerCase()] : null;
                const hasBilling = emp.can_access_billing;

                return (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmpId(emp.id)}
                    className={`flex items-center gap-2.5 w-full text-left p-2.5 rounded-lg border transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                    }`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">{emp.email || 'No email'}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end flex-shrink-0">
                      {linkedUser && ADMIN_ROLE_NAMES.includes(linkedUser.role) && (
                        <Badge className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">Admin</Badge>
                      )}
                      {hasBilling && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-emerald-700 border-emerald-200 bg-emerald-50">
                          <DollarSign className="w-2.5 h-2.5 mr-0.5" />Billing
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Permission panel */}
        {!selectedEmp ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select an employee to manage their permissions</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Employee header */}
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {`${selectedEmp.first_name} ${selectedEmp.last_name}`.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{selectedEmp.first_name} {selectedEmp.last_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedEmp.email}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {selectedEmp.org_tier && (
                    <Badge variant="outline" className="text-[10px]">
                      {tierLabels[selectedEmp.org_tier] || selectedEmp.org_tier}
                    </Badge>
                  )}
                  {selectedEmp.position && (
                    <Badge variant="outline" className="text-[10px]">{selectedEmp.position}</Badge>
                  )}
                  {isAdmin && (
                    <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Platform Admin</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {isAdmin && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <p>This user is a platform admin and already has full access to all portals and files. Individual overrides below have no additional effect.</p>
              </div>
            )}

            {/* Billing Access */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Pathways Billing Access</p>
                      <p className="text-xs text-muted-foreground">Grants access to the billing tab in Pathways</p>
                    </div>
                  </div>
                  <Switch
                    checked={!!selectedEmp.can_access_billing}
                    onCheckedChange={handleBillingToggle}
                    disabled={saving === 'billing'}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Portal Module Access */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Portal Access Overrides</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Grant or revoke individual portal access. Tier-based access from position type is shown for reference — toggles here override the tier defaults.
                </p>
                <div className="space-y-1.5">
                  {PORTAL_MODULES.map(mod => {
                    const hasTierAccess = tierModules.includes(mod.id);
                    const hasIndividualAllow = empModulePerms.allows.includes(mod.id);
                    const hasIndividualDeny = empModulePerms.denies.includes(mod.id);
                    const isChecked = hasIndividualAllow || (hasTierAccess && !hasIndividualDeny);

                    return (
                      <div
                        key={mod.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{mod.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{mod.route}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {hasTierAccess && !hasIndividualAllow && !hasIndividualDeny && (
                            <Badge variant="outline" className="text-[9px] text-blue-600 border-blue-200 bg-blue-50">Via Tier</Badge>
                          )}
                          {hasIndividualAllow && (
                            <Badge variant="outline" className="text-[9px] text-violet-600 border-violet-200 bg-violet-50">Override</Badge>
                          )}
                          {hasIndividualDeny && (
                            <Badge variant="outline" className="text-[9px] text-destructive border-destructive/20 bg-destructive/5">Denied</Badge>
                          )}
                          <Switch
                            checked={isChecked}
                            onCheckedChange={(checked) => handleModuleToggle(mod.id, checked)}
                            disabled={saving === `module-${mod.id}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* File Access Levels */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">File Access Levels</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Grant access to restricted file categories in the File Manager beyond the default universal level.
                </p>
                <div className="space-y-1.5">
                  {FILE_ACCESS_LEVELS.map(level => {
                    const isGranted = empFilePerms.includes(level.id);
                    return (
                      <div
                        key={level.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border"
                      >
                        <div>
                          <p className="text-sm font-medium">{level.label}</p>
                          <p className="text-xs text-muted-foreground">{level.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isGranted && (
                            <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-200 bg-emerald-50">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Granted
                            </Badge>
                          )}
                          <Switch
                            checked={isGranted}
                            onCheckedChange={(checked) => handleFileAccessToggle(level.id, checked)}
                            disabled={saving === `file-${level.id}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}