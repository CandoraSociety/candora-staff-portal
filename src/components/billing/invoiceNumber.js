// One-time, 2026 only: the April–July invoice numbers carry a ".1" suffix
// (April 11.1, May 12.1, June 13.1, July 14.1). Applies ALWAYS to these four
// 2026 months — not just once per package creation — and in no other
// circumstances (no other months, no other years).
const SUFFIX_MONTHS_2026 = new Set(['2026-04', '2026-05', '2026-06', '2026-07']);

// Returns the display invoice number for a given billing month.
//   • null/empty source  → null  (InvoiceDocument falls back to "Draft Invoice")
//   • already carries a fractional suffix (e.g. 11.1 read back from the Invoice
//     Tracker sheet) → returned as-is, so the suffix is never double-applied
//   • one of the four 2026 months (plain integer source) → a string like "11.1"
//   • otherwise → the plain number
export function displayInvoiceNumber(rawNumber, billingMonth) {
  if (rawNumber == null || rawNumber === '') return null;
  const n = Number(rawNumber);
  if (isNaN(n)) return null;
  if (n % 1 !== 0) return String(n);
  if (SUFFIX_MONTHS_2026.has(String(billingMonth))) return `${n}.1`;
  return n;
}