// Parse a "YYYY-MM" billing month as a local date (avoids UTC-offset shifting it back a month)
export const parseBillingMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1);
};

// The current billing month ("YYYY-MM") in the org's timezone (Edmonton).
// Uses Intl.formatToParts so the result is correct regardless of the
// browser's local timezone — no fragile Date-string round-tripping.
export const currentBillingMonth = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Edmonton',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  return `${y}-${m}`;
};