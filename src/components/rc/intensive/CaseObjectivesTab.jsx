import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OBJECTIVE_STATUS_OPTIONS, uid, today } from './caseConstants';

const EMPTY = { text: '', target_date: '', notes: '' };

export default function CaseObjectivesTab({ objectives = [], onAdd, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const save = () => {
    if (!form.text.trim()) return;
    onAdd({ id: uid(), text: form.text.trim(), target_date: form.target_date || null, status: 'in_progress', achieved_date: null, notes: form.notes });
    setForm(EMPTY); setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Objectives</CardTitle><Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Objective</Button></CardHeader>
      <CardContent>
        {objectives.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No objectives set yet</p> : (
          <div className="space-y-2">
            {objectives.map(o => (
              <div key={o.id} className="flex items-start justify-between gap-3 p-3 rounded-md border border-border/50">
                <div className="min-w-0">
                  <p className={`text-sm ${o.status === 'achieved' ? 'text-green-700' : o.status === 'dropped' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{o.text}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                    {o.target_date && <span>Target: {o.target_date}</span>}
                    {o.achieved_date && <span className="text-green-600">Achieved: {o.achieved_date}</span>}
                    {o.notes && <span>{o.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Select value={o.status || 'in_progress'} onValueChange={(v) => onUpdate(o.id, { status: v, achieved_date: v === 'achieved' ? (o.achieved_date || today()) : null })}>
                    <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{OBJECTIVE_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(o.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Objective</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Objective</Label><Textarea rows={2} value={form.text} onChange={(e) => set('text', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Target Date</Label><Input type="date" value={form.target_date} onChange={(e) => set('target_date', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Add Objective</Button></div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}