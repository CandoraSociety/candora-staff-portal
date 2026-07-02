import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { REGISTRATION_STATUS_OPTIONS, PROGRAM_CATEGORY_OPTIONS } from '@/lib/communityConstants';

const EMPTY = { first_name: '', last_name: '', phone: '', email: '', date_of_birth: '', emergency_contact_name: '', emergency_contact_phone: '', notes: '', _program_id: '', _program_name: '', _registration_status: 'registered' };

export default function ParticipantDialog({ open, onOpenChange, participant, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: programs = [] } = useQuery({ queryKey: ['community-programs'], queryFn: () => base44.entities.CommunityProgram.filter({ status: 'active' }, 'name', 200), enabled: open });

  useEffect(() => { if (open) setForm(participant ? { ...participant } : { ...EMPTY }); }, [open, participant]);
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) { toast({ title: 'First and last name are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const { _program_id, _program_name, _registration_status, ...participantData } = form;
      let savedParticipant;
      if (participant) {
        savedParticipant = await base44.entities.CommunityParticipant.update(participant.id, participantData);
      } else {
        savedParticipant = await base44.entities.CommunityParticipant.create(participantData);
      }

      // If a program was selected and this is a new participant, create a registration
      if (_program_id && !participant) {
        await base44.entities.CommunityRegistration.create({
          participant_id: savedParticipant.id,
          participant_name: `${form.first_name} ${form.last_name}`,
          program_id: _program_id,
          program_name: _program_name,
          registration_date: new Date().toISOString().split('T')[0],
          status: _registration_status || 'registered',
        });
      }

      toast({ title: participant ? 'Participant updated' : 'Participant created' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{participant ? 'Edit Participant' : 'New Participant'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>First Name *</Label><Input value={form.first_name || ''} onChange={(e) => update('first_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Last Name *</Label><Input value={form.last_name || ''} onChange={(e) => update('last_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth || ''} onChange={(e) => update('date_of_birth', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Emergency Contact</Label><Input value={form.emergency_contact_name || ''} onChange={(e) => update('emergency_contact_name', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Emergency Contact Phone</Label><Input value={form.emergency_contact_phone || ''} onChange={(e) => update('emergency_contact_phone', e.target.value)} /></div>
          {!participant && (
            <div className="col-span-2 mt-1 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm font-medium mb-2">Register in a program (optional):</p>
              <div className="space-y-2">
                <Select value={form._program_id || ''} onValueChange={(v) => { const p = programs.find(p => p.id === v); update('_program_id', v); update('_program_name', p?.name || ''); }}><SelectTrigger><SelectValue placeholder="Select a program..." /></SelectTrigger><SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{PROGRAM_CATEGORY_OPTIONS.find(c => c.value === p.category)?.icon} {p.name}</SelectItem>)}</SelectContent></Select>
                {form._program_id && <Select value={form._registration_status || 'registered'} onValueChange={(v) => update('_registration_status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{REGISTRATION_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>}
              </div>
            </div>
          )}
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}