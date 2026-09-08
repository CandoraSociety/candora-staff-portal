// 2026 only: the April–July invoice numbers carry resubmission suffixes —
// April 11.3, May 12.2, June 13.3, July 14.3. Applied ALWAYS to these four
// 2026 months (in no other circumstances) so every generated invoice for one
// of these months displays its current resubmission number, regardless of
// what the source (live tracker read or frozen snapshot) holds.
const SUFFIXES_2026 = { '2026-04': 3, '2026-05': 2, '2026-06': 3, '2026-07': 3 };

// Returns the display invoice number for a given billing month.
//   • null/empty source  → null  (InvoiceDocument falls back to "Draft Invoice")
//   • one of the four 2026 months with a whole-number source (legacy cell that
//     never held its resubmission suffix) → normalized, e.g. 11 → "11.3"
//   • otherwise → the number as stored (a fractional source like 13.4 already
//     carries its real resubmission number, so it displays exactly as-is)
export function displayInvoiceNumber(rawNumber, billingMonth, isManual = false) {
  if (rawNumber == null || rawNumber === '') return null;
  // A manually set number is displayed exactly as entered — the resubmission
  // suffix normalization below never overrides a manual value.
  if (isManual) return rawNumber;
  const n = Number(rawNumber);
  if (isNaN(n)) return null;
  const suffix = SUFFIXES_2026[String(billingMonth)];
  if (suffix != null && Number.isInteger(n)) return `${n}.${suffix}`;
  return n;
}