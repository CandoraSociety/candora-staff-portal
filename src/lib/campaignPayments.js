// Online giving on a campaign page is processed by the app's payment provider.
// The checkout step is wired to Stripe once payments are connected to the app;
// until then the donate panel tells the supporter that card giving is being
// set up, so no unpaid gift is ever recorded.
export const PAYMENTS_READY = false;

export async function startCampaignCheckout() {
  return { notReady: true };
}