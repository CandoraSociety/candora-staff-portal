import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { APPT_STATUS_OPTIONS } from '@/lib/receptionConstants';

const EMPTY = { visitor_name: '', visitor_phone: '', visitor_email: '', appointment_date: '', duration_minutes: 30, purpose: '', staff_member: '', department: '', status: 'scheduled', notes: '' };

export default function AppointmentDialog({ open, onOpenChange, appointment, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(appointment ? { ...appointment } : { ...EMPTY, appointment_date: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16) });
  }, [open, appointment]);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.visitor_name || !form.appointment_date) { toast({ title: 'Visitor name and appointment date are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (appointment) await base44.entities.ReceptionAppointment.update(appointment.id, form);
      else await base44.entities.ReceptionAppointment.create(form);
      toast({ title: appointment ? 'Appointment updated' : 'Appointment created' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{appointment ? 'Edit Appointment' : 'New Appointment'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2"><Label>Visitor Name *</Label><Input value={form.visitor_name || ''} onChange={(e) => update('visitor_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.visitor_phone || ''} onChange={(e) => update('visitor_phone', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.visitor_email || ''} onChange={(e) => update('visitor_email', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Appointment Date &amp; Time *</Label><Input type="datetime-local" value={form.appointment_date ? form.appointment_date.slice(0, 16) : ''} onChange={(e) => update('appointment_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" min="15" step="15" value={form.duration_minutes ?? 30} onChange={(e) => update('duration_minutes', parseInt(e.target.value) || 30)} /></div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={form.status || 'scheduled'} onValueChange={(v) => update('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{APPT_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5 col-span-2"><Label>Purpose</Label><Input value={form.purpose || ''} onChange={(e) => update('purpose', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Staff Member</Label><Input value={form.staff_member || ''} onChange={(e) => update('staff_member', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Department</Label><Input value={form.department || ''} onChange={(e) => update('department', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}