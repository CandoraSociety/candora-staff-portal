import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ENGAGEMENT_OPTIONS, SKILL_DEMO_OPTIONS, ATTENDANCE_OPTIONS } from '@/lib/digilitConstants';

const EMPTY = { participant_id: '', participant_name: '', session_id: '', session_title: '', evaluation_date: '', evaluator_name: '', evaluator_email: '', attendance: 'present', engagement: 'moderate', skill_demonstration: 'met', topics_covered: '', progress_observed: '', areas_for_improvement: '', recommended_next_steps: '', overall_rating: 3, notes: '' };

export default function EvaluationDialog({ open, onOpenChange, evaluation, presetParticipantId, presetParticipantName, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: participants = [] } = useQuery({ queryKey: ['digilit-participants'], queryFn: () => base44.entities.DigiLitParticipant.list('-registration_date', 500), enabled: open });
  const { data: sessions = [] } = useQuery({ queryKey: ['digilit-sessions'], queryFn: () => base44.entities.DigiLitSession.list('-session_date', 200), enabled: open });

  useEffect(() => {
    if (open) {
      if (evaluation) setForm({ ...evaluation });
      else setForm({ ...EMPTY, evaluation_date: new Date().toISOString().split('T')[0], participant_id: presetParticipantId || '', participant_name: presetParticipantName || '' });
    }
  }, [open, evaluation, presetParticipantId, presetParticipantName]);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleParticipantSelect = (id) => {
    const p = participants.find(p => p.id === id);
    update('participant_id', id);
    if (p) update('participant_name', `${p.first_name} ${p.last_name}`);
  };

  const handleSessionSelect = (id) => {
    const s = sessions.find(s => s.id === id);
    update('session_id', id);
    if (s) update('session_title', s.title);
  };

  const handleSave = async () => {
    if (!form.participant_id || !form.evaluation_date) { toast({ title: 'Participant and date are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (evaluation) await base44.entities.DigiLitEvaluation.update(evaluation.id, form);
      else await base44.entities.DigiLitEvaluation.create(form);
      toast({ title: evaluation ? 'Evaluation updated' : 'Evaluation created' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{evaluation ? 'Edit Evaluation' : 'New Facilitator Evaluation'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2"><Label>Participant *</Label><Select value={form.participant_id} onValueChange={handleParticipantSelect}><SelectTrigger><SelectValue placeholder="Select participant..." /></SelectTrigger><SelectContent>{participants.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5 col-span-2"><Label>Session (optional)</Label><Select value={form.session_id || ''} onValueChange={handleSessionSelect}><SelectTrigger><SelectValue placeholder="General evaluation (no specific session)" /></SelectTrigger><SelectContent>{sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.title} — {s.session_date ? new Date(s.session_date).toLocaleDateString() : ''}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Evaluation Date *</Label><Input type="date" value={form.evaluation_date || ''} onChange={(e) => update('evaluation_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Evaluator Name</Label><Input value={form.evaluator_name || ''} onChange={(e) => update('evaluator_name', e.target.value)} placeholder="Facilitator/volunteer" /></div>
          <div className="space-y-1.5"><Label>Attendance</Label><Select value={form.attendance || 'present'} onValueChange={(v) => update('attendance', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ATTENDANCE_OPTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Engagement Level</Label><Select value={form.engagement || 'moderate'} onValueChange={(v) => update('engagement', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ENGAGEMENT_OPTIONS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5 col-span-2"><Label>Skill Demonstration</Label><Select value={form.skill_demonstration || 'met'} onValueChange={(v) => update('skill_demonstration', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SKILL_DEMO_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5 col-span-2"><Label>Topics Covered</Label><Textarea value={form.topics_covered || ''} onChange={(e) => update('topics_covered', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Progress Observed</Label><Textarea value={form.progress_observed || ''} onChange={(e) => update('progress_observed', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Areas for Improvement</Label><Textarea value={form.areas_for_improvement || ''} onChange={(e) => update('areas_for_improvement', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Recommended Next Steps</Label><Textarea value={form.recommended_next_steps || ''} onChange={(e) => update('recommended_next_steps', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Overall Rating: {form.overall_rating || 3}/5</Label><input type="range" min="1" max="5" value={form.overall_rating || 3} onChange={(e) => update('overall_rating', parseInt(e.target.value))} className="w-full" /></div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}