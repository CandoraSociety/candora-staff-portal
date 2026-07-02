import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { APPOINTMENT_STATUS_OPTIONS, LOCATION_TYPE_LABELS } from '@/lib/rcConstants';

const EMPTY = {
  client_id: '', client_name: '', client_email: '', worker_name: '',
  appointment_date: '', duration_minutes: 60, location_type: 'in_person',
  location_detail: '', purpose: '', status: 'scheduled', notes: '',
};

export default function AppointmentDialog({ open, onOpenChange, clientId, clientName, clientEmail, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: clients = [] } = useQuery({
    queryKey: ['rc-clients'],
    queryFn: () => base44.entities.RCClient.list(),
    enabled: open && !clientId,
  });

  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY,
        client_id: clientId || '',
        client_name: clientName || '',
        client_email: clientEmail || '',
        appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      });
    }
  }, [open, clientId, clientName, clientEmail]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleClientChange = (id) => {
    const c = clients.find(c => c.id === id);
    update('client_id', id);
    update('client_name', c ? `${c.first_name} ${c.last_name}` : '');
    update('client_email', c?.email || '');
  };

  const handleSave = async () => {
    if (!form.client_id || !form.appointment_date) {
      toast({ title: 'Client and appointment date are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.RCAppointment.create(form);
      toast({ title: 'Appointment scheduled' });
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Schedule Appointment</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {!clientId && (
            <div className="space-y-1.5 col-span-2">
              <Label>Client *</Label>
              <Select value={form.client_id} onValueChange={handleClientChange}>
                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
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
          <div className="space-y-1.5"><Label>Worker Name</Label><Input value={form.worker_name || ''} onChange={(e) => update('worker_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{APPOINTMENT_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
          {form.client_email && <p className="col-span-2 text-xs text-muted-foreground">Reminder email will be sent to {form.client_email} 24 hours before the appointment.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Schedule'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}