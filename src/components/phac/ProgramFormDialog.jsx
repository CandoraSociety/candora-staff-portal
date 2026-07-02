import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { WEEKDAY_OPTIONS, PROGRAM_STATUS_OPTIONS, MONTH_LABELS } from '@/lib/phacConstants';

const EMPTY = {
  name: '', description: '', target_age_min_months: 0, target_age_max_months: 72,
  schedule_days: [], start_time: '', end_time: '', location: '',
  season_start_month: 9, season_end_month: 6, status: 'active', facilitator: '', notes: '',
};

export default function ProgramFormDialog({ open, onOpenChange, program, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(program ? { ...EMPTY, ...program } : EMPTY);
  }, [open, program]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      schedule_days: prev.schedule_days?.includes(day)
        ? prev.schedule_days.filter(d => d !== day)
        : [...(prev.schedule_days || []), day],
    }));
  };

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: 'Program name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (program?.id) {
        await base44.entities.PHACProgram.update(program.id, form);
        toast({ title: 'Program updated' });
      } else {
        await base44.entities.PHACProgram.create(form);
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
        <DialogHeader>
          <DialogTitle>{program ? 'Edit Program' : 'Add Program'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label>Program Name *</Label>
            <Input value={form.name || ''} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Toddler Play Time" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={(e) => update('description', e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Min Age (months)</Label>
            <Input type="number" value={form.target_age_min_months ?? 0} onChange={(e) => update('target_age_min_months', parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label>Max Age (months)</Label>
            <Input type="number" value={form.target_age_max_months ?? 72} onChange={(e) => update('target_age_max_months', parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Schedule Days</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map(day => (
                <div key={day.value} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={form.schedule_days?.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">{day.label}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Start Time</Label>
            <Input type="time" value={form.start_time || ''} onChange={(e) => update('start_time', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End Time</Label>
            <Input type="time" value={form.end_time || ''} onChange={(e) => update('end_time', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={form.location || ''} onChange={(e) => update('location', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Facilitator</Label>
            <Input value={form.facilitator || ''} onChange={(e) => update('facilitator', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Season Starts</Label>
            <Select value={String(form.season_start_month)} onValueChange={(v) => update('season_start_month', parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MONTH_LABELS).map(([m, label]) => (
                  <SelectItem key={m} value={m}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Season Ends</Label>
            <Select value={String(form.season_end_month)} onValueChange={(v) => update('season_end_month', parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MONTH_LABELS).map(([m, label]) => (
                  <SelectItem key={m} value={m}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="col-span-2 text-xs text-muted-foreground">PHAC programs do not run in July or August.</p>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROGRAM_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
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