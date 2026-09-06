import React, { useState } from 'react';
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OBJECTIVE_STATUS_OPTIONS, uid, today } from './caseConstants';

const EMPTY = {
  text: '', why_it_matters: '', related_need: '', strengths: '',
  participant_actions: '', worker_actions: '', others_involved: '',
  target_date: '', indicators: '', notes: '',
};

const STATUS_COLORS = Object.fromEntries(OBJECTIVE_STATUS_OPTIONS.map(o => [o.value, o.color]));
const STATUS_LABELS = Object.fromEntries(OBJECTIVE_STATUS_OPTIONS.map(o => [o.value, o.label]));

// Collaborative, participant-centred goal setting with preserved progress history.
export default function CaseGoalsTab({ objectives = [], onAdd, onUpdate, onDelete, meName }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [expanded, setExpanded] = useState({});
  const [noteDrafts, setNoteDrafts] = useState({});
  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const openNew = () => { setEditId(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (o) => {
    setEditId(o.id);
    setForm({
      text: o.text || '', why_it_matters: o.why_it_matters || '', related_need: o.related_need || '',
      strengths: o.strengths || '', participant_actions: o.participant_actions || '',
      worker_actions: o.worker_actions || '', others_involved: o.others_involved || '',
      target_date: o.target_date || '', indicators: o.indicators || '', notes: o.notes || '',
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.text.trim()) return;
    if (editId) onUpdate(editId, { ...form, text: form.text.trim() });
    else onAdd({ id: uid(), ...form, text: form.text.trim(), status: 'in_progress', achieved_date: null, progress_notes: [] });
    setOpen(false);
  };

  const addNote = (o) => {
    const note = (noteDrafts[o.id] || '').trim();
    if (!note) return;
    onUpdate(o.id, { progress_notes: [...(o.progress_notes || []), { id: uid(), date: today(), note, by_name: meName || '' }] });
    setNoteDrafts(prev => ({ ...prev, [o.id]: '' }));
  };

  const Detail = ({ label, value }) => value ? (
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{value}</p>
    </div>
  ) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Collaborative Goals ({objectives.length})</CardTitle>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> Add Goal</Button>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">Participant-centred goals set with the caregiver — editable, with progress history preserved.</p>
        {objectives.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No goals set yet.</p>
        ) : (
          <div className="space-y-2">
            {objectives.map(o => {
              const statusColor = STATUS_COLORS[o.status || 'in_progress'] || '#94a3b8';
              return (
                <Collapsible key={o.id} open={!!expanded[o.id]} onOpenChange={(v) => setExpanded(prev => ({ ...prev, [o.id]: v }))}>
                  <div className="border border-border/50 rounded-md">
                    <CollapsibleTrigger asChild>
                      <div className="p-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-muted/40">
                        <div className="min-w-0">
                          <p className={`text-sm ${o.status === 'achieved' ? 'text-green-700' : o.status === 'dropped' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{o.text}</p>
                          <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
                            {o.target_date && <span>Target: {o.target_date}</span>}
                            {o.achieved_date && <span className="text-green-600">Achieved: {o.achieved_date}</span>}
                            <span>{(o.progress_notes || []).length} progress note(s)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <Select value={o.status || 'in_progress'} onValueChange={(v) => onUpdate(o.id, { status: v, achieved_date: v === 'achieved' ? (o.achieved_date || today()) : null })}>
                            <SelectTrigger className="h-7 w-32 text-xs"><span className="truncate" style={{ color: statusColor }}>{STATUS_LABELS[o.status || 'in_progress']}</span></SelectTrigger>
                            <SelectContent>{OBJECTIVE_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(o)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(o.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded[o.id] ? '' : '-rotate-90'}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3 pt-1 border-t border-border/50 space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <Detail label="Why it matters" value={o.why_it_matters} />
                          <Detail label="Related need / barrier" value={o.related_need} />
                          <Detail label="Strengths & resources" value={o.strengths} />
                          <Detail label="Others involved" value={o.others_involved} />
                          <Detail label="Participant actions" value={o.participant_actions} />
                          <Detail label="Worker actions / support" value={o.worker_actions} />
                          <Detail label="Indicators of success" value={o.indicators} />
                          <Detail label="Notes" value={o.notes} />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Progress Notes</p>
                          {(o.progress_notes || []).length > 0 && (
                            <ul className="space-y-1 mb-2">
                              {[...o.progress_notes].reverse().map(n => (
                                <li key={n.id} className="text-xs p-2 rounded bg-muted/50">
                                  <span className="font-semibold text-primary">{n.date || '—'}</span>
                                  {n.by_name && <span className="text-muted-foreground"> • {n.by_name}</span>}
                                  <p className="text-foreground mt-0.5 whitespace-pre-wrap">{n.note}</p>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="flex gap-2">
                            <Input value={noteDrafts[o.id] || ''} onChange={(e) => setNoteDrafts(prev => ({ ...prev, [o.id]: e.target.value }))}
                              placeholder="Add progress note..." onKeyDown={(e) => e.key === 'Enter' && addNote(o)} />
                            <Button size="sm" variant="outline" onClick={() => addNote(o)} disabled={!(noteDrafts[o.id] || '').trim()}>Add Note</Button>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Goal' : 'Add Goal'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2"><Label>Goal (participant-centred language) <span className="text-destructive">*</span></Label><Textarea rows={2} value={form.text} onChange={(e) => set('text', e.target.value)} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Why this goal matters to the caregiver/family</Label><Textarea rows={2} value={form.why_it_matters} onChange={(e) => set('why_it_matters', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Related assessed need/barrier</Label><Textarea rows={2} value={form.related_need} onChange={(e) => set('related_need', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Existing strengths/resources that support it</Label><Textarea rows={2} value={form.strengths} onChange={(e) => set('strengths', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Actions the participant will take</Label><Textarea rows={2} value={form.participant_actions} onChange={(e) => set('participant_actions', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Actions/support the caseworker will provide</Label><Textarea rows={2} value={form.worker_actions} onChange={(e) => set('worker_actions', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Other people/agencies involved</Label><Input value={form.others_involved} onChange={(e) => set('others_involved', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Target timeframe</Label><Input type="date" value={form.target_date} onChange={(e) => set('target_date', e.target.value)} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Indicators of progress/success</Label><Textarea rows={2} value={form.indicators} onChange={(e) => set('indicators', e.target.value)} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editId ? 'Save' : 'Add Goal'}</Button></div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}