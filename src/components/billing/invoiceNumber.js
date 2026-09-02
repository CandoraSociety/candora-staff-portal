// 2026 only: the April–July invoice numbers carry resubmission suffixes —
// April 11.3, May 12.2, June 13.3, July 14.3. Applied ALWAYS to these four
// 2026 months (in no other circumstances) so every generated invoice for one
// of these months displays its current resubmission number, regardless of
// what the source (live tracker read or frozen snapshot) holds.
const SUFFIXES_2026 = { '2026-04': 3, '2026-05': 2, '2026-06': 3, '2026-07': 3 };

// Returns the display invoice number for a given billing month.
//   • null/empty source  → null  (InvoiceDocument falls back to "Draft Invoice")
//   • one of the four 2026 months → normalized to its current resubmission
//     number, e.g. source 11 / 11.1 / 11.2 for April → "11.3"
//   • otherwise → the plain number (fractional sources returned as-is)
export function displayInvoiceNumber(rawNumber, billingMonth) {
  if (rawNumber == null || rawNumber === '') return null;
  const n = Number(rawNumber);
  if (isNaN(n)) return null;
  const suffix = SUFFIXES_2026[String(billingMonth)];
  if (suffix != null) return `${Math.floor(n)}.${suffix}`;
  return n;
}