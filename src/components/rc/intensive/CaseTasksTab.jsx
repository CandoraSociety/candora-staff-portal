import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CASE_STAGES, STAGE_LABELS, uid, today } from './caseConstants';

const EMPTY = { title: '', stage_key: '', due_date: '', assigned_to: '', notes: '' };

export default function CaseTasksTab({ tasks = [], onAdd, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const save = () => {
    if (!form.title.trim()) return;
    onAdd({ id: uid(), title: form.title.trim(), stage_key: form.stage_key || null, status: 'todo', due_date: form.due_date || null, assigned_to: form.assigned_to, notes: form.notes, created_date: today(), completed_date: null });
    setForm(EMPTY); setOpen(false);
  };

  const toggleDone = (t) => {
    const done = t.status === 'done';
    onUpdate(t.id, { status: done ? 'todo' : 'done', completed_date: done ? null : today() });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Tasks</CardTitle><Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Task</Button></CardHeader>
      <CardContent>
        {tasks.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p> : (
          <div className="space-y-2">
            {tasks.map(t => {
              const overdue = t.due_date && t.status !== 'done' && t.due_date < today();
              return (
                <div key={t.id} className="flex items-start gap-3 p-2.5 rounded-md border border-border/50">
                  <Checkbox checked={t.status === 'done'} onCheckedChange={() => toggleDone(t)} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${t.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.title}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      {t.stage_key && <span className="px-1.5 py-0.5 rounded bg-muted">{STAGE_LABELS[t.stage_key] || t.stage_key}</span>}
                      {t.due_date && <span className={overdue ? 'text-red-600 font-medium' : ''}>{overdue ? `Overdue — ${t.due_date}` : `Due ${t.due_date}`}</span>}
                      {t.assigned_to && <span>Assigned: {t.assigned_to}</span>}
                      {t.notes && <span>{t.notes}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Stage</Label>
              <Select value={form.stage_key || 'none'} onValueChange={(v) => set('stage_key', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="General" /></SelectTrigger>
                <SelectContent><SelectItem value="none">General (no stage)</SelectItem>{CASE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Assigned To</Label><Input value={form.assigned_to} onChange={(e) => set('assigned_to', e.target.value)} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Add Task</Button></div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}