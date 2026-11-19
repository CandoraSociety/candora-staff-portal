import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import Stripe from 'npm:stripe@17.4.0';
import { recordCampaignGift } from '../../shared/campaignGifts.ts';

const intentFor = (base44, id) =>
  base44.asServiceRole.entities.CampaignDonationIntent
    .get(id)
    .catch((e) => (e.status === 404 ? null : Promise.reject(e)));

// Stripe webhook for online campaign gifts. A gift is written only here, from a
// signature-verified event whose payment status is paid and whose amount and
// currency match what the checkout recorded. Monthly gifts are matched again on
// each renewal invoice.
export default async function (req) {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) return Response.json({ error: 'Missing signature' }, { status: 400 });

    const raw = await req.text();
    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'), { apiVersion: '2025-10-29.clover' });

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        raw,
        signature,
        secrets.get('STRIPE_WEBHOOK_SECRET'),
        undefined,
        Stripe.createSubtleCryptoProvider()
      );
    } catch (error) {
      console.error('stripeCampaignWebhook: signature check failed', error?.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const appId = secrets.get('BASE44_APP_ID');

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object;

      // Base44's own merchant self-test charge is not a customer gift.
      if (session.metadata?.base44_test_checkout === 'true') {
        return Response.json({ received: true });
      }
      if (session.payment_status !== 'paid') {
        return Response.json({ received: true });
      }

      const intentId = session.metadata?.intent_id;
      if (!intentId) return Response.json({ received: true });

      const intent = await intentFor(base44, intentId);
      if (!intent || intent.donation_id) return Response.json({ received: true });

      // The charge may include a processing fee the supporter chose to cover.
      const expected = Math.round(Number(intent.charge_amount ?? intent.amount) * 100);
      const paid = Number(session.amount_total);
      if (!Number.isFinite(paid) || paid !== expected) {
        console.error('stripeCampaignWebhook: amount mismatch', intent.id, paid, expected);
        return Response.json({ received: true });
      }
      if (String(session.currency || '').toLowerCase() !== String(intent.currency || 'cad').toLowerCase()) {
        console.error('stripeCampaignWebhook: currency mismatch', intent.id, session.currency);
        return Response.json({ received: true });
      }

      const donation = await recordCampaignGift(base44, {
        campaignId: intent.campaign_id,
        campaignName: intent.campaign_name,
        productName: intent.product_name,
        amount: Number(intent.amount) || paid / 100,
        feeAmount: Number(intent.fee_amount) || 0,
        frequency: intent.frequency,
        donorName: intent.donor_name,
        donorEmail: intent.donor_email,
        message: intent.gift_message,
        anonymous: intent.is_anonymous,
        reference: session.payment_intent || session.id,
      });

      await base44.asServiceRole.entities.CampaignDonationIntent.update(intent.id, {
        status: 'paid',
        paid_at: new Date().toISOString(),
        donation_id: donation.id,
        session_id: session.id,
        subscription_id: session.subscription || intent.subscription_id || '',
        payment_reference: session.payment_intent || '',
      });

      return Response.json({ received: true });
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;

      // The first invoice is paid at checkout and already recorded there.
      if (invoice.billing_reason !== 'subscription_cycle') {
        return Response.json({ received: true });
      }

      let meta = invoice.subscription_details?.metadata || {};
      if (!meta.intent_id && invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(String(invoice.subscription));
        meta = subscription.metadata || {};
      }
      if (meta.base44_app_id && appId && meta.base44_app_id !== appId) {
        return Response.json({ received: true });
      }
      if (!meta.intent_id || !(invoice.amount_paid > 0)) {
        return Response.json({ received: true });
      }

      const reference = invoice.payment_intent || invoice.id;
      const { items } = await base44.asServiceRole.entities.Donation.filter(
        { payment_reference: reference },
        { limit: 1 }
      );
      if (items && items.length) return Response.json({ received: true });

      const intent = await intentFor(base44, meta.intent_id);
      if (!intent) return Response.json({ received: true });

      await recordCampaignGift(base44, {
        campaignId: intent.campaign_id,
        campaignName: intent.campaign_name,
        productName: intent.product_name,
        amount: Number(intent.amount) || invoice.amount_paid / 100,
        feeAmount: Number(intent.fee_amount) || 0,
        frequency: 'monthly',
        donorName: intent.donor_name,
        donorEmail: intent.donor_email,
        message: intent.gift_message,
        anonymous: intent.is_anonymous,
        reference,
      });

      return Response.json({ received: true });
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      const intentId = session.metadata?.intent_id;
      if (intentId) {
        const intent = await intentFor(base44, intentId);
        if (intent && intent.status === 'pending') {
          await base44.asServiceRole.entities.CampaignDonationIntent.update(intent.id, { status: 'expired' });
        }
      }
      return Response.json({ received: true });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeCampaignWebhook failed', error?.message || error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}