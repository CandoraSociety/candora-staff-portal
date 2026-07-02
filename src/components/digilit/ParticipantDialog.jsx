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
import { PARTICIPANT_STATUS_OPTIONS, SKILL_LEVEL_OPTIONS } from '@/lib/digilitConstants';
import { syncToPathways } from '@/lib/digilitPathwaysSync';

const EMPTY = { first_name: '', last_name: '', phone: '', email: '', pathways_client_id: '', is_pathways_participant: false, partner_organization: 'PALS', registration_date: '', status: 'registered', start_date: '', completion_date: '', skill_level_start: 'not_assessed', skill_level_current: 'not_assessed', notes: '' };

export default function ParticipantDialog({ open, onOpenChange, participant, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: pathwaysClients = [] } = useQuery({ queryKey: ['pathways-clients-for-digilit'], queryFn: () => base44.entities.Client.filter({ service_type: 'pathways' }, '-intake_date', 500), enabled: open && form.is_pathways_participant });

  useEffect(() => {
    if (open) setForm(participant ? { ...participant } : { ...EMPTY, registration_date: new Date().toISOString().split('T')[0] });
  }, [open, participant]);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handlePathwaysToggle = (checked) => {
    update('is_pathways_participant', checked);
    if (!checked) update('pathways_client_id', '');
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.registration_date) { toast({ title: 'First name, last name, and registration date are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const oldStatus = participant?.status;
      const newStatus = form.status;

      if (participant) {
        await base44.entities.DigiLitParticipant.update(participant.id, form);
      } else {
        await base44.entities.DigiLitParticipant.create(form);
      }

      // If linked to Pathways and status changed, sync milestones + notes
      if (form.is_pathways_participant && form.pathways_client_id && oldStatus !== newStatus) {
        const participantName = `${form.first_name} ${form.last_name}`;
        const result = await syncToPathways({
          pathways_client_id: form.pathways_client_id,
          participant_name: participantName,
          newStatus,
          oldStatus,
        });
        if (result.success) {
          toast({ title: 'Pathways updated', description: `Milestone and progress note added to Pathways client profile` });
        } else {
          toast({ title: 'Pathways sync failed', description: result.error, variant: 'destructive' });
        }
      }

      toast({ title: participant ? 'Participant updated' : 'Participant registered' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{participant ? 'Edit Participant' : 'New Participant Registration'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>First Name *</Label><Input value={form.first_name || ''} onChange={(e) => update('first_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Last Name *</Label><Input value={form.last_name || ''} onChange={(e) => update('last_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Registration Date *</Label><Input type="date" value={form.registration_date || ''} onChange={(e) => update('registration_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Partner Organization</Label><Input value={form.partner_organization || ''} onChange={(e) => update('partner_organization', e.target.value)} placeholder="e.g. PALS" /></div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={form.status || 'registered'} onValueChange={(v) => update('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PARTICIPANT_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Initial Skill Level</Label><Select value={form.skill_level_start || 'not_assessed'} onValueChange={(v) => update('skill_level_start', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SKILL_LEVEL_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Current Skill Level</Label><Select value={form.skill_level_current || 'not_assessed'} onValueChange={(v) => update('skill_level_current', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SKILL_LEVEL_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          {(form.status === 'started' || form.status === 'completed') && <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.start_date || ''} onChange={(e) => update('start_date', e.target.value)} /></div>}
          {form.status === 'completed' && <div className="space-y-1.5"><Label>Completion Date</Label><Input type="date" value={form.completion_date || ''} onChange={(e) => update('completion_date', e.target.value)} /></div>}
          <div className="col-span-2 mt-1 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-2"><Checkbox id="pathways-link" checked={form.is_pathways_participant || false} onCheckedChange={handlePathwaysToggle} /><label htmlFor="pathways-link" className="text-sm font-medium cursor-pointer">Link to Pathways CM client</label></div>
            {form.is_pathways_participant && (
              <div className="space-y-1.5"><Label className="text-xs">Select Pathways Client</Label><Select value={form.pathways_client_id || ''} onValueChange={(v) => update('pathways_client_id', v)}><SelectTrigger><SelectValue placeholder="Search Pathways clients..." /></SelectTrigger><SelectContent>{pathwaysClients.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}{c.email ? ` — ${c.email}` : ''}</SelectItem>)}</SelectContent></Select>
              <p className="text-xs text-blue-600 mt-1">When status changes, milestones and progress notes are automatically added to this client's Pathways profile.</p></div>
            )}
          </div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}