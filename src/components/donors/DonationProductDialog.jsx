import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Adds or edits one donation "product" — a giving option on a campaign's public
// page — from the donor portal's products page.
export default function DonationProductDialog({ open, onOpenChange, campaigns, product, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({
      campaign_id: product?.campaign_id || campaigns[0]?.id || '',
      name: product?.name || '',
      description: product?.description || '',
      amount: product?.amount ?? '',
      allow_monthly: product?.allow_monthly !== false,
      is_active: product?.is_active !== false,
    });
  }, [open, product, campaigns]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    if (!form.campaign_id || !form.name?.trim() || !(Number(form.amount) > 0)) return;
    onSave({
      campaign_id: form.campaign_id,
      option: {
        id: product?.id || `tier-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: form.name.trim(),
        description: form.description || '',
        amount: Number(form.amount),
        allow_monthly: !!form.allow_monthly,
        is_active: !!form.is_active,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit donation product' : 'New donation product'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Campaign</Label>
            <Select value={form.campaign_id} onValueChange={(v) => set('campaign_id', v)} disabled={!!product}>
              <SelectTrigger><SelectValue placeholder="Choose a campaign" /></SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid sm:grid-cols-[1fr_130px] gap-3">
            <div>
              <Label>Product name</Label>
              <Input value={form.name || ''} onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Sponsor a lunch" />
            </div>
            <div>
              <Label>Amount (CAD)</Label>
              <Input type="number" min="1" step="1" value={form.amount}
                onChange={(e) => set('amount', e.target.value)} />
            </div>
          </div>

          <div>
            <Label>What this gift makes possible</Label>
            <Textarea rows={3} value={form.description || ''}
              onChange={(e) => set('description', e.target.value)} />
          </div>

          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.allow_monthly}
                onChange={(e) => set('allow_monthly', e.target.checked)} />
              Can repeat monthly
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.is_active}
                onChange={(e) => set('is_active', e.target.checked)} />
              Shows on the page
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!form.name?.trim() || !(Number(form.amount) > 0)}>
            {product ? 'Save product' : 'Add product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}