import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Mail, Users, Building2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { format } from 'date-fns';

export default function NexusEmailEmployees() {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [showEmail, setShowEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', message: '' });
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list('-created_date', 500) });

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      const recipients = data.to.split(',').map(e => e.trim());
      const promises = recipients.map(to => base44.integrations.Core.SendEmail({ to, subject: data.subject, body: data.body, from_name: 'NexusHR' }));
      await Promise.all(promises);
    },
    onSuccess: () => {
      setShowEmail(false);
      setEmailForm({ to: '', subject: '', message: '' });
      setSelectedEmployees([]);
    },
  });

  // Get unique departments
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  // Filter employees
  const filtered = employees.filter(emp => {
    const matchesSearch = `${emp.first_name} ${emp.last_name} ${emp.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
    return matchesSearch && matchesDept && emp.status === 'active';
  });

  const handleSelectEmployee = (id) => {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filtered.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filtered.map(e => e.id));
    }
  };

  const handleSendToSelected = () => {
    const selected = employees.filter(e => selectedEmployees.includes(e.id));
    const emails = selected.map(e => e.email).join(',');
    setEmailForm({
      to: emails,
      subject: '',
      message: '',
    });
    setShowEmail(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Employees"
        description="Send emails to employees by department"
      />

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{filtered.length}</p>
              <p className="text-xs text-muted-foreground">Active Employees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-accent" />
            <div>
              <p className="text-2xl font-bold">{departments.length}</p>
              <p className="text-xs text-muted-foreground">Departments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Mail className="w-8 h-8 text-success" />
            <div>
              <p className="text-2xl font-bold">{selectedEmployees.length}</p>
              <p className="text-xs text-muted-foreground">Selected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No employees found" description="Adjust your filters." />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Employees ({filtered.length})</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleSelectAll}>
                  {selectedEmployees.length === filtered.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button size="sm" disabled={selectedEmployees.length === 0} onClick={handleSendToSelected}>
                  <Mail className="w-4 h-4 mr-1" /> Email Selected ({selectedEmployees.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-left">
                  <th className="p-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.length === filtered.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-4 font-medium">Employee</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Department</th>
                  <th className="p-4 font-medium">Position</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={() => handleSelectEmployee(emp.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4 font-medium">{emp.first_name} {emp.last_name}</td>
                    <td className="p-4">{emp.email}</td>
                    <td className="p-4">{emp.department}</td>
                    <td className="p-4">{emp.position}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Email Dialog */}
      <Dialog open={showEmail} onOpenChange={setShowEmail}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Send Email</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); sendEmailMutation.mutate(emailForm); }} className="space-y-4">
            <div className="space-y-1">
              <Label>To (comma-separated emails)</Label>
              <Input value={emailForm.to} onChange={e => setEmailForm({ ...emailForm, to: e.target.value })} placeholder="email1@example.com, email2@example.com" required />
            </div>
            <div className="space-y-1">
              <Label>Subject *</Label>
              <Input value={emailForm.subject} onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Message *</Label>
              <Textarea value={emailForm.message} onChange={e => setEmailForm({ ...emailForm, message: e.target.value })} className="h-48" required />
            </div>
            <Button type="submit" disabled={sendEmailMutation.isPending} className="w-full">
              {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}