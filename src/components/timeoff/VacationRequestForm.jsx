import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import SupervisorSelect, { useSupervisors } from '@/components/timeoff/SupervisorSelect';
import { ymd } from '@/lib/payPeriods';

export default function VacationRequestForm({ user, onSubmitted }) {
  const { toast } = useToast();
  const supervisors = useSupervisors();
  const today = ymd(Date.now());

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
    if (!supervisorEmail) {
      toast({ title: 'Select your supervisor', variant: 'destructive' });
      return;
    }
    const supervisor = supervisors.find(s => s.email === supervisorEmail);
    setSubmitting(true);
    try {
      await base44.entities.TimeOffRecord.create({
        employee_name: user?.full_name || user?.email,
        employee_email: user?.email,
        kind: 'vacation',
        start_date: startDate,
        end_date: endDate,
        hours_per_day: Number(hoursPerDay) || 8,
        supervisor_name: supervisor?.name || '',
        supervisor_email: supervisorEmail,
        status: 'pending',
        notes,
      });
      toast({
        title: 'Vacation request submitted',
        description: `Sent to ${supervisor?.name} for approval. Once approved, these days automatically fill into your timesheet.`,
      });
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
        <SupervisorSelect value={supervisorEmail} onChange={setSupervisorEmail} />
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