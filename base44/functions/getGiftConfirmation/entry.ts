import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const STRIPE_API = 'https://api.stripe.com/v1';
const STRIPE_VERSION = '2025-10-29.clover';

// Reads a checkout session back from Stripe after the supporter returns from
// payment, so the thank-you page shows a confirmation that comes from Stripe
// itself rather than from the return address in the browser.
export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = String(body.sessionId || '').trim();

    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
      return Response.json({ error: 'A checkout reference is required.' }, { status: 400 });
    }

    const response = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: {
        Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`,
        'Stripe-Version': STRIPE_VERSION,
      },
      signal: AbortSignal.timeout(15000),
    });
    const session = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('getGiftConfirmation: Stripe error', session?.error?.message);
      return Response.json({ error: 'We could not find that gift.' }, { status: 404 });
    }
    // Base44's own merchant self-test charge is not a customer gift.
    if (session.metadata?.base44_test_checkout === 'true') {
      return Response.json({ error: 'We could not find that gift.' }, { status: 404 });
    }

    const base44 = createClientFromRequest(req);
    const campaignId = String(session.metadata?.campaign_id || '');
    const campaign = campaignId
      ? await base44.asServiceRole.entities.DonationCampaign
          .get(campaignId)
          .catch((e) => (e.status === 404 ? null : Promise.reject(e)))
      : null;

    const giftAmount = Number(session.metadata?.gift_amount);
    const feeAmount = Number(session.metadata?.fee_amount);

    return Response.json({
      paid: session.payment_status === 'paid',
      processing: session.status === 'complete' && session.payment_status !== 'paid',
      session_status: session.status || '',
      amount: Number.isFinite(giftAmount) && giftAmount > 0 ? giftAmount : Number(session.amount_total || 0) / 100,
      fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
      currency: String(session.currency || 'cad').toLowerCase(),
      frequency: session.mode === 'subscription' ? 'monthly' : 'one_time',
      donor_name: session.customer_details?.name || '',
      donor_email: session.customer_details?.email || '',
      campaign_name: campaign?.name || '',
      campaign_slug: campaign?.slug || '',
      thank_you_message: campaign?.thank_you_message || '',
      tax_receipt_note: campaign?.tax_receipt_note || '',
    });
  } catch (error) {
    console.error('getGiftConfirmation failed', error?.message || error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}