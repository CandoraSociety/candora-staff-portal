import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GIVING_LEVELS, DONOR_TYPES } from '@/lib/donorConstants';

const EMPTY = {
  first_name: '', last_name: '', organization: '', donor_type: 'individual',
  email: '', phone: '', address: '', city: '', province: '', postal_code: '',
  giving_level: 'prospect', preferred_communication: 'email',
  receipt_preference: 'email', do_not_contact: false, notes: '',
};

export default function DonorDialog({ open, onOpenChange, donor }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...(donor || {}) });
      setError('');
    }
  }, [open, donor]);

  const save = useMutation({
    mutationFn: (data) => donor?.id
      ? base44.entities.Donor.update(donor.id, data)
      : base44.entities.Donor.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donors'] });
      onOpenChange(false);
    },
    onError: (err) => setError(err?.message || 'Could not save this donor.'),
  });

  const submit = () => {
    if (!form.last_name?.trim() && !form.organization?.trim()) {
      setError('Add a last name or an organization name.');
      return;
    }
    save.mutate({ ...form, first_name: form.first_name?.trim(), last_name: form.last_name?.trim() });
  };

  const field = (key, label, props = {}) => (
    <div>
      <Label>{label}</Label>
      <Input value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} {...props} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{donor ? 'Edit donor' : 'Add donor'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {field('first_name', 'First name')}
            {field('last_name', 'Last name')}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {field('organization', 'Organization')}
            <div>
              <Label>Donor type</Label>
              <Select value={form.donor_type} onValueChange={(v) => setForm({ ...form, donor_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DONOR_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {field('email', 'Email', { type: 'email' })}
            {field('phone', 'Phone')}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {field('address', 'Address')}
            {field('city', 'City')}
            {field('province', 'Province')}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {field('postal_code', 'Postal code')}
            <div>
              <Label>Giving level</Label>
              <Select value={form.giving_level} onValueChange={(v) => setForm({ ...form, giving_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(GIVING_LEVELS).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>{meta.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Receipts</Label>
              <Select value={form.receipt_preference} onValueChange={(v) => setForm({ ...form, receipt_preference: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="mail">Mail</SelectItem>
                  <SelectItem value="none">No receipts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.do_not_contact}
              onChange={(e) => setForm({ ...form, do_not_contact: e.target.checked })}
            />
            Do not contact this donor
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save donor'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}