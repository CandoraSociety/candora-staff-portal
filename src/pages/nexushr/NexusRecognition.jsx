import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Award } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { format } from 'date-fns';
import { calculateMilestones } from '@/lib/employeeMilestones';

const typeIcons = {
  milestone_hours: '⏱️',
  outstanding_service: '🌟',
  employee_of_month: '⭐',
  special_achievement: '🏆',
  years_of_service: '🎖️',
};

export default function NexusRecognition() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: '', employee_name: '', type: '', title: '', description: '', date_awarded: '' });
  const queryClient = useQueryClient();

  const { data: recognitions = [] } = useQuery({ queryKey: ['employee-recognition'], queryFn: () => base44.entities.EmployeeRecognition.list('-date_awarded', 500) });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list('-created_date', 500) });
  const { data: timeLogs = [] } = useQuery({ queryKey: ['employee-timelogs'], queryFn: () => base44.entities.EmployeeTimeLog.list('-date', 500) });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EmployeeRecognition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-recognition'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowForm(false);
      setForm({ employee_id: '', employee_name: '', type: '', title: '', description: '', date_awarded: '' });
    },
  });

  const handleEmployeeChange = (id) => {
    const emp = employees.find(e => e.id === id);
    setForm({ ...form, employee_id: id, employee_name: emp ? `${emp.first_name} ${emp.last_name}` : '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createMutation.mutate({
      ...form,
      awarded_by: 'NexusHR Admin',
    });
  };

  const filtered = recognitions.filter(rec =>
    rec.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
    rec.title?.toLowerCase().includes(search.toLowerCase()) ||
    rec.type?.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate pending milestones
  const pendingMilestones = useMemo(() => {
    const allMilestones = [];
    employees.forEach(emp => {
      const milestones = calculateMilestones(emp, timeLogs, recognitions);
      milestones.forEach(m => {
        allMilestones.push({ ...m, employee_id: emp.id, employee_name: `${emp.first_name} ${emp.last_name}` });
      });
    });
    return allMilestones;
  }, [employees, timeLogs, recognitions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recognition"
        description="Celebrate employee achievements and milestones"
        actions={<Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Give Recognition</Button>}
      />

      {/* Pending Milestones */}
      {pendingMilestones.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-600" /> Pending Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {pendingMilestones.slice(0, 6).map((m, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-200">
                  <span className="text-2xl">{m.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-yellow-900">{m.title}</p>
                    <p className="text-xs text-yellow-700">{m.employee_name}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    setForm({ ...form, employee_id: m.employee_id, employee_name: m.employee_name, type: m.type, title: m.title, date_awarded: format(new Date(), 'yyyy-MM-dd') });
                    setShowForm(true);
                  }}>Award</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by employee, type, or title..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Recognition List */}
      {filtered.length === 0 ? (
        <EmptyState icon={Award} title="No recognitions yet" description="Recognize your first employee." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(rec => (
            <Card key={rec.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{typeIcons[rec.type] || '🎖️'}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{rec.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{rec.employee_name}</p>
                    <p className="text-xs text-muted-foreground mt-2">{rec.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">{rec.date_awarded ? format(new Date(rec.date_awarded), 'MMM d, yyyy') : ''}</span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{rec.type?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Give Recognition Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent><DialogHeader><DialogTitle>Give Recognition</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Employee *</Label>
              <Select value={form.employee_id} onValueChange={handleEmployeeChange}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="milestone_hours">Milestone Hours</SelectItem>
                  <SelectItem value="outstanding_service">Outstanding Service</SelectItem>
                  <SelectItem value="employee_of_month">Employee of Month</SelectItem>
                  <SelectItem value="special_achievement">Special Achievement</SelectItem>
                  <SelectItem value="years_of_service">Years of Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. 100 Hours Milestone" required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
            </div>
            <div className="space-y-1">
              <Label>Date Awarded *</Label>
              <Input type="date" value={form.date_awarded} onChange={e => setForm({ ...form, date_awarded: e.target.value })} required />
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? 'Saving...' : 'Give Recognition'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}