import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Phone, Mail, Plus, Pencil, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import ClickToCallButton from '@/components/reception/ClickToCallButton';
import StaffProgramRoleDialog from '@/components/reception/StaffProgramRoleDialog';
import { STAFF_ROLE_OPTIONS, STAFF_ROLE_LABELS, STAFF_ROLE_COLORS, PROGRAM_PORTAL_LABELS } from '@/lib/receptionConstants';

export default function ReceptionStaffDirectory() {
  const [search, setSearch] = useState('');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [expandedStaff, setExpandedStaff] = useState(null);
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.filter({ is_deleted: false }) });
  const { data: programRoles = [] } = useQuery({ queryKey: ['staff-program-roles'], queryFn: () => base44.entities.StaffProgramRole.list() });

  const activeEmployees = employees.filter(e => e.status === 'active' || e.status === 'probation' || e.status === 'occasional');

  const filtered = activeEmployees.filter(e => {
    const name = `${e.first_name} ${e.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || (e.position || '').toLowerCase().includes(search.toLowerCase()) || (e.department || '').toLowerCase().includes(search.toLowerCase());
  });

  const getStaffRoles = (email) => programRoles.filter(r => r.staff_email === email && r.is_active !== false);

  const openAddRole = (employee) => { setEditingRole({ staff_email: employee.email, staff_name: `${employee.first_name} ${employee.last_name}` }); setRoleDialogOpen(true); };
  const openEditRole = (role) => { setEditingRole(role); setRoleDialogOpen(true); };
  const onSaved = () => { setRoleDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['staff-program-roles'] }); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Staff Directory</h1><p className="text-muted-foreground text-sm mt-1">Find staff, their roles, and programs they manage</p></div>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name, position, or department..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">No staff found</CardContent></Card> :
      (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)).map(emp => {
            const roles = getStaffRoles(emp.email);
            const isExpanded = expandedStaff === emp.id;
            return (
              <Card key={emp.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {emp.photo_url ? <img src={emp.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0"><span className="text-primary font-semibold text-sm">{emp.first_name?.[0]}{emp.last_name?.[0]}</span></div>}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{emp.first_name} {emp.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{emp.position}</p>
                      <p className="text-xs text-muted-foreground truncate">{emp.department}</p>
                    </div>
                  </div>
                  <div className="space-y-1 mb-2">
                    {emp.phone && <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> {emp.phone}</p><ClickToCallButton phone={emp.phone} name={`${emp.first_name} ${emp.last_name}`} /></div>}
                    {emp.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> {emp.email}</p>}
                  </div>
                  {roles.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Program Roles</p>
                      <div className="space-y-1">
                        {roles.slice(0, isExpanded ? undefined : 2).map(r => (
                          <div key={r.id} className="flex items-center justify-between gap-1">
                            <div className="min-w-0">
                              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: (STAFF_ROLE_COLORS[r.role] || '#64748b') + '20', color: STAFF_ROLE_COLORS[r.role] || '#64748b' }}>{r.role_label || STAFF_ROLE_LABELS[r.role] || r.role}</span>
                              <span className="text-xs text-muted-foreground ml-1">{r.program_name || PROGRAM_PORTAL_LABELS[r.program_portal] || r.program_portal}</span>
                            </div>
                            <button onClick={() => openEditRole(r)} className="text-muted-foreground hover:text-foreground flex-shrink-0"><Pencil className="h-3 w-3" /></button>
                          </div>
                        ))}
                        {roles.length > 2 && <button onClick={() => setExpandedStaff(isExpanded ? null : emp.id)} className="text-xs text-primary hover:underline">{isExpanded ? 'Show less' : `+${roles.length - 2} more`}</button>}
                      </div>
                    </div>
                  )}
                  <Button size="sm" variant="ghost" className="w-full mt-2 text-xs" onClick={() => openAddRole(emp)}><Plus className="h-3 w-3" /> Add Program Role</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <StaffProgramRoleDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen} role={editingRole} onSaved={onSaved} />
    </div>
  );
}