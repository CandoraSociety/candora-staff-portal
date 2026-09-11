import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

// Sick time / personal days are logged directly (no approval needed) and
// immediately count as paid leave on the employee's timesheet.
export default function SickDayForm({ user, onSubmitted }) {
  const { toast } = useToast();
  const [kind, setKind] = useState('sick');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hours, setHours] = useState('8');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!date) {
      toast({ title: 'Choose the date', variant: 'destructive' });
      return;
    }
    if (endDate && endDate < date) {
      toast({ title: 'The end date is before the start date', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.TimeOffRecord.create({
        employee_name: user?.full_name || user?.email,
        employee_email: user?.email,
        kind,
        start_date: date,
        end_date: endDate || date,
        hours_per_day: Number(hours) || 8,
        status: 'approved',
        notes,
      });
      toast({
        title: kind === 'sick' ? 'Sick time recorded' : 'Personal day recorded',
        description: 'It will automatically fill into the Paid Leave column of your timesheet for that pay period.',
      });
      onSubmitted?.();
      setDate('');
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
          <Label>Type</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-full mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sick">Sick Time</SelectItem>
              <SelectItem value="personal">Personal Day</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date</Label>
          <Input type="date" className="mt-1.5" value={date}
            onChange={e => { setDate(e.target.value); if (!endDate || e.target.value > endDate) setEndDate(e.target.value); }} />
        </div>
        <div>
          <Label>Until (optional)</Label>
          <Input type="date" min={date} className="mt-1.5" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div>
          <Label>Hours per day</Label>
          <Input type="number" step="0.25" min="0" className="mt-1.5" value={hours} onChange={e => setHours(e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Notes (optional)</Label>
        <Input className="mt-1.5" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Context for HR records" />
      </div>
      <Button onClick={submit} disabled={submitting}>
        {submitting ? 'Recording…' : 'Record'}
      </Button>
    </div>
  );
}