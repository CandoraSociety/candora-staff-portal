import { base44 } from '@/api/base44Client';

export const PAYMENTS_READY = true;

// Opens Stripe Checkout for a campaign gift. The session, its amount and the
// currency are all created on the server; the browser only carries what the
// supporter chose. The gift itself is recorded by the Stripe webhook once the
// payment is confirmed, never from this page.
export async function startCampaignCheckout(payload) {
  const isFramed = window.self !== window.top;
  let checkoutTab = null;

  // When the giving page sits inside a frame, the checkout has to open as its
  // own top-level tab, so that tab is opened up front in the click handler and
  // filled with a message while the session is being created.
  if (isFramed) {
    checkoutTab = window.open('', '_blank');
    if (!checkoutTab) throw new Error('Allow popups to continue to checkout.');
    try {
      checkoutTab.document.write(
        '<!doctype html><title>Opening secure checkout…</title>' +
          '<body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;' +
          'font-family:system-ui,-apple-system,sans-serif;color:#0f1f6b">' +
          '<p>Opening secure checkout…</p></body>'
      );
      checkoutTab.document.close();
    } catch {
      // The tab still navigates to the checkout below.
    }
    checkoutTab.opener = null;
  }

  try {
    const response = await base44.functions.invoke('campaignCheckout', payload);
    const url = response.data?.url;
    if (!url) throw new Error(response.data?.error || 'Could not start checkout.');
    if (checkoutTab) checkoutTab.location.replace(url);
    else window.location.assign(url);
    return { url, framed: isFramed };
  } catch (error) {
    if (checkoutTab) checkoutTab.close();
    throw error;
  }
}