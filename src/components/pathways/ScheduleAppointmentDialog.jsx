import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { LOCATION_TYPE_LABELS } from '@/lib/rcConstants';

const EMPTY = {
  appointment_date: '',
  duration_minutes: 60,
  location_type: 'in_person',
  location_detail: '',
  purpose: '',
  notes: '',
  worker_name: '',
};

// Schedule an appointment for a Pathways client. Creates the shared appointment
// record (which appears on the staff member's dashboard appointments calendar)
// and returns a progress-timeline note entry to the caller via onSaved.
export default function ScheduleAppointmentDialog({ open, onOpenChange, client, currentUser, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY,
        appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        worker_name: currentUser?.full_name || '',
      });
    }
  }, [open, currentUser]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSchedule = async () => {
    if (!form.appointment_date) {
      toast.error('Appointment date and time are required');
      return;
    }
    setSaving(true);
    try {
      await base44.entities.RCAppointment.create({
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        client_email: client.email || '',
        worker_name: form.worker_name || currentUser?.full_name || '',
        appointment_date: form.appointment_date,
        duration_minutes: form.duration_minutes ?? 60,
        location_type: form.location_type,
        location_detail: form.location_detail,
        purpose: form.purpose,
        status: 'scheduled',
        notes: form.notes,
      });

      const when = new Date(form.appointment_date).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      const noteEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        event_type: 'appointment',
        item_label: 'Appointment Scheduled',
        item_key: 'appointment',
        note: `${when}${form.purpose ? ` — ${form.purpose}` : ''}${form.location_detail ? ` · ${form.location_detail}` : ''}`,
        logged_by: currentUser?.email || '',
        logged_by_name: currentUser?.full_name || '',
        compass_entered: false,
      };
      toast.success('Appointment scheduled');
      onSaved?.(noteEntry);
    } catch (err) {
      toast.error('Failed to schedule appointment', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Schedule Appointment — {client.first_name} {client.last_name}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2"><Label>Appointment Date &amp; Time *</Label><Input type="datetime-local" value={form.appointment_date || ''} onChange={(e) => update('appointment_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Duration (minutes)</Label><Input type="number" min="15" step="15" value={form.duration_minutes ?? 60} onChange={(e) => update('duration_minutes', parseInt(e.target.value) || 60)} /></div>
          <div className="space-y-1.5"><Label>Location Type</Label>
            <Select value={form.location_type} onValueChange={(v) => update('location_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(LOCATION_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2"><Label>Location Detail</Label><Input value={form.location_detail || ''} onChange={(e) => update('location_detail', e.target.value)} placeholder="Room, address, or meeting link" /></div>
          <div className="space-y-1.5 col-span-2"><Label>Purpose</Label><Input value={form.purpose || ''} onChange={(e) => update('purpose', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Worker</Label><Input value={form.worker_name || ''} onChange={(e) => update('worker_name', e.target.value)} placeholder="Your name" /></div>
          <div className="space-y-1.5"><Label>Notes</Label><Input value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSchedule} disabled={saving}>{saving ? 'Scheduling...' : 'Schedule'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}