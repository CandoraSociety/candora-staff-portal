import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const STRIPE_API = 'https://api.stripe.com/v1';
const STRIPE_VERSION = '2025-10-29.clover';
const CURRENCY = 'cad';
const MIN_CENTS = 100;
const MAX_CENTS = 5000000;
// Card processing fee, used to gross up a gift the supporter offered to cover.
const FEE_RATE = 0.029;
const FEE_FIXED_CENTS = 30;

const isEmail = (value) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

// Starts a gift on a campaign's public page. The supporter is a guest, so the
// amount is always resolved here from the campaign's own giving options — never
// from the browser — and the payment is opened as a Stripe Checkout session.
// Nothing is recorded as a gift until the webhook confirms the money arrived.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug || '').trim().toLowerCase();
    const campaignId = String(body.campaignId || '').trim();

    if (!slug && !campaignId) {
      return Response.json({ error: 'A campaign is required.' }, { status: 400 });
    }

    let campaign = null;
    if (campaignId) {
      campaign = await base44.asServiceRole.entities.DonationCampaign
        .get(campaignId)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    } else {
      const { items } = await base44.asServiceRole.entities.DonationCampaign.filter({ slug }, { limit: 1 });
      campaign = (items || [])[0] || null;
    }

    if (!campaign || !campaign.public_page_enabled || campaign.is_active === false) {
      return Response.json({ error: 'This campaign is not accepting gifts.' }, { status: 404 });
    }

    const tiers = (campaign.donation_products || []).filter(
      (tier) => tier.is_active !== false && Number(tier.amount) > 0
    );
    const tier = tiers.find((option) => option.id === String(body.productId || ''));

    let cents;
    let productId = '';
    let productName = 'Custom gift';
    let monthlyAllowed = campaign.allow_monthly !== false;
    let variationId = '';
    let variationLabel = '';

    if (tier) {
      const variations = (tier.variations || []).filter((option) => Number(option.amount) > 0);
      const variation = variations.find((option) => option.id === String(body.variationId || ''));

      if (variation) {
        cents = Math.round(Number(variation.amount) * 100);
        variationId = variation.id;
        variationLabel = variation.label || '';
      } else if (tier.allow_custom_price) {
        // The supporter names the amount; the option's own amount is the starting point.
        cents = Math.round(Number(body.amount) * 100);
      } else if (variations.length) {
        return Response.json({ error: 'Choose one of the gift amounts.' }, { status: 400 });
      } else {
        cents = Math.round(Number(tier.amount) * 100);
      }

      productId = tier.id;
      productName = variationLabel
        ? `${tier.name || 'Campaign gift'} — ${variationLabel}`
        : (tier.name || 'Campaign gift');
      monthlyAllowed = monthlyAllowed && tier.allow_monthly !== false;
    } else {
      if (campaign.allow_custom_amount === false) {
        return Response.json({ error: 'Choose one of the giving options.' }, { status: 400 });
      }
      cents = Math.round(Number(body.amount) * 100);
    }

    if (!Number.isFinite(cents) || cents < MIN_CENTS || cents > MAX_CENTS) {
      return Response.json({ error: 'Enter a gift between $1 and $50,000.' }, { status: 400 });
    }

    // A supporter may cover the card fee so the campaign nets the whole gift.
    const coverFees = body.coverFees === true && campaign.allow_fee_coverage !== false;
    const feeCents = coverFees
      ? Math.max(0, Math.ceil((cents + FEE_FIXED_CENTS) / (1 - FEE_RATE)) - cents)
      : 0;
    const totalCents = cents + feeCents;

    const frequency = String(body.frequency || 'one_time') === 'monthly' && monthlyAllowed
      ? 'monthly'
      : 'one_time';
    const donorName = String(body.donorName || '').trim().slice(0, 120);
    const donorEmail = String(body.donorEmail || '').trim().toLowerCase().slice(0, 200);
    const message = String(body.message || '').trim().slice(0, 500);

    if (!donorName) return Response.json({ error: 'Please tell us your name.' }, { status: 400 });
    if (!isEmail(donorEmail)) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const appUrl = String(req.headers.get('X-Base44-App-Url') || '').replace(/\/+$/, '');
    if (!appUrl) {
      console.error('campaignCheckout: missing X-Base44-App-Url header');
      return Response.json({ error: 'Checkout is unavailable right now.' }, { status: 500 });
    }

    const appId = secrets.get('BASE44_APP_ID');
    const amount = cents / 100;
    // Only the app's own giving pages may be returned to after checkout.
    const pagePath = String(body.returnPath || '') === '/donate'
      ? '/donate'
      : `/campaign/${campaign.slug || ''}`;

    const intent = await base44.asServiceRole.entities.CampaignDonationIntent.create({
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      campaign_slug: campaign.slug || '',
      amount,
      fee_amount: feeCents / 100,
      charge_amount: totalCents / 100,
      currency: CURRENCY,
      product_id: productId,
      product_name: productName,
      variation_id: variationId,
      variation_label: variationLabel,
      frequency,
      donor_name: donorName,
      donor_email: donorEmail,
      gift_message: message,
      is_anonymous: !!body.anonymous,
      status: 'pending',
    });

    const params = new URLSearchParams();
    params.set('mode', frequency === 'monthly' ? 'subscription' : 'payment');
    params.set('success_url', `${appUrl}${pagePath}?gift=success&session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${appUrl}${pagePath}?gift=cancelled`);
    params.set('customer_email', donorEmail);
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', CURRENCY);
    params.set('line_items[0][price_data][unit_amount]', String(cents));
    params.set('line_items[0][price_data][product_data][name]', `${campaign.name} — ${productName}`.slice(0, 120));
    if (feeCents > 0) {
      params.set('line_items[1][quantity]', '1');
      params.set('line_items[1][price_data][currency]', CURRENCY);
      params.set('line_items[1][price_data][unit_amount]', String(feeCents));
      params.set('line_items[1][price_data][product_data][name]', 'Processing fee (covered by supporter)');
    }
    if (frequency === 'monthly') {
      params.set('line_items[0][price_data][recurring][interval]', 'month');
      if (feeCents > 0) params.set('line_items[1][price_data][recurring][interval]', 'month');
    }
    params.set('metadata[base44_app_id]', appId);
    params.set('metadata[intent_id]', intent.id);
    params.set('metadata[campaign_id]', campaign.id);
    params.set('metadata[gift_amount]', String(amount));
    params.set('metadata[fee_amount]', String(feeCents / 100));
    if (variationId) params.set('metadata[variation_id]', variationId);
    if (tier?.stripe_product_id) params.set('metadata[stripe_product_id]', tier.stripe_product_id);
    if (frequency === 'monthly') {
      if (tier?.stripe_product_id) params.set('subscription_data[metadata][stripe_product_id]', tier.stripe_product_id);
      params.set('subscription_data[metadata][base44_app_id]', appId);
      params.set('subscription_data[metadata][intent_id]', intent.id);
      params.set('subscription_data[metadata][campaign_id]', campaign.id);
    }

    const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`,
        'Stripe-Version': STRIPE_VERSION,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: params.toString(),
      signal: AbortSignal.timeout(15000),
    });

    const session = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('campaignCheckout: Stripe error', session?.error?.message);
      await base44.asServiceRole.entities.CampaignDonationIntent
        .update(intent.id, { status: 'expired' })
        .catch(() => {});
      return Response.json(
        { error: session?.error?.message || 'Could not start checkout.' },
        { status: 502 }
      );
    }

    await base44.asServiceRole.entities.CampaignDonationIntent.update(intent.id, {
      session_id: session.id,
      subscription_id: session.subscription || '',
    });

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('campaignCheckout failed', error?.message || error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}