// Card processing fees for online gifts. A supporter may cover the fee so the
// whole gift reaches the campaign; the amount is grossed up so that, after the
// fee, the campaign still receives the gift they chose.
export const STRIPE_FEE_RATE = 0.029;
export const STRIPE_FEE_FIXED_CENTS = 30;

// The extra a supporter adds so the campaign nets exactly `amount`.
export function feeToCover(amount) {
  const giftCents = Math.round(Number(amount) * 100);
  if (!Number.isFinite(giftCents) || giftCents <= 0) return 0;
  const totalCents = Math.ceil((giftCents + STRIPE_FEE_FIXED_CENTS) / (1 - STRIPE_FEE_RATE));
  return (totalCents - giftCents) / 100;
}