import { base44 } from '@/api/base44Client';

export const PAYMENTS_READY = true;

// Opens Stripe Checkout for a campaign gift. The session, its amount and the
// currency are all created on the server; the browser only carries what the
// supporter chose. The gift itself is recorded by the Stripe webhook once the
// payment is confirmed, never from this page.
export async function startCampaignCheckout(payload) {
  const isFramed = window.self !== window.top;
  const checkoutTab = isFramed ? window.open('', '_blank') : null;
  if (isFramed && !checkoutTab) throw new Error('Allow popups to continue to checkout.');
  if (checkoutTab) checkoutTab.opener = null;

  try {
    const response = await base44.functions.invoke('campaignCheckout', payload);
    const url = response.data?.url;
    if (!url) throw new Error(response.data?.error || 'Could not start checkout.');
    if (checkoutTab) checkoutTab.location.replace(url);
    else window.location.assign(url);
    return { url };
  } catch (error) {
    checkoutTab?.close();
    throw error;
  }
}