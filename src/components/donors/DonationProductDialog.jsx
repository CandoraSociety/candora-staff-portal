import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VariationRows, { cleanVariations } from '@/components/donors/VariationRows';
import { formatMoney } from '@/lib/donorConstants';

// Adds or edits one donation "product" — a giving option on a campaign's public
// page — from the donor portal's products page. A product can carry several
// price variations, and can let the supporter name their own amount.
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
      allow_custom_price: !!product?.allow_custom_price,
      variations: (product?.variations || []).map((variation) => ({
        ...variation,
        amount: variation.amount ?? '',
      })),
    });
  }, [open, product, campaigns]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const variations = cleanVariations(form.variations);
  const hasVariations = variations.length > 0;
  const valid = !!form.campaign_id && !!form.name?.trim() && (hasVariations || Number(form.amount) > 0);

  const submit = () => {
    if (!valid) return;
    onSave({
      campaign_id: form.campaign_id,
      option: {
        id: product?.id || `tier-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: form.name.trim(),
        description: form.description || '',
        amount: hasVariations ? variations[0].amount : Number(form.amount),
        allow_monthly: !!form.allow_monthly,
        is_active: !!form.is_active,
        allow_custom_price: !!form.allow_custom_price,
        variations,
        stripe_product_id: product?.stripe_product_id || '',
        stripe_price_id: product?.stripe_price_id || '',
        stripe_price_amount: product?.stripe_price_amount ?? null,
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
            {!hasVariations && (
              <div>
                <Label>Amount (CAD)</Label>
                <Input type="number" min="1" step="1" value={form.amount}
                  onChange={(e) => set('amount', e.target.value)} />
              </div>
            )}
          </div>

          {hasVariations && (
            <p className="text-xs text-muted-foreground">
              Supporters choose between these prices: {variations.map((v) => formatMoney(v.amount)).join(' · ')}
            </p>
          )}

          <VariationRows
            variations={form.variations || []}
            onChange={(next) => set('variations', next)}
          />

          <div>
            <Label>What this gift makes possible</Label>
            <Textarea rows={3} value={form.description || ''}
              onChange={(e) => set('description', e.target.value)} />
          </div>

          <div className="space-y-2 text-sm">
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-0.5" checked={!!form.allow_custom_price}
                onChange={(e) => set('allow_custom_price', e.target.checked)} />
              <span>
                Let the supporter choose the amount
                <span className="block text-xs text-muted-foreground">
                  The amount above is the starting amount they can change.
                </span>
              </span>
            </label>
            <div className="flex flex-wrap gap-5">
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
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!valid}>
            {product ? 'Save product' : 'Add product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}