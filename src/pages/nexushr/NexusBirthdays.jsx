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
import { Plus, Search, Mail, Calendar, Gift, Upload } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { format } from 'date-fns';
import moment from 'moment';

export default function NexusBirthdays() {
  const [search, setSearch] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list('-created_date', 500) });

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.integrations.Core.SendEmail({
        to: data.to,
        subject: data.subject,
        body: data.body,
        from_name: 'NexusHR',
      });
      return response;
    },
    onSuccess: () => {
      setShowEmail(false);
      setEmailForm({ subject: '', message: '' });
      setSelectedEmployee(null);
    },
  });

  // Filter employees with birth dates
  const employeesWithBirthdays = employees.filter(e => e.birth_date);

  // Calculate upcoming birthdays (next 30 days)
  const now = moment();
  const upcomingBirthdays = employeesWithBirthdays
    .map(emp => {
      const birthDate = moment(emp.birth_date);
      let nextBirthday = moment().month(birthDate.month()).date(birthDate.date());
      if (nextBirthday.isBefore(now, 'day')) nextBirthday.add(1, 'year');
      const daysUntil = nextBirthday.diff(now, 'days');
      const age = now.year() - birthDate.year();
      return { ...emp, nextBirthday, daysUntil, age, isThisMonth: daysUntil <= 30 };
    })
    .filter(emp => emp.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const filtered = employeesWithBirthdays.filter(emp =>
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSendEmail = async (e) => {
    e.preventDefault();
    await sendEmailMutation.mutate({
      to: selectedEmployee.email,
      subject: emailForm.subject,
      body: emailForm.message,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Birthdays"
        description="Celebrate employee birthdays"
      />

      {/* This Month */}
      {upcomingBirthdays.length > 0 && (
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gift className="w-4 h-4 text-accent" /> This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {upcomingBirthdays.map(emp => (
                <div key={emp.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-accent/20">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-lg font-bold text-accent">
                    {emp.first_name?.[0]}{emp.last_name?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{emp.first_name} {emp.last_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {emp.daysUntil === 0 ? '🎉 Today!' : emp.daysUntil === 1 ? 'Tomorrow' : `In ${emp.daysUntil} days`}
                    </p>
                    <p className="text-xs text-muted-foreground">Turning {emp.age + 1}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    setSelectedEmployee(emp);
                    setEmailForm({
                      subject: `Happy Birthday ${emp.first_name}! 🎉`,
                      message: `Dear ${emp.first_name},\n\nWishing you a wonderful birthday and a fantastic year ahead!\n\nBest regards,\nNexusHR Team`,
                    });
                    setShowEmail(true);
                  }}><Mail className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* All Birthdays */}
      {filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="No birthdays found" description="Add birth dates to employee profiles." />
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">All Employee Birthdays</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="p-4 font-medium">Employee</th>
                  <th className="p-4 font-medium">Department</th>
                  <th className="p-4 font-medium">Birthday</th>
                  <th className="p-4 font-medium">Turning</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(emp => {
                  const birthDate = moment(emp.birth_date);
                  const nextBirthday = moment().month(birthDate.month()).date(birthDate.date());
                  const age = nextBirthday.year() - birthDate.year();
                  return (
                    <tr key={emp.id} className="hover:bg-muted/30">
                      <td className="p-4 font-medium">{emp.first_name} {emp.last_name}</td>
                      <td className="p-4">{emp.department}</td>
                      <td className="p-4">{format(new Date(emp.birth_date), 'MMMM d')}</td>
                      <td className="p-4">{age}</td>
                      <td className="p-4">
                        <Button size="sm" variant="ghost" onClick={() => {
                          setSelectedEmployee(emp);
                          setEmailForm({
                            subject: `Happy Birthday ${emp.first_name}! 🎉`,
                            message: `Dear ${emp.first_name},\n\nWishing you a wonderful birthday and a fantastic year ahead!\n\nBest regards,\nNexusHR Team`,
                          });
                          setShowEmail(true);
                        }}><Mail className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Email Dialog */}
      <Dialog open={showEmail} onOpenChange={setShowEmail}>
        <DialogContent><DialogHeader><DialogTitle>Send Birthday Email</DialogTitle></DialogHeader>
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div className="space-y-1">
              <Label>To</Label>
              <Input value={selectedEmployee?.email || ''} disabled />
            </div>
            <div className="space-y-1">
              <Label>Subject *</Label>
              <Input value={emailForm.subject} onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Message *</Label>
              <Textarea value={emailForm.message} onChange={e => setEmailForm({ ...emailForm, message: e.target.value })} className="h-32" required />
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