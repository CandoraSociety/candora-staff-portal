import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import SupervisorSelect, { useSupervisors } from '@/components/timeoff/SupervisorSelect';
import { ymd } from '@/lib/payPeriods';

// Vacation request. Staff with a supervisor on file pick who approves it.
// Staff with no supervisor on file (the Executive Director) have vacation
// recorded automatically — no approval needed.
// `fixedSupervisor` pins the approving supervisor (Executive Director's test tab).
export default function VacationRequestForm({ user, onSubmitted, fixedSupervisor }) {
  const { toast } = useToast();
  const supervisors = useSupervisors();
  const today = ymd(Date.now());

  const { data: myEmployeeList = [] } = useQuery({
    queryKey: ['employee-record', user?.email],
    queryFn: () => base44.entities.Employee.filter({ email: user.email }),
    enabled: !!user?.email,
  });
  const myEmployee = myEmployeeList.find(e => !e.is_deleted);
  const autoApproved = !fixedSupervisor && !!myEmployee && !myEmployee.manager_email;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('8');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!startDate || !endDate) {
      toast({ title: 'Choose your dates', variant: 'destructive' });
      return;
    }
    if (endDate < startDate) {
      toast({ title: 'The end date is before the start date', variant: 'destructive' });
      return;
    }
    if (!autoApproved && !fixedSupervisor && !supervisorEmail) {
      toast({ title: 'Select your supervisor', variant: 'destructive' });
      return;
    }
    const supervisor = fixedSupervisor || supervisors.find(s => s.email === supervisorEmail);
    setSubmitting(true);
    try {
      const base = {
        employee_name: user?.full_name || user?.email,
        employee_email: user?.email,
        kind: 'vacation',
        start_date: startDate,
        end_date: endDate,
        hours_per_day: Number(hoursPerDay) || 8,
        notes,
      };
      if (autoApproved) {
        await base44.entities.TimeOffRecord.create({
          ...base,
          status: 'approved',
          approved_by_name: 'Auto-approved — no supervisor on file',
          approved_by_email: user?.email,
          approved_date: ymd(Date.now()),
        });
        toast({
          title: 'Vacation recorded',
          description: 'No supervisor approval needed — these days automatically fill into your timesheet.',
        });
      } else {
        await base44.entities.TimeOffRecord.create({
          ...base,
          supervisor_name: supervisor?.name || '',
          supervisor_email: fixedSupervisor ? fixedSupervisor.email : supervisorEmail,
          status: 'pending',
        });
        toast({
          title: 'Vacation request submitted',
          description: `Sent to ${supervisor?.name} for approval. Once approved, these days automatically fill into your timesheet.`,
        });
      }
      onSubmitted?.();
      setStartDate('');
      setEndDate('');
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label>First day of vacation</Label>
          <Input type="date" min={today} className="mt-1.5" value={startDate}
            onChange={e => { setStartDate(e.target.value); if (!endDate || e.target.value > endDate) setEndDate(e.target.value); }} />
        </div>
        <div>
          <Label>Last day of vacation</Label>
          <Input type="date" min={startDate || today} className="mt-1.5" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div>
          <Label>Hours per day</Label>
          <Input type="number" step="0.25" min="0" className="mt-1.5" value={hoursPerDay} onChange={e => setHoursPerDay(e.target.value)} />
        </div>
        {fixedSupervisor ? (
          <div>
            <Label>Supervisor (for approval)</Label>
            <div className="rounded-lg border bg-muted/40 px-3 py-2 mt-1.5 text-sm font-medium">
              {fixedSupervisor.name}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Test submissions route to you as the supervisor.</p>
          </div>
        ) : autoApproved ? (
          <div>
            <Label>Approval</Label>
            <div className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 mt-1.5 text-sm">
              Recorded automatically — no supervisor approval needed
            </div>
          </div>
        ) : <SupervisorSelect value={supervisorEmail} onChange={setSupervisorEmail} />}
      </div>
      <div>
        <Label>Notes (optional)</Label>
        <Input className="mt-1.5" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything your supervisor should know" />
      </div>
      <Button onClick={submit} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Request'}
      </Button>
    </div>
  );
}