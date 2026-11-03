import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export const GOAL_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not started', color: '#64748b' },
  { value: 'in_progress', label: 'In progress', color: '#3b82f6' },
  { value: 'achieved', label: 'Achieved', color: '#22c55e' },
  { value: 'on_hold', label: 'On hold', color: '#f59e0b' },
];

export default function GoalDialog({ open, onOpenChange, goal, onSave }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ goal: '', target_date: '', status: 'not_started', notes: '' });

  useEffect(() => {
    if (open) setForm(goal ? { ...form, ...goal } : { goal: '', target_date: '', status: 'not_started', notes: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, goal]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.goal?.trim()) {
      toast({ title: 'Describe the goal', variant: 'destructive' });
      return;
    }
    onSave?.({ ...form, goal: form.goal.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{goal ? 'Edit goal' : 'Set a goal'}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label>Goal *</Label>
            <Input value={form.goal} onChange={(e) => update('goal', e.target.value)} placeholder="What the participant is working towards" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Target date</Label>
              <Input type="date" value={form.target_date || ''} onChange={(e) => update('target_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GOAL_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Goal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}