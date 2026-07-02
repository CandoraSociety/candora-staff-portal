import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const EMPTY = { visitor_name: '', visitor_phone: '', visit_date: '', arrival_time: '', departure_time: '', purpose: '', staff_visited: '', department: '', status: 'checked_in', notes: '' };

export default function DropInDialog({ open, onOpenChange, visit, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) {
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 5);
      setForm(visit ? { ...visit } : { ...EMPTY, visit_date: now.toISOString().split('T')[0], arrival_time: timeStr });
    }
  }, [open, visit]);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.visitor_name || !form.visit_date) { toast({ title: 'Visitor name and visit date are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (visit) await base44.entities.DropInVisit.update(visit.id, form);
      else await base44.entities.DropInVisit.create(form);
      toast({ title: visit ? 'Drop-in updated' : 'Drop-in recorded' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{visit ? 'Edit Drop-in' : 'New Drop-in'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2"><Label>Visitor Name *</Label><Input value={form.visitor_name || ''} onChange={(e) => update('visitor_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.visitor_phone || ''} onChange={(e) => update('visitor_phone', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Visit Date *</Label><Input type="date" value={form.visit_date || ''} onChange={(e) => update('visit_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Arrival Time</Label><Input type="time" value={form.arrival_time || ''} onChange={(e) => update('arrival_time', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Departure Time</Label><Input type="time" value={form.departure_time || ''} onChange={(e) => update('departure_time', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Purpose</Label><Input value={form.purpose || ''} onChange={(e) => update('purpose', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Staff Visited</Label><Input value={form.staff_visited || ''} onChange={(e) => update('staff_visited', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Department</Label><Input value={form.department || ''} onChange={(e) => update('department', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}