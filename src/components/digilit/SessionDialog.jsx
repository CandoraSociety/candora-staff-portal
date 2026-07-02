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
import { SESSION_STATUS_OPTIONS, TOPIC_AREA_OPTIONS } from '@/lib/digilitConstants';

const EMPTY = { title: '', session_date: '', start_time: '', end_time: '', location: '', facilitator_name: '', facilitator_email: '', topic_area: 'computer_basics', max_participants: 10, registered_participant_ids: [], attended_participant_ids: [], status: 'scheduled', notes: '' };

export default function SessionDialog({ open, onOpenChange, session, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: participants = [] } = useQuery({ queryKey: ['digilit-participants'], queryFn: () => base44.entities.DigiLitParticipant.list('-registration_date', 500), enabled: open });

  useEffect(() => { if (open) setForm(session ? { ...session } : { ...EMPTY, session_date: new Date().toISOString().split('T')[0] }); }, [open, session]);
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const toggleParticipant = (id) => {
    const ids = form.registered_participant_ids || [];
    update('registered_participant_ids', ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };

  const handleSave = async () => {
    if (!form.title || !form.session_date) { toast({ title: 'Title and date are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (session) await base44.entities.DigiLitSession.update(session.id, form);
      else await base44.entities.DigiLitSession.create(form);
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
          <div className="space-y-1.5 col-span-2"><Label>Title *</Label><Input value={form.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Email Basics" /></div>
          <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={form.session_date || ''} onChange={(e) => update('session_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Topic Area</Label><Select value={form.topic_area || 'computer_basics'} onValueChange={(v) => update('topic_area', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TOPIC_AREA_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Start Time</Label><Input type="time" value={form.start_time || ''} onChange={(e) => update('start_time', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>End Time</Label><Input type="time" value={form.end_time || ''} onChange={(e) => update('end_time', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Location</Label><Input value={form.location || ''} onChange={(e) => update('location', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Max Participants</Label><Input type="number" min="1" value={form.max_participants ?? 10} onChange={(e) => update('max_participants', parseInt(e.target.value) || 10)} /></div>
          <div className="space-y-1.5"><Label>Facilitator Name</Label><Input value={form.facilitator_name || ''} onChange={(e) => update('facilitator_name', e.target.value)} placeholder="Volunteer facilitator" /></div>
          <div className="space-y-1.5"><Label>Facilitator Email</Label><Input type="email" value={form.facilitator_email || ''} onChange={(e) => update('facilitator_email', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={form.status || 'scheduled'} onValueChange={(v) => update('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SESSION_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="col-span-2 mt-1"><Label className="text-sm font-medium">Registered Participants ({(form.registered_participant_ids || []).length})</Label><div className="max-h-40 overflow-y-auto border rounded-md p-2 mt-1 space-y-1">{participants.length === 0 ? <p className="text-xs text-muted-foreground text-center py-2">No participants registered yet</p> : participants.map(p => <div key={p.id} className="flex items-center gap-2"><input type="checkbox" checked={(form.registered_participant_ids || []).includes(p.id)} onChange={() => toggleParticipant(p.id)} className="rounded" /><span className="text-sm">{p.first_name} {p.last_name}{p.status === 'completed' ? ' ✓' : ''}</span></div>)}</div></div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}