import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const EMPTY = {
  child_first_name: '', child_last_name: '', child_date_of_birth: '',
  parent_guardian_name: '', parent_guardian_phone: '', parent_guardian_email: '',
  address: '', city: '', preferred_language: '',
  emergency_contact_name: '', emergency_contact_phone: '',
  first_visit_date: '', notes: '',
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
    if (!form.child_first_name || !form.child_last_name) {
      toast({ title: "Child's first and last name are required", variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (participant?.id) {
        await base44.entities.PHACParticipant.update(participant.id, form);
        toast({ title: 'Family updated' });
      } else {
        if (!form.first_visit_date) update('first_visit_date', new Date().toISOString().split('T')[0]);
        await base44.entities.PHACParticipant.create({ ...form, first_visit_date: form.first_visit_date || new Date().toISOString().split('T')[0] });
        toast({ title: 'Family added' });
      }
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error saving', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{participant ? 'Edit Family' : 'Add Family'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><p className="text-sm font-medium text-foreground mb-1">Child</p></div>
          <div className="space-y-1.5">
            <Label>Child First Name *</Label>
            <Input value={form.child_first_name || ''} onChange={(e) => update('child_first_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Child Last Name *</Label>
            <Input value={form.child_last_name || ''} onChange={(e) => update('child_last_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Child Date of Birth</Label>
            <Input type="date" value={form.child_date_of_birth || ''} onChange={(e) => update('child_date_of_birth', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Preferred Language</Label>
            <Input value={form.preferred_language || ''} onChange={(e) => update('preferred_language', e.target.value)} />
          </div>
          <div className="col-span-2"><p className="text-sm font-medium text-foreground mt-2 mb-1">Parent / Guardian</p></div>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.parent_guardian_name || ''} onChange={(e) => update('parent_guardian_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.parent_guardian_phone || ''} onChange={(e) => update('parent_guardian_phone', e.target.value)} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Email</Label>
            <Input type="email" value={form.parent_guardian_email || ''} onChange={(e) => update('parent_guardian_email', e.target.value)} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Address</Label>
            <Input value={form.address || ''} onChange={(e) => update('address', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input value={form.city || ''} onChange={(e) => update('city', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>First Visit Date</Label>
            <Input type="date" value={form.first_visit_date || ''} onChange={(e) => update('first_visit_date', e.target.value)} />
          </div>
          <div className="col-span-2"><p className="text-sm font-medium text-foreground mt-2 mb-1">Emergency Contact</p></div>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.emergency_contact_name || ''} onChange={(e) => update('emergency_contact_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.emergency_contact_phone || ''} onChange={(e) => update('emergency_contact_phone', e.target.value)} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Notes (allergies, special needs, etc.)</Label>
            <Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} />
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