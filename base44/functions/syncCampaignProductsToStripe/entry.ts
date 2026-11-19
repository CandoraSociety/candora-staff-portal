import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const STRIPE_API = 'https://api.stripe.com/v1';
const STRIPE_VERSION = '2025-10-29.clover';
const CURRENCY = 'cad';

async function stripeRequest(path, method, params) {
  const headers = {
    Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`,
    'Stripe-Version': STRIPE_VERSION,
  };
  if (params) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  if (method === 'POST') headers['Idempotency-Key'] = crypto.randomUUID();

  const response = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers,
    body: params ? params.toString() : undefined,
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('syncCampaignProductsToStripe: Stripe error', data?.error?.message);
    throw new Error(data?.error?.message || 'Stripe request failed.');
  }
  return data;
}

// Keeps each of a campaign's giving options in step with Stripe: one product
// per option, with a price matching its amount. Runs after the options are
// saved, so staff never have to set anything up in Stripe by hand.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const campaignId = String(body.campaign_id || '').trim();
    if (!campaignId) return Response.json({ error: 'A campaign is required.' }, { status: 400 });

    const campaign = await base44.asServiceRole.entities.DonationCampaign
      .get(campaignId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!campaign) return Response.json({ error: 'Campaign not found.' }, { status: 404 });

    const appId = secrets.get('BASE44_APP_ID');
    const options = campaign.donation_products || [];
    const synced = [];

    for (const option of options) {
      const cents = Math.round(Number(option.amount) * 100);
      if (!option.name || !Number.isFinite(cents) || cents < 100) {
        synced.push(option);
        continue;
      }

      const productParams = new URLSearchParams();
      productParams.set('name', `${campaign.name} — ${option.name}`.slice(0, 120));
      productParams.set('description', option.description || '');
      productParams.set('active', option.is_active === false ? 'false' : 'true');
      productParams.set('metadata[base44_app_id]', appId);
      productParams.set('metadata[campaign_id]', campaign.id);
      productParams.set('metadata[option_id]', option.id);

      let productId = option.stripe_product_id || '';
      if (productId) {
        await stripeRequest(`/products/${productId}`, 'POST', productParams);
      } else {
        const product = await stripeRequest('/products', 'POST', productParams);
        productId = product.id;
      }

      // Each price variation becomes its own price on the same Stripe product.
      const variations = Array.isArray(option.variations) ? option.variations : [];
      const syncedVariations = [];
      for (const variation of variations) {
        const variationCents = Math.round(Number(variation.amount) * 100);
        if (!Number.isFinite(variationCents) || variationCents < 100) {
          syncedVariations.push(variation);
          continue;
        }

        let variationPriceId = variation.stripe_price_id || '';
        const variationMatches = variationPriceId &&
          Math.round(Number(variation.stripe_price_amount) * 100) === variationCents;
        if (!variationMatches) {
          const variationParams = new URLSearchParams();
          variationParams.set('product', productId);
          variationParams.set('currency', CURRENCY);
          variationParams.set('unit_amount', String(variationCents));
          if (variation.label) variationParams.set('nickname', String(variation.label).slice(0, 60));
          variationParams.set('metadata[base44_app_id]', appId);
          variationParams.set('metadata[campaign_id]', campaign.id);
          variationParams.set('metadata[option_id]', option.id);
          variationParams.set('metadata[variation_id]', variation.id);
          const variationPrice = await stripeRequest('/prices', 'POST', variationParams);

          if (variationPriceId) {
            await stripeRequest(`/prices/${variationPriceId}`, 'POST', new URLSearchParams({ active: 'false' }))
              .catch(() => {});
          }
          variationPriceId = variationPrice.id;
        }

        syncedVariations.push({
          ...variation,
          stripe_price_id: variationPriceId,
          stripe_price_amount: Number(variation.amount),
        });
      }

      // An option without variations keeps a single price matching its amount.
      let priceId = option.stripe_price_id || '';
      if (syncedVariations.length === 0) {
        const priceMatches = priceId && Math.round(Number(option.stripe_price_amount) * 100) === cents;
        if (!priceMatches) {
          const priceParams = new URLSearchParams();
          priceParams.set('product', productId);
          priceParams.set('currency', CURRENCY);
          priceParams.set('unit_amount', String(cents));
          priceParams.set('metadata[base44_app_id]', appId);
          priceParams.set('metadata[campaign_id]', campaign.id);
          priceParams.set('metadata[option_id]', option.id);
          const price = await stripeRequest('/prices', 'POST', priceParams);

          if (priceId) {
            await stripeRequest(`/prices/${priceId}`, 'POST', new URLSearchParams({ active: 'false' }))
              .catch(() => {});
          }
          priceId = price.id;
        }
      }

      synced.push({
        ...option,
        stripe_product_id: productId,
        stripe_price_id: priceId,
        stripe_price_amount: Number(option.amount),
        ...(syncedVariations.length ? { variations: syncedVariations } : {}),
      });
    }

    await base44.asServiceRole.entities.DonationCampaign.update(campaignId, { donation_products: synced });

    return Response.json({
      products: synced,
      synced: synced.filter((option) => option.stripe_price_id).length,
    });
  } catch (error) {
    console.error('syncCampaignProductsToStripe failed', error?.message || error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}