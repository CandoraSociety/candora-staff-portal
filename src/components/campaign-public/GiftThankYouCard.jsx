import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Heart, Clock, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const money = (value, currency = 'cad') => {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: String(currency || 'cad').toUpperCase(),
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
};

const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || '';

// The confirmation itself: only says the gift went through when Stripe reported
// it as paid, and says so plainly when it is still being confirmed.
export default function GiftThankYouCard({ gift, error }) {
  const paid = gift?.paid === true;
  const processing = gift?.processing === true;
  const destination = gift?.campaign_name ? ` to ${gift.campaign_name}` : '';
  const backLink = gift?.campaign_slug ? `/campaign/${gift.campaign_slug}` : '/donate';

  const tone = paid
    ? 'bg-success/10 text-success'
    : processing
      ? 'bg-warning/10 text-warning'
      : 'bg-muted text-muted-foreground';
  const Icon = paid ? CheckCircle2 : processing ? Clock : HelpCircle;

  return (
    <div className="rounded-2xl border bg-card p-8 sm:p-10 text-center space-y-4 max-w-xl mx-auto">
      <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto ${tone}`}>
        <Icon className="w-8 h-8" />
      </div>

      {paid ? (
        <>
          <h1 className="text-2xl font-display font-extrabold">
            {firstName(gift?.donor_name) ? `Thank you, ${firstName(gift.donor_name)}!` : 'Thank you for your gift!'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your gift of{' '}
            <span className="font-semibold text-foreground">{money(gift.amount, gift.currency)}</span>
            {destination} went through and your payment is confirmed.
          </p>
          {gift.frequency === 'monthly' && (
            <p className="text-sm text-muted-foreground">
              Your monthly gift is active — {money(gift.amount, gift.currency)} will be given each month
              until you cancel.
            </p>
          )}
          {Number(gift.fee_amount) > 0 && (
            <p className="text-sm text-muted-foreground">
              You also covered {money(gift.fee_amount, gift.currency)} in card processing fees, so the
              whole gift reaches the campaign.
            </p>
          )}
          {gift.thank_you_message && (
            <p className="text-sm text-foreground/90 rounded-xl bg-muted/60 px-4 py-3">
              {gift.thank_you_message}
            </p>
          )}
          {gift.tax_receipt_note && (
            <p className="text-xs text-muted-foreground">{gift.tax_receipt_note}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Payment confirmed by Stripe. Keep this page or your Stripe receipt for your records.
          </p>
        </>
      ) : processing ? (
        <>
          <h1 className="text-2xl font-display font-extrabold">Your gift is being confirmed</h1>
          <p className="text-sm text-muted-foreground">
            Stripe is still finalising your payment{destination}. We'll record it as soon as the payment
            clears — you don't need to do anything.
          </p>
        </>
      ) : error === 'unverified' ? (
        <>
          <h1 className="text-2xl font-display font-extrabold">We couldn't confirm this gift</h1>
          <p className="text-sm text-muted-foreground">
            If your card was charged, the gift is still safe — please don't give again. Contact us with
            the time of your gift and we'll trace it.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-display font-extrabold">Thank you for supporting our work</h1>
          <p className="text-sm text-muted-foreground">
            If you've just given, your payment confirmation is on its way. Gifts can also be made any
            time on our donation page.
          </p>
        </>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button asChild>
          <Link to="/donate">
            <Heart className="w-4 h-4" /> Give again
          </Link>
        </Button>
        {gift?.campaign_slug && (
          <Button asChild variant="outline">
            <Link to={backLink}>Back to {gift.campaign_name || 'the campaign'}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}