import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, Heart, Loader2, Lock } from 'lucide-react';
import { activeTiers, formatMoneyExact, tierAmountLabel } from '@/lib/donorConstants';
import { feeToCover } from '@/lib/stripeFees';
import { PAYMENTS_READY, startCampaignCheckout } from '@/lib/campaignPayments';
import { DONATION_STORAGE_NOTE } from '@/lib/dataPrivacy';
import CampaignGiftFields from '@/components/campaign-public/CampaignGiftFields';
import { pillarShortLabel } from '@/lib/campaignDisplay';

// The giving box on a campaign's public page. A supporter picks one of the
// campaign's giving options (and a price variation where there are several, or
// names their own amount), chooses whether to repeat it and whether to cover
// the processing fee, then pays by card through the app's payment provider.
export default function CampaignDonate({
  campaign,
  heading = 'Give to this campaign',
  subheading = 'Every gift goes straight to the appeal.',
  returnPath,
  pillarId = '',
  onSelectPillar,
  initialTierId = '',
}) {
  // When a campaign runs pillars, the giving options narrow to the cause the
  // supporter picked — plus the options that belong to the whole campaign.
  const pillars = campaign.enable_pillars
    ? (campaign.pillars || []).filter((pillar) => pillar.is_active !== false)
    : [];
  // A gift to the whole campaign shows the combined options on their own; a gift
  // to one cause shows that cause's options alongside them.
  const allTiers = activeTiers(campaign);
  const ownTiers = pillarId
    ? allTiers.filter((option) => !option.pillar_id || option.pillar_id === pillarId)
    : allTiers.filter((option) => !option.pillar_id);
  const tiers = ownTiers.length ? ownTiers : allTiers;
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
  const [phone, setPhone] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [gift, setGift] = useState({
    isGift: false,
    recipientName: '',
    recipientEmail: '',
    cardThemeId: '',
    cardMessage: '',
    delivery: 'now',
    deliverAt: '',
    deliverTime: '',
    recipientPhone: '',
  });

  // A different cause brings a different set of options — keep the choice valid.
  // An amount chosen on a fundraising card arrives here already selected.
  useEffect(() => {
    setSelectedId((current) => {
      if (initialTierId && tiers.some((option) => option.id === initialTierId)) return initialTierId;
      return current === 'custom' || tiers.some((option) => option.id === current)
        ? current
        : (tiers[0]?.id || 'custom');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pillarId, initialTierId]);

  const tier = tiers.find((option) => option.id === selectedId);
  const variations = (tier?.variations || []).filter((variation) => Number(variation.amount) > 0);
  const activeVariation = variations.find((variation) => variation.id === variationId) || variations[0];

  let amount = 0;
  if (selectedId === 'custom') amount = Number(customAmount);
  else if (tier?.allow_custom_price) amount = Number(customAmount);
  else if (variations.length) amount = Number(activeVariation?.amount) || 0;
  else if (tier) amount = Number(tier.amount);

  // A card is a one-time gesture, so a gift in someone's honour is never monthly.
  const monthlyAllowed = allowMonthly && !gift.isGift && (selectedId === 'custom' || tier?.allow_monthly !== false);
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
    if (gift.isGift) {
      if (!gift.recipientName.trim()) { setError('Who is the gift for?'); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(gift.recipientEmail.trim())) {
        setError('Enter the email address the card should be sent to.');
        return;
      }
      if (gift.delivery === 'later' && (!gift.deliverAt || !gift.deliverTime)) {
        setError('Choose the day and time the card should arrive.');
        return;
      }
      if (gift.delivery === 'later') {
        const arrival = new Date(`${gift.deliverAt}T${gift.deliverTime}`);
        if (Number.isNaN(arrival.getTime()) || arrival.getTime() < Date.now()) {
          setError('Choose a day and time still to come — the card cannot arrive in the past.');
          return;
        }
      }
      const digits = String(gift.recipientPhone || '').replace(/[^\d]/g, '');
      if (digits.length > 0 && digits.length < 10) {
        setError('Enter their full mobile number, including the area code.');
        return;
      }
    }

    // The card and the text go out at the day and time the supporter picked,
    // read in their own time zone.
    const deliverAtIso =
      gift.isGift && gift.delivery === 'later' && gift.deliverAt && gift.deliverTime
        ? new Date(`${gift.deliverAt}T${gift.deliverTime}`).toISOString()
        : '';

    // Their mobile number is what sends the text — nothing extra to tick.
    const recipientPhone = gift.isGift ? gift.recipientPhone.trim() : '';
    const sendText = recipientPhone.replace(/[^\d]/g, '').length >= 10;
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
        donorPhone: phone.trim(),
        anonymous,
        message: message.trim(),
        pillarId,
        isGift: gift.isGift,
        recipientName: gift.isGift ? gift.recipientName.trim() : '',
        recipientEmail: gift.isGift ? gift.recipientEmail.trim() : '',
        cardThemeId: gift.isGift ? gift.cardThemeId : '',
        cardMessage: gift.isGift ? gift.cardMessage.trim() : '',
        deliverAt: deliverAtIso,
        textRecipient: sendText,
        recipientPhone: sendText ? recipientPhone : '',
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

      {pillars.length > 0 && (
        <div className="space-y-2">
          <Label>Select your donation</Label>
          <div className="flex flex-wrap gap-2">
            {pillars.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectPillar?.(option.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  (pillarId || '') === option.id ? 'border-primary bg-primary/10' : 'hover:bg-muted/60'
                }`}
              >
                {pillarShortLabel(option)}
              </button>
            ))}
          </div>
        </div>
      )}

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

      {campaign.enable_gifting && (
        <CampaignGiftFields
          campaign={campaign}
          value={gift}
          onChange={setGift}
          donorName={name}
          pillar={pillars.find((item) => item.id === pillarId) || null}
          donationName={tier ? [tier.name, activeVariation?.label].filter(Boolean).join(' — ') : 'Custom gift'}
          amount={amount}
        />
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
          <Label htmlFor="donor-phone">Mobile (optional)</Label>
          <Input
            id="donor-phone"
            type="tel"
            placeholder="(780) 555-0123"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5"
          />
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

      {checkoutUrl ? (
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-12 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow hover:bg-primary/90 transition-colors"
        >
          <Lock className="w-4 h-4" />
          Continue to secure checkout
        </a>
      ) : (
        <Button className="w-full h-12 font-medium" onClick={submit} disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
          {submitting ? 'Starting checkout…' : `Give ${total > 0 ? formatMoneyExact(total) : ''}`}
        </Button>
      )}

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="w-3.5 h-3.5" />
        Secure card payment · {PAYMENTS_READY ? 'processed by Stripe' : 'card giving being set up'}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{DONATION_STORAGE_NOTE}</p>

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