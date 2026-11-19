import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, Heart, Loader2, Lock } from 'lucide-react';
import { activeTiers, formatMoneyExact, tierAmountLabel } from '@/lib/donorConstants';
import { feeToCover } from '@/lib/stripeFees';
import { PAYMENTS_READY, startCampaignCheckout } from '@/lib/campaignPayments';

// The giving box on a campaign's public page. A supporter picks one of the
// campaign's giving options (and a price variation where there are several, or
// names their own amount), chooses whether to repeat it and whether to cover
// the processing fee, then pays by card through the app's payment provider.
export default function CampaignDonate({
  campaign,
  heading = 'Give to this campaign',
  subheading = 'Every gift goes straight to the appeal.',
  returnPath,
}) {
  const tiers = activeTiers(campaign);
  const allowCustom = campaign.allow_custom_amount !== false;
  const allowMonthly = campaign.allow_monthly !== false;
  const offerFeeCover = campaign.allow_fee_coverage !== false;

  const [selectedId, setSelectedId] = useState(tiers[0]?.id || 'custom');
  const [variationId, setVariationId] = useState('');
  const [customAmount, setCustomAmount] = useState(
    tiers[0]?.allow_custom_price ? String(tiers[0].amount ?? '') : ''
  );
  const [coverFee, setCoverFee] = useState(false);
  const [frequency, setFrequency] = useState('one_time');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');

  const tier = tiers.find((option) => option.id === selectedId);
  const variations = (tier?.variations || []).filter((variation) => Number(variation.amount) > 0);
  const activeVariation = variations.find((variation) => variation.id === variationId) || variations[0];

  let amount = 0;
  if (selectedId === 'custom') amount = Number(customAmount);
  else if (tier?.allow_custom_price) amount = Number(customAmount);
  else if (variations.length) amount = Number(activeVariation?.amount) || 0;
  else if (tier) amount = Number(tier.amount);

  const monthlyAllowed = allowMonthly && (selectedId === 'custom' || tier?.allow_monthly !== false);
  const monthly = monthlyAllowed && frequency === 'monthly';
  const fee = amount > 0 ? feeToCover(amount) : 0;
  const total = amount > 0 ? amount + (coverFee ? fee : 0) : 0;

  const selectTier = (option) => {
    setSelectedId(option.id);
    const optionVariations = (option.variations || []).filter((variation) => Number(variation.amount) > 0);
    setVariationId(optionVariations[0]?.id || '');
    if (option.allow_custom_price) setCustomAmount(String(option.amount ?? ''));
  };

  const submit = async () => {
    setError('');
    if (!amount || amount <= 0) { setError('Choose or enter a gift amount.'); return; }
    if (!name.trim()) { setError('Please tell us your name.'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return; }

    const variationLabel = activeVariation?.label || '';
    const productName = tier
      ? (variationLabel ? `${tier.name} — ${variationLabel}` : tier.name)
      : 'Custom gift';

    setError('');
    setCheckoutUrl('');
    setSubmitting(true);
    try {
      const { url } = await startCampaignCheckout({
        slug: campaign.slug,
        campaignId: campaign.id,
        campaignName: campaign.name,
        productId: tier?.id || '',
        variationId: variations.length ? (activeVariation?.id || '') : '',
        productName,
        amount,
        coverFees: coverFee,
        frequency: monthly ? 'monthly' : 'one_time',
        donorName: name.trim(),
        donorEmail: email.trim(),
        anonymous,
        message: message.trim(),
        returnPath,
      });
      setCheckoutUrl(url);
    } catch (err) {
      setError(
        err?.response?.data?.error || err?.message || 'Could not start checkout. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card shadow-lg p-5 sm:p-6 space-y-5">
      <div>
        <h2 className="font-display font-bold text-lg">{heading}</h2>
        <p className="text-sm text-muted-foreground">{subheading}</p>
      </div>

      {tiers.length > 0 && (
        <div className="space-y-2">
          {tiers.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => selectTier(option)}
              className={`w-full text-left rounded-xl border p-3 transition-colors ${
                selectedId === option.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{option.name}</span>
                <span className="font-display font-bold">{tierAmountLabel(option)}</span>
              </div>
              {option.description && (
                <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {tier && variations.length > 0 && (
        <div className="space-y-2">
          <Label>Choose an amount</Label>
          <div className="grid sm:grid-cols-2 gap-2">
            {variations.map((variation) => (
              <button
                key={variation.id}
                type="button"
                onClick={() => setVariationId(variation.id)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  activeVariation?.id === variation.id ? 'border-primary bg-primary/10' : 'hover:bg-muted/60'
                }`}
              >
                <span className="block font-medium">{variation.label}</span>
                <span className="text-xs text-muted-foreground">{formatMoneyExact(variation.amount)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tier?.allow_custom_price && (
        <div>
          <Label htmlFor="product-amount">Your amount</Label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              id="product-amount"
              type="number"
              min="1"
              step="1"
              className="pl-7"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
          </div>
        </div>
      )}

      {allowCustom && !tier?.allow_custom_price && (
        <div>
          <Label htmlFor="custom-amount">Or give your own amount</Label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              id="custom-amount"
              type="number"
              min="1"
              step="1"
              className="pl-7"
              placeholder="Any amount"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedId('custom'); }}
              onFocus={() => setSelectedId('custom')}
            />
          </div>
        </div>
      )}

      {monthlyAllowed && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'one_time', label: 'One-time' },
            { value: 'monthly', label: 'Monthly' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFrequency(option.value)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                frequency === option.value ? 'border-primary bg-primary/10' : 'hover:bg-muted/60'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {offerFeeCover && fee > 0 && (
        <label className="flex items-start gap-2 rounded-lg border p-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={coverFee}
            onChange={(e) => setCoverFee(e.target.checked)}
          />
          <span>
            Add {formatMoneyExact(fee)} to cover the processing fee
            <span className="block text-xs text-muted-foreground">
              So 100% of your gift reaches the campaign{monthly ? ' — added to every monthly gift' : ''}.
            </span>
          </span>
        </label>
      )}

      <div className="space-y-3">
        <div>
          <Label htmlFor="donor-name">Your name</Label>
          <Input id="donor-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="donor-email">Email for your receipt</Label>
          <Input id="donor-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="donor-message">Leave a message (optional)</Label>
          <Textarea id="donor-message" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1.5" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          Give anonymously
        </label>
      </div>

      <div className="rounded-lg bg-muted/60 px-3 py-2 space-y-1 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{monthly ? 'Monthly gift' : 'One-time gift'}</span>
          <span>{amount > 0 ? formatMoneyExact(amount) : '—'}</span>
        </div>
        {coverFee && fee > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Processing fee you're covering</span>
            <span>{formatMoneyExact(fee)}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t pt-1 font-display font-bold text-base">
          <span>Total {monthly ? 'each month' : 'today'}</span>
          <span>{total > 0 ? formatMoneyExact(total) : '—'}</span>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button className="w-full h-12 font-medium" onClick={submit} disabled={submitting}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
        {submitting ? 'Starting checkout…' : `Give ${total > 0 ? formatMoneyExact(total) : ''}`}
      </Button>

      {checkoutUrl && (
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-11 rounded-md border border-primary/40 bg-primary/5 text-sm font-medium text-foreground hover:bg-primary/10 transition-colors"
        >
          <Lock className="w-4 h-4" />
          Checkout didn't open? Continue securely
        </a>
      )}

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="w-3.5 h-3.5" />
        Secure card payment · {PAYMENTS_READY ? 'processed by Stripe' : 'card giving being set up'}
      </div>

      {campaign.tax_receipt_note && (
        <p className="text-xs text-muted-foreground border-t pt-3">{campaign.tax_receipt_note}</p>
      )}

      {campaign.thank_you_message && (
        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
          <Check className="w-3.5 h-3.5 mt-0.5 text-success shrink-0" />
          {campaign.thank_you_message}
        </p>
      )}
    </div>
  );
}