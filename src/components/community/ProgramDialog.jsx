import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { PROGRAM_CATEGORY_OPTIONS, PROGRAM_STATUS_OPTIONS, FUNDER_CATEGORY_OPTIONS } from '@/lib/communityConstants';

const EMPTY = { name: '', description: '', category: 'social', funder_category: 'none', funder_name: '', lead_facilitator_name: '', lead_facilitator_email: '', is_volunteer_run: true, schedule_description: '', location: '', status: 'active', start_date: '', end_date: '', notes: '' };

export default function ProgramDialog({ open, onOpenChange, program, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => { if (open) setForm(program ? { ...program } : { ...EMPTY }); }, [open, program]);
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.name || !form.category) { toast({ title: 'Name and category are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (program) await base44.entities.CommunityProgram.update(program.id, form);
      else await base44.entities.CommunityProgram.create(form);
      toast({ title: program ? 'Program updated' : 'Program created' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{program ? 'Edit Program' : 'New Program'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2"><Label>Program Name *</Label><Input value={form.name || ''} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Sewing Group" /></div>
          <div className="space-y-1.5 col-span-2"><Label>Description</Label><Textarea value={form.description || ''} onChange={(e) => update('description', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5"><Label>Category *</Label><Select value={form.category || 'social'} onValueChange={(v) => update('category', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAM_CATEGORY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={form.status || 'active'} onValueChange={(v) => update('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAM_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Funder Category</Label><Select value={form.funder_category || 'none'} onValueChange={(v) => update('funder_category', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FUNDER_CATEGORY_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Funder Name</Label><Input value={form.funder_name || ''} onChange={(e) => update('funder_name', e.target.value)} disabled={form.funder_category === 'none'} placeholder="Specific funder (if applicable)" /></div>
          <div className="space-y-1.5"><Label>Lead Facilitator</Label><Input value={form.lead_facilitator_name || ''} onChange={(e) => update('lead_facilitator_name', e.target.value)} placeholder="Volunteer or staff name" /></div>
          <div className="space-y-1.5"><Label>Facilitator Email</Label><Input type="email" value={form.lead_facilitator_email || ''} onChange={(e) => update('lead_facilitator_email', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Schedule</Label><Input value={form.schedule_description || ''} onChange={(e) => update('schedule_description', e.target.value)} placeholder="e.g. Every Tuesday 1-3pm" /></div>
          <div className="space-y-1.5"><Label>Location</Label><Input value={form.location || ''} onChange={(e) => update('location', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.start_date || ''} onChange={(e) => update('start_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.end_date || ''} onChange={(e) => update('end_date', e.target.value)} /></div>
          <div className="col-span-2 flex items-center gap-2 pt-1"><Checkbox id="volunteer-run" checked={form.is_volunteer_run ?? true} onCheckedChange={(c) => update('is_volunteer_run', c)} /><label htmlFor="volunteer-run" className="text-sm font-medium cursor-pointer">Volunteer-run program</label></div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}