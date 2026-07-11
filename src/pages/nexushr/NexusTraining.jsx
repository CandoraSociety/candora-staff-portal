import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSupervisorAccess } from '@/lib/useSupervisorAccess';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, GraduationCap } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import AccessDenied from '@/components/shared/AccessDenied';
import { format } from 'date-fns';

const trainingTypes = ['certification', 'course', 'workshop', 'orientation', 'safety', 'compliance', 'professional_development', 'other'];

export default function NexusTraining() {
  const { canAccessHR, user, isAdmin, directReports, directReportIds, employees } = useSupervisorAccess();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: '', employee_name: '', training_name: '', training_type: '', provider: '', completion_date: '', status: 'completed' });
  const queryClient = useQueryClient();

  const { data: trainings = [] } = useQuery({ queryKey: ['trainings'], queryFn: () => base44.entities.Training.list('-created_date', 200) });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Training.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trainings'] }); setShowForm(false); },
  });

  if (!canAccessHR) return <AccessDenied />;

  const visibleTrainings = isAdmin ? trainings : trainings.filter(t => directReportIds.includes(t.employee_id));
  const formEmployees = isAdmin ? employees : directReports;

  const handleEmployeeChange = (id) => {
    const emp = formEmployees.find(e => e.id === id);
    setForm({ ...form, employee_id: id, employee_name: emp ? `${emp.first_name} ${emp.last_name}` : '' });
  };

  const handleSubmit = (e) => { e.preventDefault(); createMutation.mutate(form); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training & Certifications"
        actions={<Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Add Record</Button>}
      />

      {visibleTrainings.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No training records" description="Track employee training and certifications." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="p-4 font-medium">Employee</th>
                  <th className="p-4 font-medium">Training</th>
                  <th className="p-4 font-medium hidden md:table-cell">Type</th>
                  <th className="p-4 font-medium hidden lg:table-cell">Completed</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleTrainings.map(t => (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="p-4 font-medium">{t.employee_name}</td>
                    <td className="p-4">{t.training_name}</td>
                    <td className="p-4 hidden md:table-cell">{t.training_type?.replace(/_/g, ' ')}</td>
                    <td className="p-4 hidden lg:table-cell">{t.completion_date && format(new Date(t.completion_date), 'MMM d, yyyy')}</td>
                    <td className="p-4"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent><DialogHeader><DialogTitle>Add Training Record</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Employee *</Label>
              <Select value={form.employee_id} onValueChange={handleEmployeeChange}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{formEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Training Name *</Label>
              <Input value={form.training_name} onChange={e => setForm({ ...form, training_name: e.target.value })} placeholder="e.g. First Aid" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Type *</Label>
                <Select value={form.training_type} onValueChange={val => setForm({ ...form, training_type: val })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{trainingTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Completion Date</Label>
                <Input type="date" value={form.completion_date} onChange={e => setForm({ ...form, completion_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Provider</Label>
              <Input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} placeholder="Training provider" />
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? 'Saving...' : 'Save Record'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}