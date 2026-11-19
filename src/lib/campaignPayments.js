import { base44 } from '@/api/base44Client';

export const PAYMENTS_READY = true;

// Creates the Stripe Checkout session for a campaign gift. The session, its
// amount and the currency are all resolved on the server; the browser only
// carries what the supporter chose. The gift itself is recorded by the Stripe
// webhook once the payment is confirmed, never from this page.
export async function startCampaignCheckout(payload) {
  const response = await base44.functions.invoke('campaignCheckout', payload);
  const url = response.data?.url;
  if (!url) throw new Error(response.data?.error || 'Could not start checkout.');

  // Stripe Checkout has to be a top-level page. When the giving page is already
  // top-level we go straight there; inside a frame (the builder preview) the
  // checkout is opened by the supporter's own click on the link we hand back,
  // which every browser and sandbox allows.
  const framed = window.self !== window.top;
  if (!framed) window.location.assign(url);

  return { url, framed };
}