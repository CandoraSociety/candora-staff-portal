import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DONATION_TYPES, PAYMENT_METHODS, donorName } from '@/lib/donorConstants';
import { recalcDonorTotals } from '@/lib/donorTotals';

const today = () => new Date().toISOString().slice(0, 10);

export default function DonationDialog({ open, onOpenChange, donation, donors = [], campaigns = [], defaultDonorId }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm({
      donor_id: defaultDonorId || '',
      amount: '',
      donation_date: today(),
      donation_type: 'one_time',
      payment_method: 'e_transfer',
      campaign_id: '',
      receipt_issued: false,
      receipt_number: '',
      notes: '',
      ...(donation || {}),
      amount: donation?.amount ?? '',
    });
  }, [open, donation, defaultDonorId]);

  const save = useMutation({
    mutationFn: async (payload) => {
      if (donation?.id) await base44.entities.Donation.update(donation.id, payload);
      else await base44.entities.Donation.create(payload);
      await recalcDonorTotals(payload.donor_id);
      if (donation?.donor_id && donation.donor_id !== payload.donor_id) {
        await recalcDonorTotals(donation.donor_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donations'] });
      qc.invalidateQueries({ queryKey: ['donors'] });
      onOpenChange(false);
    },
    onError: (err) => setError(err?.message || 'Could not save this gift.'),
  });

  const submit = () => {
    if (!form.donor_id) { setError('Choose the donor this gift belongs to.'); return; }
    if (!form.amount || Number(form.amount) <= 0) { setError('Enter a gift amount greater than zero.'); return; }
    const donor = donors.find((d) => d.id === form.donor_id);
    const campaign = campaigns.find((c) => c.id === form.campaign_id);
    save.mutate({
      donor_id: form.donor_id,
      donor_name: donor ? donorName(donor) : form.donor_name || '',
      amount: Number(form.amount),
      donation_date: form.donation_date,
      donation_type: form.donation_type,
      payment_method: form.payment_method,
      campaign_id: form.campaign_id || '',
      campaign_name: campaign?.name || '',
      receipt_issued: !!form.receipt_issued,
      receipt_number: form.receipt_number || '',
      receipt_date: form.receipt_issued ? form.receipt_date || form.donation_date : '',
      in_kind_description: form.in_kind_description || '',
      in_kind_value: form.in_kind_value ? Number(form.in_kind_value) : undefined,
      notes: form.notes || '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{donation ? 'Edit gift' : 'Record a gift'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Donor</Label>
            <Select value={form.donor_id} onValueChange={(v) => setForm({ ...form, donor_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose a donor" /></SelectTrigger>
              <SelectContent>
                {donors.map((d) => <SelectItem key={d.id} value={d.id}>{donorName(d)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Amount (CAD)</Label>
              <Input type="number" min="0" step="0.01" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.donation_date}
                onChange={(e) => setForm({ ...form, donation_date: e.target.value })} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Gift type</Label>
              <Select value={form.donation_type} onValueChange={(v) => setForm({ ...form, donation_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DONATION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment method</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Campaign</Label>
            <Select value={form.campaign_id || 'none'} onValueChange={(v) => setForm({ ...form, campaign_id: v === 'none' ? '' : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No campaign (general giving)</SelectItem>
                {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.receipt_issued}
              onChange={(e) => setForm({ ...form, receipt_issued: e.target.checked })} />
            Tax receipt issued
          </label>
          {form.receipt_issued && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Receipt number</Label>
                <Input value={form.receipt_number || ''} onChange={(e) => setForm({ ...form, receipt_number: e.target.value })} />
              </div>
              <div>
                <Label>Receipt date</Label>
                <Input type="date" value={form.receipt_date || ''} onChange={(e) => setForm({ ...form, receipt_date: e.target.value })} />
              </div>
            </div>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save gift'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}