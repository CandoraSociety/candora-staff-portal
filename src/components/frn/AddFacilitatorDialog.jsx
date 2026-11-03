import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const ROLES = [
  { value: 'facilitator', label: 'Facilitator' },
  { value: 'co_facilitator', label: 'Co-facilitator' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'guest_speaker', label: 'Guest speaker' },
  { value: 'other', label: 'Other' },
];

// Adds someone who is not in the staff directory (contractor, volunteer, guest
// speaker) to the list of eligible FRN / PHAC facilitators.
export default function AddFacilitatorDialog({ open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'facilitator', notes: '' });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const record = await base44.entities.FRNFacilitator.create({
        ...form,
        name: form.name.trim(),
        programs: ['frn', 'phac'],
        is_active: true,
      });
      queryClient.invalidateQueries({ queryKey: ['frn-facilitators'] });
      toast({ title: 'Facilitator added' });
      onSaved?.(record);
      setForm({ name: '', email: '', phone: '', role: 'facilitator', notes: '' });
    } catch (err) {
      toast({ title: 'Error adding facilitator', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add eligible facilitator</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => update('role', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} placeholder="Availability, certifications, program experience" />
          </div>
          <p className="text-xs text-muted-foreground">Added facilitators appear in the picker for both FRN and PHAC sessions.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Add Facilitator'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}