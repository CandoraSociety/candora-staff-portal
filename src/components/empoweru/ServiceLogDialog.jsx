import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { SERVICE_TYPE_OPTIONS } from '@/lib/empoweruConstants';

const EMPTY = { participant_id: '', participant_name: '', cohort_id: '', cohort_name: '', service_date: '', service_type: '', worker_name: '', description: '', outcome: '', follow_up_needed: false, follow_up_date: '', notes: '' };

export default function ServiceLogDialog({ open, onOpenChange, participantId, participantName, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: participants = [] } = useQuery({ queryKey: ['empoweru-participants'], queryFn: () => base44.entities.EmpowerUParticipant.list(), enabled: open && !participantId });
  const { data: cohorts = [] } = useQuery({ queryKey: ['empoweru-cohorts'], queryFn: () => base44.entities.EmpowerUCohort.list(), enabled: open });

  useEffect(() => { if (open) setForm({ ...EMPTY, participant_id: participantId || '', participant_name: participantName || '', service_date: new Date().toISOString().split('T')[0] }); }, [open, participantId, participantName]);
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleParticipantChange = (id) => { const p = participants.find(x => x.id === id); update('participant_id', id); update('participant_name', p ? `${p.first_name} ${p.last_name}` : ''); };
  const handleCohortChange = (id) => { const c = cohorts.find(x => x.id === id); update('cohort_id', id); update('cohort_name', c?.name || ''); };

  const handleSave = async () => {
    if (!form.participant_id || !form.service_date) { toast({ title: 'Participant and service date are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await base44.entities.EmpowerUServiceLog.create(form);
      toast({ title: 'Service log created' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Log Service</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {!participantId && <div className="space-y-1.5 col-span-2"><Label>Participant *</Label><Select value={form.participant_id} onValueChange={handleParticipantChange}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{participants.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent></Select></div>}
          <div className="space-y-1.5 col-span-2"><Label>Cohort (optional)</Label><Select value={form.cohort_id} onValueChange={handleCohortChange}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value={null}>None</SelectItem>{cohorts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Service Date *</Label><Input type="date" value={form.service_date || ''} onChange={(e) => update('service_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Service Type</Label><Select value={form.service_type} onValueChange={(v) => update('service_type', v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{SERVICE_TYPE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5 col-span-2"><Label>Worker Name</Label><Input value={form.worker_name || ''} onChange={(e) => update('worker_name', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Description</Label><Textarea value={form.description || ''} onChange={(e) => update('description', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Outcome</Label><Input value={form.outcome || ''} onChange={(e) => update('outcome', e.target.value)} /></div>
          <div className="flex items-center gap-2 col-span-2"><Checkbox id="fu" checked={form.follow_up_needed || false} onCheckedChange={(v) => update('follow_up_needed', v)} /><label htmlFor="fu" className="text-sm cursor-pointer">Follow-up needed</label></div>
          {form.follow_up_needed && <div className="space-y-1.5 col-span-2"><Label>Follow-up Date</Label><Input type="date" value={form.follow_up_date || ''} onChange={(e) => update('follow_up_date', e.target.value)} /></div>}
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}