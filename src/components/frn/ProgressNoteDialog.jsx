import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const CATEGORIES = [
  { value: 'progress', label: 'Progress' },
  { value: 'evaluation', label: 'Evaluation' },
  { value: 'goal_update', label: 'Goal update' },
  { value: 'contact', label: 'Contact' },
  { value: 'general', label: 'General note' },
];

const RATINGS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'steady', label: 'Steady' },
  { value: 'needs_support', label: 'Needs support' },
  { value: 'at_risk', label: 'At risk' },
];

export default function ProgressNoteDialog({ open, onOpenChange, note, participant, programs = [], onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [author, setAuthor] = useState('');
  const [form, setForm] = useState({
    note_date: '', program_name: '', category: 'progress', progress_rating: '', summary: '', next_steps: '',
  });

  useEffect(() => {
    if (!open) return;
    setForm(note ? {
      note_date: note.note_date || '',
      program_name: note.program_name || '',
      category: note.category || 'progress',
      progress_rating: note.progress_rating || '',
      summary: note.summary || '',
      next_steps: note.next_steps || '',
    } : {
      note_date: new Date().toISOString().split('T')[0],
      program_name: programs[0]?.name || '',
      category: 'progress',
      progress_rating: '',
      summary: '',
      next_steps: '',
    });
  }, [open, note, programs]);

  useEffect(() => {
    if (!open || note) return;
    base44.auth.me().then(me => setAuthor(me?.full_name || '')).catch(() => setAuthor(''));
  }, [open, note]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.summary?.trim()) {
      toast({ title: 'Add a summary of the progress or observation', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        participant_id: participant.id,
        participant_name: `${participant.first_name} ${participant.last_name}`,
        recorded_by_name: note?.recorded_by_name || author,
      };
      if (note?.id) {
        await base44.entities.FRNProgressNote.update(note.id, payload);
        toast({ title: 'Note updated' });
      } else {
        await base44.entities.FRNProgressNote.create(payload);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{note ? 'Edit note' : 'Add progress note'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input type="date" value={form.note_date} onChange={(e) => update('note_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Program</Label>
            <Select value={form.program_name || 'none'} onValueChange={(v) => update('program_name', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Not program-specific" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not program-specific</SelectItem>
                {programs.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                {form.program_name && !programs.some(p => p.name === form.program_name) && (
                  <SelectItem value={form.program_name}>{form.program_name}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Type of note</Label>
            <Select value={form.category} onValueChange={(v) => update('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Overall read</Label>
            <Select value={form.progress_rating || 'none'} onValueChange={(v) => update('progress_rating', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="No rating" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No rating</SelectItem>
                {RATINGS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Summary *</Label>
            <Textarea value={form.summary} onChange={(e) => update('summary', e.target.value)} rows={4} placeholder="What was observed, what the participant did or said, and what it means" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Next steps</Label>
            <Textarea value={form.next_steps} onChange={(e) => update('next_steps', e.target.value)} rows={2} placeholder="Follow-up actions for the next contact" />
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