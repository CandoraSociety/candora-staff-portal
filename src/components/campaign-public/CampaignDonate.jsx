import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Check, Heart, Loader2, Lock } from 'lucide-react';
import { activeTiers, formatMoneyExact } from '@/lib/donorConstants';
import { PAYMENTS_READY, startCampaignCheckout } from '@/lib/campaignPayments';

// The giving box on a campaign's public page. A supporter picks one of the
// campaign's giving options (or an amount of their own), chooses whether to
// repeat it, and pays by card through the app's payment provider.
export default function CampaignDonate({ campaign }) {
  const tiers = activeTiers(campaign);
  const allowCustom = campaign.allow_custom_amount !== false;
  const allowMonthly = campaign.allow_monthly !== false;

  const [selectedId, setSelectedId] = useState(tiers[0]?.id || 'custom');
  const [customAmount, setCustomAmount] = useState('');
  const [frequency, setFrequency] = useState('one_time');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const tier = tiers.find((t) => t.id === selectedId);
  const amount = selectedId === 'custom' ? Number(customAmount) : Number(tier?.amount);
  const monthlyAllowed = allowMonthly && (selectedId === 'custom' || tier?.allow_monthly !== false);

  const submit = async () => {
    setError('');
    if (!amount || amount <= 0) { setError('Choose or enter a gift amount.'); return; }
    if (!name.trim()) { setError('Please tell us your name.'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return; }

    setSubmitting(true);
    try {
      await startCampaignCheckout({
        slug: campaign.slug,
        campaignId: campaign.id,
        campaignName: campaign.name,
        productId: tier?.id || '',
        productName: tier?.name || 'Custom gift',
        amount,
        frequency: monthlyAllowed ? frequency : 'one_time',
        donorName: name.trim(),
        donorEmail: email.trim(),
        anonymous,
        message: message.trim(),
      });
    } catch (err) {
      setError(
        err?.response?.data?.error || err?.message || 'Could not start checkout. Please try again.'
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card shadow-lg p-5 sm:p-6 space-y-5">
      <div>
        <h2 className="font-display font-bold text-lg">Give to this campaign</h2>
        <p className="text-sm text-muted-foreground">Every gift goes straight to the appeal.</p>
      </div>

      {tiers.length > 0 && (
        <div className="space-y-2">
          {tiers.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedId(option.id)}
              className={`w-full text-left rounded-xl border p-3 transition-colors ${
                selectedId === option.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{option.name}</span>
                <span className="font-display font-bold">{formatMoneyExact(option.amount)}</span>
              </div>
              {option.description && (
                <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {allowCustom && (
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

      <div className="rounded-lg bg-muted/60 px-3 py-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{frequency === 'monthly' ? 'Monthly gift' : 'One-time gift'}</span>
        <span className="font-display font-bold text-base">
          {amount > 0 ? formatMoneyExact(amount) : '—'}{frequency === 'monthly' ? ' / month' : ''}
        </span>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button className="w-full h-12 font-medium" onClick={submit} disabled={submitting}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
        {submitting ? 'Starting checkout…' : `Give ${amount > 0 ? formatMoneyExact(amount) : ''}`}
      </Button>

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