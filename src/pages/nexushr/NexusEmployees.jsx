import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAccessLevel } from '@/lib/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Search, Eye } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import AccessDenied from '@/components/shared/AccessDenied';
import EmployeeForm from '@/components/employees/EmployeeForm';
import EmployeeDetail from '@/components/employees/EmployeeDetail';

export default function NexusEmployees() {
  const { isHRAdmin, isManager } = useAccessLevel();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list('-created_date', 200) });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); setShowForm(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); setEditingEmployee(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Employee.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); setViewingEmployee(null); },
  });

  if (!isManager) return <AccessDenied />;

  const filtered = employees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.position} ${e.department} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        actions={isHRAdmin && <Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Add Employee</Button>}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No employees found" description="Add your first employee to get started." />
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
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setViewingEmployee(emp)}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                          <p className="text-muted-foreground text-xs">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{emp.position}</td>
                    <td className="p-4 hidden md:table-cell">{emp.department}</td>
                    <td className="p-4"><StatusBadge status={emp.status} /></td>
                    <td className="p-4"><Eye className="w-4 h-4 text-muted-foreground" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent><DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
          <EmployeeForm onSubmit={createMutation.mutate} isLoading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingEmployee} onOpenChange={() => setViewingEmployee(null)}>
        <DialogContent className="max-w-2xl">
          <EmployeeDetail
            employee={viewingEmployee}
            isHRAdmin={isHRAdmin}
            onEdit={() => { setEditingEmployee(viewingEmployee); setViewingEmployee(null); }}
            onDelete={() => deleteMutation.mutate(viewingEmployee.id)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}