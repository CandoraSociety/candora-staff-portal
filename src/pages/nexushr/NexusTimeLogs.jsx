import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSupervisorAccess } from '@/lib/useSupervisorAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Clock, Calendar, TrendingUp, PieChart } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import AccessDenied from '@/components/shared/AccessDenied';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';
import moment from 'moment';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#264653', '#8ab17d', '#a8dadc', '#457b9d'];

export default function NexusTimeLogs() {
  const { canAccessHR, user, isAdmin, directReports, directReportIds, employees } = useSupervisorAccess();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: '', employee_name: '', department: '', date: '', hours: '', notes: '' });
  const queryClient = useQueryClient();

  const { data: timeLogs = [] } = useQuery({ queryKey: ['employee-timelogs'], queryFn: () => base44.entities.EmployeeTimeLog.list('-date', 500) });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EmployeeTimeLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-timelogs'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowForm(false);
    },
  });

  const visibleTimeLogs = isAdmin ? timeLogs : timeLogs.filter(log => directReportIds.includes(log.employee_id));

  const stats = useMemo(() => {
    const now = moment();
    const calendarYearStart = moment().startOf('year');
    const fiscalYearStart = moment().month(3).date(1).startOf('day');
    if (now.isBefore(fiscalYearStart)) fiscalYearStart.subtract(1, 'year');

    const allTime = visibleTimeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
    const calendarYTD = visibleTimeLogs.filter(log => moment(log.date || log.sign_in_time).isSameOrAfter(calendarYearStart)).reduce((sum, log) => sum + (log.total_hours || 0), 0);
    const fiscalYTD = visibleTimeLogs.filter(log => moment(log.date || log.sign_in_time).isSameOrAfter(fiscalYearStart)).reduce((sum, log) => sum + (log.total_hours || 0), 0);

    const byDepartment = {};
    visibleTimeLogs.forEach(log => {
      const dept = log.department || 'Unassigned';
      byDepartment[dept] = (byDepartment[dept] || 0) + (log.total_hours || 0);
    });
    const pieData = Object.entries(byDepartment).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return { allTime, calendarYTD, fiscalYTD, pieData };
  }, [visibleTimeLogs]);

  if (!canAccessHR) return <AccessDenied />;

  const formEmployees = isAdmin ? employees : directReports;

  const handleEmployeeChange = (id) => {
    const emp = formEmployees.find(e => e.id === id);
    setForm({ ...form, employee_id: id, employee_name: emp ? `${emp.first_name} ${emp.last_name}` : '', department: emp?.department || '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hours = parseFloat(form.hours);
    await createMutation.mutate({
      ...form,
      total_hours: hours,
      status: 'completed',
      sign_in_time: new Date(form.date).toISOString(),
      sign_out_time: new Date(new Date(form.date).getTime() + hours * 3600000).toISOString(),
    });
  };

  const filtered = visibleTimeLogs.filter(log =>
    log.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
    log.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Logs"
        actions={<Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Log Hours</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary"><Clock className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.allTime.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">All-Time Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent-foreground"><Calendar className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.calendarYTD.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Calendar YTD</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 text-success-foreground"><TrendingUp className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.fiscalYTD.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Fiscal YTD</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary text-secondary-foreground"><PieChart className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.pieData.length}</p>
                <p className="text-xs text-muted-foreground">Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.pieData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Hours by Department</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {stats.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(1)} hours`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by employee or department..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Clock} title="No time logs" description="Log your first work hours." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="p-4 font-medium">Employee</th>
                  <th className="p-4 font-medium">Department</th>
                  <th className="p-4 font-medium hidden md:table-cell">Date</th>
                  <th className="p-4 font-medium">Hours</th>
                  <th className="p-4 font-medium hidden lg:table-cell">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="p-4 font-medium">{log.employee_name}</td>
                    <td className="p-4">{log.department || '—'}</td>
                    <td className="p-4 hidden md:table-cell">{log.date && format(new Date(log.date), 'MMM d, yyyy')}</td>
                    <td className="p-4 font-medium">{log.total_hours?.toFixed(1)}h</td>
                    <td className="p-4 hidden lg:table-cell"><StatusBadge status={log.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent><DialogHeader><DialogTitle>Log Work Hours</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Employee *</Label>
              <Select value={form.employee_id} onValueChange={handleEmployeeChange}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{formEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Department</Label>
              <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Department" />
            </div>
            <div className="space-y-1">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Hours Worked *</Label>
              <Input type="number" step="0.5" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} placeholder="e.g. 7.5" required />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? 'Saving...' : 'Log Hours'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}