import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const EMPTY = {
  first_name: '', last_name: '', date_of_birth: '', phone: '', email: '',
  address: '', city: '', preferred_language: '',
  guardian_name: '', guardian_phone: '',
  emergency_contact_name: '', emergency_contact_phone: '',
  notes: '',
};

export default function ParticipantFormDialog({ open, onOpenChange, participant, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(participant ? { ...EMPTY, ...participant } : EMPTY);
  }, [open, participant]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) {
      toast({ title: 'First and last name are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (participant?.id) {
        await base44.entities.FRNParticipant.update(participant.id, form);
        toast({ title: 'Participant updated' });
      } else {
        await base44.entities.FRNParticipant.create(form);
        toast({ title: 'Participant created' });
      }
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error saving participant', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{participant ? 'Edit Participant' : 'Add Participant'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>First Name *</Label>
            <Input value={form.first_name || ''} onChange={(e) => update('first_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Last Name *</Label>
            <Input value={form.last_name || ''} onChange={(e) => update('last_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Date of Birth</Label>
            <Input type="date" value={form.date_of_birth || ''} onChange={(e) => update('date_of_birth', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Preferred Language</Label>
            <Input value={form.preferred_language || ''} onChange={(e) => update('preferred_language', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Address</Label>
            <Input value={form.address || ''} onChange={(e) => update('address', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input value={form.city || ''} onChange={(e) => update('city', e.target.value)} />
          </div>
          <div className="col-span-2"><p className="text-sm font-medium text-foreground mt-2 mb-1">Guardian (if minor)</p></div>
          <div className="space-y-1.5">
            <Label>Guardian Name</Label>
            <Input value={form.guardian_name || ''} onChange={(e) => update('guardian_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Guardian Phone</Label>
            <Input value={form.guardian_phone || ''} onChange={(e) => update('guardian_phone', e.target.value)} />
          </div>
          <div className="col-span-2"><p className="text-sm font-medium text-foreground mt-2 mb-1">Emergency Contact</p></div>
          <div className="space-y-1.5">
            <Label>Contact Name</Label>
            <Input value={form.emergency_contact_name || ''} onChange={(e) => update('emergency_contact_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Contact Phone</Label>
            <Input value={form.emergency_contact_phone || ''} onChange={(e) => update('emergency_contact_phone', e.target.value)} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}