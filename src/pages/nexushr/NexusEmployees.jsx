import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Eye, Mail, Phone, MapPin, Pencil, ShieldCheck, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { buildPresetsForTier } from '@/lib/tierPermissionPresets';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';
import EmployeeForm from '@/components/employees/EmployeeForm';

export default function NexusEmployees() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [inviting, setInviting] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const user = outletContext?.user;
  const { toast } = useToast();

  // Tiers that get admin role; everyone else gets 'user'
  const ADMIN_TIERS = ['executive_director', 'director'];

  const handleAddEmployee = async (data) => {
    setInviting(true);
    try {
      // 1. Create employee record
      const role = ADMIN_TIERS.includes(data.org_tier) ? 'admin' : 'user';
      const employee = await base44.entities.Employee.create(data);

      // 2. Send platform invite so they can log in
      let invitedUserId = null;
      try {
        const inviteResult = await base44.users.inviteUser(data.email, role);
        invitedUserId = inviteResult?.id || inviteResult?.user_id || null;
        await base44.entities.Employee.update(employee.id, { invite_sent: true });
        toast({ title: 'Employee added & invite sent', description: `An invitation email was sent to ${data.email}.` });
      } catch (inviteErr) {
        toast({ title: 'Employee added', description: `Could not send invite: ${inviteErr.message}. You can resend it later.`, variant: 'destructive' });
      }

      // 3. Apply tier-based access permission presets (using email as scope_value if no user id yet)
      if (data.org_tier) {
        const scopeId = invitedUserId || data.email;
        const presets = buildPresetsForTier(data.org_tier, scopeId);
        await Promise.all(presets.map(p => base44.entities.AccessPermission.create(p)));
      }

      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowForm(false);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setInviting(false);
    }
  };

  const { data: employees = [], isLoading } = useQuery({ 
    queryKey: ['employees'], 
    queryFn: () => base44.entities.Employee.list('-created_date', 500) 
  });



  const filtered = employees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.position} ${e.department} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        actions={<Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Add Employee</Button>}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading employees...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Eye} title="No employees found" description="Add your first employee to get started." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Position</th>
                  <th className="p-4 font-medium hidden md:table-cell">Department</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium hidden sm:table-cell">Invite</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(emp => {
                  const isMe = user?.email && emp.email?.toLowerCase() === user.email.toLowerCase();
                  return (
                  <tr key={emp.id} className={`cursor-pointer transition-colors ${isMe ? 'bg-emerald-50 hover:bg-emerald-100 border-l-4 border-l-emerald-500' : 'hover:bg-muted/30'}`} onClick={() => navigate(`/nexushr/employees/${emp.id}`)}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${emp.is_deceased ? 'bg-gray-200 text-gray-600' : isMe ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary'}`}>
                          {emp.is_deceased ? '🕊️' : `${emp.first_name?.[0]}${emp.last_name?.[0]}`}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${emp.is_deceased ? 'text-gray-500' : ''}`}>{emp.first_name} {emp.last_name}</p>
                            {isMe && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-full">
                                <ShieldCheck className="w-3 h-3" /> You
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>{emp.position}</div>
                      {emp.org_tier && <div className="text-xs text-muted-foreground capitalize">{emp.org_tier.replace(/_/g, ' ')}</div>}
                    </td>
                    <td className="p-4 hidden md:table-cell">{emp.department}</td>
                    <td className="p-4">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      {emp.invite_sent
                        ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full"><UserPlus className="w-3 h-3" />Invited</span>
                        : <span className="text-xs text-muted-foreground">No invite</span>
                      }
                    </td>
                    <td className="p-4"><Eye className="w-4 h-4 text-muted-foreground" /></td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent><DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
          <EmployeeForm onSubmit={handleAddEmployee} isLoading={inviting} />
        </DialogContent>
      </Dialog>

    </div>
  );
}