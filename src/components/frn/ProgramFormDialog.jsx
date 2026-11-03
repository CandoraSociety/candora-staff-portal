import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { FRN_PROGRAMS } from '@/lib/frnConstants';
import { FRN_PROGRAM_CATEGORY_OPTIONS, FRN_PROGRAM_STATUS_OPTIONS } from '@/lib/frnPrograms';

const EMPTY = {
  name: '', description: '', category: 'parenting', eligibility: '',
  coordinator_name: '', coordinator_email: '', schedule_description: '',
  location: '', capacity: '', status: 'active', notes: '',
};

export default function ProgramFormDialog({ open, onOpenChange, program, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(program ? { ...EMPTY, ...program, capacity: program.capacity ?? '' } : EMPTY);
  }, [open, program]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast({ title: 'Program name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // Keep the referral program value in step with the program name so
      // existing intake screens still line up with this program.
      const matched = FRN_PROGRAMS.find(p => p.label.toLowerCase() === form.name.trim().toLowerCase());
      const { id, created_date, updated_date, created_by_id, ...fields } = form;
      const payload = {
        ...fields,
        name: form.name.trim(),
        capacity: form.capacity === '' ? 0 : Number(form.capacity),
        // A program's referral key stays put when it is renamed, so linked referrals keep matching.
        legacy_key: program?.legacy_key || matched?.value || 'other',
      };
      if (program?.id) {
        await base44.entities.FRNProgram.update(program.id, payload);
        // Carry a rename through to the sessions and referrals already pointing at this program.
        if (program.name !== payload.name) {
          await base44.entities.FRNSession.updateMany({ program_name: program.name }, { $set: { program_name: payload.name } });
          if (payload.legacy_key !== 'other') {
            await base44.entities.FRNReferral.updateMany({ program: payload.legacy_key }, { $set: { program_name: payload.name } });
          } else {
            await base44.entities.FRNReferral.updateMany({ program_name: program.name }, { $set: { program_name: payload.name } });
          }
        }
        toast({ title: 'Program updated' });
      } else {
        await base44.entities.FRNProgram.create(payload);
        toast({ title: 'Program created' });
      }
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error saving program', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{program ? 'Edit Program' : 'New Program'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label>Program Name *</Label>
            <Input value={form.name || ''} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Connect Parent Group" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={(e) => update('description', e.target.value)} rows={3} placeholder="What the program is and who it is for" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => update('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FRN_PROGRAM_CATEGORY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FRN_PROGRAM_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Eligibility</Label>
            <Textarea value={form.eligibility || ''} onChange={(e) => update('eligibility', e.target.value)} rows={2} placeholder="Who can attend — age range, residency, referral requirements" />
          </div>
          <div className="space-y-1.5">
            <Label>Coordinator</Label>
            <Input value={form.coordinator_name || ''} onChange={(e) => update('coordinator_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Coordinator Email</Label>
            <Input type="email" value={form.coordinator_email || ''} onChange={(e) => update('coordinator_email', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Schedule</Label>
            <Input value={form.schedule_description || ''} onChange={(e) => update('schedule_description', e.target.value)} placeholder="e.g. Tuesdays 1:00–3:00 pm" />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={form.location || ''} onChange={(e) => update('location', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Capacity</Label>
            <Input type="number" value={form.capacity} onChange={(e) => update('capacity', e.target.value)} placeholder="Max participants" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Program'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}