import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import SupervisorSelect, { useSupervisors } from '@/components/timeoff/SupervisorSelect';

// Edit an approved vacation request. Saving sends it back to the supervisor
// as a fresh pending request for re-approval.
export default function EditTimeOffDialog({ record, onClose, onSaved }) {
  const { toast } = useToast();
  const supervisors = useSupervisors();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('8');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setStartDate(record.start_date || '');
      setEndDate(record.end_date || record.start_date || '');
      setHoursPerDay(String(record.hours_per_day ?? 8));
      setSupervisorEmail(record.supervisor_email || '');
      setNotes(record.notes || '');
    }
  }, [record]);

  const save = async () => {
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
    setSaving(true);
    try {
      await base44.entities.TimeOffRecord.update(record.id, {
        start_date: startDate,
        end_date: endDate,
        hours_per_day: Number(hoursPerDay) || 8,
        supervisor_name: supervisor?.name || record.supervisor_name || '',
        supervisor_email: supervisorEmail,
        notes,
        status: 'pending',
        approved_by_name: null,
        approved_by_email: null,
        approved_date: null,
        rejection_reason: '',
      });
      toast({
        title: 'Updated request sent for approval',
        description: `Your changes were sent back to ${supervisor?.name || supervisorEmail} for approval.`,
      });
      onSaved?.();
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!record} onOpenChange={o => { if (!o) onClose?.(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Vacation Request</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>First day of vacation</Label>
            <Input type="date" className="mt-1.5" value={startDate}
              onChange={e => { setStartDate(e.target.value); if (!endDate || e.target.value > endDate) setEndDate(e.target.value); }} />
          </div>
          <div>
            <Label>Last day of vacation</Label>
            <Input type="date" min={startDate} className="mt-1.5" value={endDate} onChange={e => setEndDate(e.target.value)} />
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
        <p className="text-xs text-muted-foreground">
          Saving sends the updated request back to your supervisor as a new pending approval.
        </p>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save &amp; Send for Approval'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}