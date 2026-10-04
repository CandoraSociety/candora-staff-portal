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
import { ROOM_OPTIONS } from '@/lib/centralRegConstants';
import { parseDateSmart } from '@/lib/dateUtils';

const EMPTY = { name: '', start_date: '', end_date: '', delivery_mode: 'virtual', room: 'virtual', location: '', facilitator_name: '', facilitator_email: '', facilitator_phone: '', capacity: 15, registration_open: false, registration_deadline: '', status: 'planning', notes: '' };

// Cohort names are always "EmpowerU (date range)", derived from the start/end dates.
const fmt = (d, withYear = true) => { const dt = parseDateSmart(d); return dt ? dt.toLocaleDateString('en-CA', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) }) : 'TBD'; };
const cohortNameFromDates = (start, end) => {
  if (!start && !end) return 'EmpowerU (dates TBD)';
  if (start && end) {
    const sameYear = parseDateSmart(start)?.getFullYear() === parseDateSmart(end)?.getFullYear();
    return sameYear ? `EmpowerU (${fmt(start, false)} – ${fmt(end)})` : `EmpowerU (${fmt(start)} – ${fmt(end)})`;
  }
  return `EmpowerU (${fmt(start || end)})`;
};

export default function CohortFormDialog({ open, onOpenChange, cohort, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const autoName = cohortNameFromDates(form.start_date, form.end_date);

  useEffect(() => { setForm(cohort ? { ...cohort, ...(cohort.delivery_mode === 'virtual' ? { room: 'virtual' } : {}) } : EMPTY); }, [open, cohort]);
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));
  // Delivery mode drives the room: virtual cohorts are always in the Virtual room;
  // switching away from virtual releases the room so a physical one can be picked.
  const changeDeliveryMode = (v) => setForm(p => ({ ...p, delivery_mode: v, room: v === 'virtual' ? 'virtual' : (p.room === 'virtual' ? '' : p.room) }));

  const handleSave = async () => {
    if (!form.start_date) { toast({ title: 'Start date is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const payload = { ...form, name: autoName };
      if (cohort) await base44.entities.EmpowerUCohort.update(cohort.id, payload);
      else await base44.entities.EmpowerUCohort.create(payload);
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
          <div className="space-y-1.5"><Label>Start Date *</Label><Input type="date" value={form.start_date || ''} onChange={(e) => update('start_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.end_date || ''} onChange={(e) => update('end_date', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2">
            <Label>Cohort Name</Label>
            <div className="text-sm font-medium text-foreground bg-muted rounded-md px-3 py-2">{autoName}</div>
            <p className="text-xs text-muted-foreground">Set automatically from the dates.</p>
          </div>
          <div className="space-y-1.5"><Label>Delivery Mode</Label><Select value={form.delivery_mode || 'virtual'} onValueChange={changeDeliveryMode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DELIVERY_MODE_OPTIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" min="1" value={form.capacity ?? 15} onChange={(e) => update('capacity', parseInt(e.target.value) || 15)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Location / Meeting Link</Label><Input value={form.location || ''} onChange={(e) => update('location', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2">
            <Label>Room</Label>
            <Select disabled={form.delivery_mode === 'virtual'} value={form.delivery_mode === 'virtual' ? 'virtual' : (form.room || 'none')} onValueChange={(v) => update('room', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Other / TBC</SelectItem>
                {ROOM_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.delivery_mode === 'virtual' && <p className="text-xs text-muted-foreground">Set automatically — virtual cohorts use the Virtual room.</p>}
          </div>
          <div className="space-y-1.5"><Label>Facilitator Name</Label><Input value={form.facilitator_name || ''} onChange={(e) => update('facilitator_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Facilitator Phone</Label><Input value={form.facilitator_phone || ''} onChange={(e) => update('facilitator_phone', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Facilitator Email</Label><Input type="email" value={form.facilitator_email || ''} onChange={(e) => update('facilitator_email', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Registration Deadline</Label><Input type="date" value={form.registration_deadline || ''} onChange={(e) => update('registration_deadline', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={form.status || 'planning'} onValueChange={(v) => update('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COHORT_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="flex items-center gap-2 col-span-2"><Checkbox id="reg-open" checked={form.registration_open || false} onCheckedChange={(v) => update('registration_open', v)} /><label htmlFor="reg-open" className="text-sm cursor-pointer">Registration open</label><span className="text-xs text-muted-foreground">— when checked, the public registration link accepts applications</span></div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}