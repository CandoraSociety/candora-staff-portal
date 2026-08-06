import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const EMPTY = { title: '', date: '', start_time: '', end_time: '', location: '', capacity: '', status: 'scheduled', notes: '' };

export default function ChildmindingSessionDialog({ open, onOpenChange, session, onSaved }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(session ? { ...session } : { ...EMPTY, date: new Date().toISOString().split('T')[0] });
  }, [open, session]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.date) {
      toast({ title: 'Date is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, capacity: form.capacity ? Number(form.capacity) : null };
      if (session) await base44.entities.ChildmindingSession.update(session.id, data);
      else await base44.entities.ChildmindingSession.create(data);
      queryClient.invalidateQueries({ queryKey: ['childminding-sessions'] });
      toast({ title: session ? 'Session updated' : 'Session created' });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{session ? 'Edit Childminding Session' : 'Create Childminding Session'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label>Session Title</Label>
            <Input value={form.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Morning Childminding" />
          </div>
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input type="date" value={form.date || ''} onChange={(e) => update('date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Capacity (children)</Label>
            <Input type="number" min="0" value={form.capacity ?? ''} onChange={(e) => update('capacity', e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label>Start Time</Label>
            <Input type="time" value={form.start_time || ''} onChange={(e) => update('start_time', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End Time</Label>
            <Input type="time" value={form.end_time || ''} onChange={(e) => update('end_time', e.target.value)} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Location</Label>
            <Input value={form.location || ''} onChange={(e) => update('location', e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Status</Label>
            <Select value={form.status || 'scheduled'} onValueChange={(v) => update('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}