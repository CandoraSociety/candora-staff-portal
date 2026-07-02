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
import { FRN_PROGRAMS } from '@/lib/frnConstants';

const EMPTY = {
  participant_id: '', participant_name: '', program: '', referral_source: 'internal',
  referring_organization: '', referring_person_name: '', referring_person_email: '',
  referring_person_phone: '', referral_date: '', referral_reason: '', notes: '',
};

export default function ReferralFormDialog({ open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: participants = [] } = useQuery({
    queryKey: ['frn-participants'],
    queryFn: () => base44.entities.FRNParticipant.list(),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, referral_date: new Date().toISOString().split('T')[0] });
    }
  }, [open]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleParticipantChange = (participantId) => {
    const p = participants.find(p => p.id === participantId);
    update('participant_id', participantId);
    update('participant_name', p ? `${p.first_name} ${p.last_name}` : '');
  };

  const handleSave = async () => {
    if (!form.participant_id || !form.program || !form.referral_date) {
      toast({ title: 'Participant, program, and referral date are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.FRNReferral.create(form);
      toast({ title: 'Referral created' });
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error creating referral', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Referral</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label>Participant *</Label>
            <Select value={form.participant_id} onValueChange={handleParticipantChange}>
              <SelectTrigger><SelectValue placeholder="Select participant..." /></SelectTrigger>
              <SelectContent>
                {participants.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Program *</Label>
            <Select value={form.program} onValueChange={(v) => update('program', v)}>
              <SelectTrigger><SelectValue placeholder="Select program..." /></SelectTrigger>
              <SelectContent>
                {FRN_PROGRAMS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Referral Date *</Label>
            <Input type="date" value={form.referral_date || ''} onChange={(e) => update('referral_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Referral Source *</Label>
            <Select value={form.referral_source} onValueChange={(v) => update('referral_source', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal Referral</SelectItem>
                <SelectItem value="external_partner">External Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.referral_source === 'external_partner' && (
            <div className="space-y-1.5">
              <Label>Referring Organization</Label>
              <Input value={form.referring_organization || ''} onChange={(e) => update('referring_organization', e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Referring Person Name</Label>
            <Input value={form.referring_person_name || ''} onChange={(e) => update('referring_person_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Referring Person Email</Label>
            <Input type="email" value={form.referring_person_email || ''} onChange={(e) => update('referring_person_email', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Referring Person Phone</Label>
            <Input value={form.referring_person_phone || ''} onChange={(e) => update('referring_person_phone', e.target.value)} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Referral Reason</Label>
            <Textarea value={form.referral_reason || ''} onChange={(e) => update('referral_reason', e.target.value)} rows={3} placeholder="Why is the participant being referred? What are their needs?" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Create Referral'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}