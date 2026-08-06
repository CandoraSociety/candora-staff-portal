// Parse a "YYYY-MM" billing month as a local date (avoids UTC-offset shifting it back a month)
export const parseBillingMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1);
};