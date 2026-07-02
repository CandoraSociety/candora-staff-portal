import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { COHORT_STATUS_OPTIONS, DELIVERY_MODE_OPTIONS } from '@/lib/empoweruConstants';

const EMPTY = { name: '', start_date: '', end_date: '', delivery_mode: 'virtual', location: '', facilitator_name: '', facilitator_email: '', facilitator_phone: '', capacity: 15, registration_open: false, registration_deadline: '', status: 'planning', notes: '' };

export default function CohortFormDialog({ open, onOpenChange, cohort, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => { setForm(cohort ? { ...cohort } : EMPTY); }, [open, cohort]);
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.name) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (cohort) await base44.entities.EmpowerUCohort.update(cohort.id, form);
      else await base44.entities.EmpowerUCohort.create(form);
      toast({ title: cohort ? 'Cohort updated' : 'Cohort created' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{cohort ? 'Edit Cohort' : 'New Cohort'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2"><Label>Cohort Name *</Label><Input value={form.name || ''} onChange={(e) => update('name', e.target.value)} placeholder="e.g. EmpowerU Fall 2026" /></div>
          <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.start_date || ''} onChange={(e) => update('start_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.end_date || ''} onChange={(e) => update('end_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Delivery Mode</Label><Select value={form.delivery_mode || 'virtual'} onValueChange={(v) => update('delivery_mode', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DELIVERY_MODE_OPTIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" min="1" value={form.capacity ?? 15} onChange={(e) => update('capacity', parseInt(e.target.value) || 15)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Location / Meeting Link</Label><Input value={form.location || ''} onChange={(e) => update('location', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Facilitator Name</Label><Input value={form.facilitator_name || ''} onChange={(e) => update('facilitator_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Facilitator Phone</Label><Input value={form.facilitator_phone || ''} onChange={(e) => update('facilitator_phone', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Facilitator Email</Label><Input type="email" value={form.facilitator_email || ''} onChange={(e) => update('facilitator_email', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Registration Deadline</Label><Input type="date" value={form.registration_deadline || ''} onChange={(e) => update('registration_deadline', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={form.status || 'planning'} onValueChange={(v) => update('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COHORT_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="flex items-center gap-2 col-span-2"><Checkbox id="reg-open" checked={form.registration_open || false} onCheckedChange={(v) => update('registration_open', v)} /><label htmlFor="reg-open" className="text-sm cursor-pointer">Registration open</label></div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}