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
import { REGISTRATION_STATUS_OPTIONS, DELIVERY_MODE_OPTIONS } from '@/lib/empoweruConstants';

const EMPTY = { participant_id: '', participant_name: '', cohort_id: '', cohort_name: '', registration_date: '', status: 'registered', waitlist_position: 0, preferred_delivery_mode: 'no_preference', accommodation_needs: '', intake_notes: '', notes: '' };

export default function RegistrationDialog({ open, onOpenChange, registration, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: participants = [] } = useQuery({ queryKey: ['empoweru-participants'], queryFn: () => base44.entities.EmpowerUParticipant.list(), enabled: open });
  const { data: cohorts = [] } = useQuery({ queryKey: ['empoweru-cohorts'], queryFn: () => base44.entities.EmpowerUCohort.list(), enabled: open });

  useEffect(() => { setForm(registration ? { ...registration } : { ...EMPTY, registration_date: new Date().toISOString().split('T')[0] }); }, [open, registration]);
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleParticipantChange = (id) => { const p = participants.find(x => x.id === id); update('participant_id', id); update('participant_name', p ? `${p.first_name} ${p.last_name}` : ''); };
  const handleCohortChange = (id) => { const c = cohorts.find(x => x.id === id); update('cohort_id', id); update('cohort_name', c?.name || ''); };

  const handleSave = async () => {
    if (!form.participant_id || !form.cohort_id || !form.registration_date) { toast({ title: 'Participant, cohort, and date are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (registration) await base44.entities.EmpowerURegistration.update(registration.id, form);
      else await base44.entities.EmpowerURegistration.create(form);
      toast({ title: registration ? 'Registration updated' : 'Registration created' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{registration ? 'Edit Registration' : 'New Registration'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2"><Label>Participant *</Label><Select value={form.participant_id} onValueChange={handleParticipantChange}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{participants.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5 col-span-2"><Label>Cohort *</Label><Select value={form.cohort_id} onValueChange={handleCohortChange}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{cohorts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Registration Date *</Label><Input type="date" value={form.registration_date || ''} onChange={(e) => update('registration_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={form.status || 'registered'} onValueChange={(v) => update('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{REGISTRATION_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Preferred Delivery Mode</Label><Select value={form.preferred_delivery_mode || 'no_preference'} onValueChange={(v) => update('preferred_delivery_mode', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="no_preference">No Preference</SelectItem>{DELIVERY_MODE_OPTIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Waitlist Position</Label><Input type="number" min="0" value={form.waitlist_position ?? 0} onChange={(e) => update('waitlist_position', parseInt(e.target.value) || 0)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Accommodation Needs</Label><Input value={form.accommodation_needs || ''} onChange={(e) => update('accommodation_needs', e.target.value)} placeholder="Childcare, accessibility, etc." /></div>
          <div className="space-y-1.5 col-span-2"><Label>Intake Notes</Label><Textarea value={form.intake_notes || ''} onChange={(e) => update('intake_notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}