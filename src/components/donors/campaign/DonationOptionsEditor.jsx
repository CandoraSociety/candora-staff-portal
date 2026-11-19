import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import VariationRows, { cleanVariations } from '@/components/donors/VariationRows';

const blankTier = () => ({
  id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '',
  description: '',
  amount: '',
  allow_monthly: true,
  is_active: true,
  allow_custom_price: false,
  variations: [],
});

// The giving options a campaign offers — each one is a donation "product" the
// supporter picks on the public page, and the amount that goes to checkout.
export default function DonationOptionsEditor({ campaign, onSave, onSynced }) {
  const [tiers, setTiers] = useState([]);
  const [custom, setCustom] = useState(true);
  const [monthly, setMonthly] = useState(true);
  const [feeCoverage, setFeeCoverage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    setTiers(
      (campaign?.donation_products || [])
        .slice()
        .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
        .map((tier) => ({ ...tier, amount: tier.amount ?? '' }))
    );
    setCustom(campaign?.allow_custom_amount !== false);
    setMonthly(campaign?.allow_monthly !== false);
    setFeeCoverage(campaign?.allow_fee_coverage !== false);
  }, [campaign]);

  const set = (index, key, value) =>
    setTiers((prev) => prev.map((tier, i) => (i === index ? { ...tier, [key]: value } : tier)));

  const move = (index, direction) => {
    setTiers((prev) => {
      const next = prev.slice();
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const submit = async () => {
    setSaving(true);
    setSyncError('');
    await onSave({
      allow_custom_amount: custom,
      allow_monthly: monthly,
      allow_fee_coverage: feeCoverage,
      donation_products: tiers
        .filter((tier) => tier.name?.trim() && (
          Number(tier.amount) > 0 ||
          (tier.variations || []).some((variation) => Number(variation.amount) > 0)
        ))
        .map((tier, index) => {
          const variations = cleanVariations(tier.variations);
          return {
            ...tier,
            name: tier.name.trim(),
            description: tier.description || '',
            amount: variations.length ? variations[0].amount : Number(tier.amount),
            allow_monthly: tier.allow_monthly !== false,
            is_active: tier.is_active !== false,
            allow_custom_price: !!tier.allow_custom_price,
            variations,
            display_order: index,
          };
        }),
    });
    setSaving(false);

    // Each saved option is created (or updated) as its own Stripe product.
    setSyncing(true);
    try {
      const response = await base44.functions.invoke('syncCampaignProductsToStripe', {
        campaign_id: campaign.id,
      });
      if (response.data?.error) throw new Error(response.data.error);
      onSynced?.();
    } catch (error) {
      setSyncError(error.response?.data?.error || error.message || 'Could not sync these options with Stripe.');
    }
    setSyncing(false);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div>
          <h2 className="font-display font-bold">Giving options</h2>
          <p className="text-sm text-muted-foreground">
            Each option appears as a gift card on the campaign page and becomes the amount at checkout.
            Saving also creates it as its own product in Stripe, automatically.
          </p>
        </div>

        {tiers.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">
            No options yet — supporters can still give any amount they choose.
          </p>
        )}

        {tiers.map((tier, index) => (
          <Card key={tier.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="grid sm:grid-cols-[1fr_140px] gap-3 flex-1">
                  <div>
                    <Label>Option name</Label>
                    <Input value={tier.name} onChange={(e) => set(index, 'name', e.target.value)}
                      placeholder="e.g. Sponsor a lunch" />
                  </div>
                  {!(tier.variations || []).some((variation) => Number(variation.amount) > 0) && (
                    <div>
                      <Label>Amount (CAD)</Label>
                      <Input type="number" min="0" step="1" value={tier.amount}
                        onChange={(e) => set(index, 'amount', e.target.value)} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 pt-5">
                  <Button variant="ghost" size="icon" onClick={() => move(index, -1)} aria-label="Move up">
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => move(index, 1)} aria-label="Move down">
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="mt-5 text-destructive" aria-label="Remove option"
                  onClick={() => setTiers((prev) => prev.filter((_, i) => i !== index))}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <VariationRows
                variations={tier.variations || []}
                onChange={(next) => set(index, 'variations', next)}
              />
              <div>
                <Label>What this gift makes possible</Label>
                <Textarea rows={2} value={tier.description || ''}
                  onChange={(e) => set(index, 'description', e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-5 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={!!tier.allow_custom_price}
                    onChange={(e) => set(index, 'allow_custom_price', e.target.checked)} />
                  Supporter chooses the amount
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={tier.allow_monthly !== false}
                    onChange={(e) => set(index, 'allow_monthly', e.target.checked)} />
                  Can repeat monthly
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={tier.is_active !== false}
                    onChange={(e) => set(index, 'is_active', e.target.checked)} />
                  Shows on the page
                </label>
                {(tier.stripe_price_id ||
                  (tier.variations || []).some((variation) => variation.stripe_price_id)) && (
                  <Badge variant="outline" className="text-[11px] font-normal text-emerald-700">In Stripe</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={() => setTiers((prev) => [...prev, blankTier()])}>
          <Plus className="w-4 h-4 mr-2" /> Add option
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="font-display font-bold">Other ways to give</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} />
          Let supporters give an amount of their choosing
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={monthly} onChange={(e) => setMonthly(e.target.checked)} />
          Offer a monthly gift
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5" checked={feeCoverage}
            onChange={(e) => setFeeCoverage(e.target.checked)} />
          <span>
            Offer to cover the card processing fee
            <span className="block text-xs text-muted-foreground">
              Supporters can tick a box to add the fee, so the whole gift reaches the campaign.
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {syncError && <p className="text-sm text-destructive">{syncError}</p>}
        {syncing && !syncError && <p className="text-sm text-muted-foreground">Syncing with Stripe…</p>}
        <Button onClick={submit} disabled={saving || syncing}>
          {saving ? 'Saving…' : 'Save giving options'}
        </Button>
      </div>
    </div>
  );
}