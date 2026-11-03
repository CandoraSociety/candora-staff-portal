import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { todayISO } from '@/lib/sessionOccurrences';

export const NOTE_CATEGORY_OPTIONS = [
  { value: 'observation', label: 'Observation' },
  { value: 'development', label: 'Development' },
  { value: 'contact', label: 'Contact' },
  { value: 'general', label: 'General' },
];

export const NOTE_RATING_OPTIONS = [
  { value: 'thriving', label: 'Thriving', color: '#16a34a' },
  { value: 'on_track', label: 'On track', color: '#0ea5e9' },
  { value: 'needs_support', label: 'Needs support', color: '#f59e0b' },
  { value: 'follow_up', label: 'Follow-up needed', color: '#ef4444' },
];

const EMPTY = {
  note_date: '', category: 'observation', program_name: '', progress_rating: '', summary: '', next_steps: '',
};

export default function ProgressNoteDialog({ open, onOpenChange, note, participant, programs = [], onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(note ? { ...EMPTY, ...note } : { ...EMPTY, note_date: todayISO() });
  }, [open, note]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.summary?.trim()) {
      toast({ title: 'Add what you observed before saving', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (note?.id) {
        await base44.entities.PHACProgressNote.update(note.id, form);
        toast({ title: 'Note updated' });
      } else {
        const me = await base44.auth.me().catch(() => null);
        await base44.entities.PHACProgressNote.create({
          ...form,
          participant_id: participant?.id,
          participant_name: [participant?.child_first_name, participant?.child_last_name].filter(Boolean).join(' '),
          recorded_by_name: me?.full_name || '',
        });
        toast({ title: 'Note added' });
      }
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error saving note', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit note' : 'Add progress note'}{participant ? ` — ${participant.child_first_name || 'Family'}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={form.note_date || ''} onChange={(e) => update('note_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.category || 'observation'} onValueChange={(v) => update('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{NOTE_CATEGORY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Program</Label>
            <Select value={form.program_name || 'none'} onValueChange={(v) => update('program_name', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Not program specific" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not program specific</SelectItem>
                {programs.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Overall read</Label>
            <Select value={form.progress_rating || 'none'} onValueChange={(v) => update('progress_rating', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                {NOTE_RATING_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>What you observed *</Label>
            <Textarea value={form.summary || ''} onChange={(e) => update('summary', e.target.value)} rows={4} placeholder="How the child and caregiver engaged, what changed, what stood out" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Next steps</Label>
            <Textarea value={form.next_steps || ''} onChange={(e) => update('next_steps', e.target.value)} rows={2} placeholder="Follow-up for the next visit or contact" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Note'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}