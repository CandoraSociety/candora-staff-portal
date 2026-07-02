import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { SESSION_STATUS_OPTIONS } from '@/lib/communityConstants';

const EMPTY = { program_id: '', program_name: '', title: '', session_date: '', start_time: '', end_time: '', location: '', facilitator_name: '', facilitator_email: '', registered_participant_ids: [], attended_participant_ids: [], status: 'scheduled', notes: '' };

export default function SessionDialog({ open, onOpenChange, session, presetProgramId, presetProgramName, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: programs = [] } = useQuery({ queryKey: ['community-programs'], queryFn: () => base44.entities.CommunityProgram.filter({ status: 'active' }, 'name', 200), enabled: open });
  const { data: registrations = [] } = useQuery({
    queryKey: ['community-registrations', form.program_id],
    queryFn: () => base44.entities.CommunityRegistration.filter({ program_id: form.program_id }, '-registration_date', 500),
    enabled: open && !!form.program_id,
  });

  useEffect(() => {
    if (open) {
      if (session) setForm({ ...session });
      else setForm({ ...EMPTY, session_date: new Date().toISOString().split('T')[0], program_id: presetProgramId || '', program_name: presetProgramName || '' });
    }
  }, [open, session, presetProgramId, presetProgramName]);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleProgramSelect = (id) => {
    const p = programs.find(p => p.id === id);
    update('program_id', id);
    update('program_name', p?.name || '');
    update('registered_participant_ids', []);
  };

  const toggleParticipant = (id) => {
    const ids = form.registered_participant_ids || [];
    update('registered_participant_ids', ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };

  const handleSave = async () => {
    if (!form.program_id || !form.session_date) { toast({ title: 'Program and date are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (session) await base44.entities.CommunitySession.update(session.id, form);
      else await base44.entities.CommunitySession.create(form);
      toast({ title: session ? 'Session updated' : 'Session created' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{session ? 'Edit Session' : 'New Session'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2"><Label>Program *</Label><Select value={form.program_id || ''} onValueChange={handleProgramSelect}><SelectTrigger><SelectValue placeholder="Select program..." /></SelectTrigger><SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5 col-span-2"><Label>Session Title</Label><Input value={form.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Weekly Sewing Circle" /></div>
          <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={form.session_date || ''} onChange={(e) => update('session_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={form.status || 'scheduled'} onValueChange={(v) => update('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SESSION_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Start Time</Label><Input type="time" value={form.start_time || ''} onChange={(e) => update('start_time', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>End Time</Label><Input type="time" value={form.end_time || ''} onChange={(e) => update('end_time', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Location</Label><Input value={form.location || ''} onChange={(e) => update('location', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Facilitator</Label><Input value={form.facilitator_name || ''} onChange={(e) => update('facilitator_name', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Facilitator Email</Label><Input type="email" value={form.facilitator_email || ''} onChange={(e) => update('facilitator_email', e.target.value)} /></div>
          {form.program_id && (
            <div className="col-span-2"><Label className="text-sm font-medium">Registered Participants ({(form.registered_participant_ids || []).length})</Label><div className="max-h-40 overflow-y-auto border rounded-md p-2 mt-1 space-y-1">{registrations.length === 0 ? <p className="text-xs text-muted-foreground text-center py-2">No registrations for this program yet</p> : registrations.map(r => <div key={r.participant_id} className="flex items-center gap-2"><input type="checkbox" checked={(form.registered_participant_ids || []).includes(r.participant_id)} onChange={() => toggleParticipant(r.participant_id)} className="rounded" /><span className="text-sm">{r.participant_name}</span></div>)}</div></div>
          )}
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}