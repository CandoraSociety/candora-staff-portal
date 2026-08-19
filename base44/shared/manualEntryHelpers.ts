// Shared helpers for manual-entry backend functions that write ad-hoc values
// into CRT workbook sheets (Invoice Tracker + Deliverables). Kept here so both
// the Invoice Tracker and Deliverables manual-entry functions use the same
// value parsing and recalc logic.

import { DRIVE_ID } from './crtWorkbook.ts';

// Parse a manual-entry input value into a number when it's numeric (stripping
// currency / thousands separators), otherwise return it as a string. Empty
// input becomes an empty string (clears the cell).
export function parseValue(v: any): number | string {
  if (v == null) return '';
  const s = String(v).trim();
  if (s === '') return '';
  const cleaned = s.replace(/[$,]/g, '');
  if (/^-?\d*\.?\d+$/.test(cleaned)) {
    const n = Number(cleaned);
    if (!isNaN(n)) return n;
  }
  return s;
}

// Request a full workbook recalculation so dependent formula columns refresh
// after a manual write. Best-effort — failures (e.g. transient Graph errors)
// are swallowed since the written values themselves are already committed.
export async function recalc(accessToken: string, workbookId: string) {
  try {
    await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbookId}/workbook/application/calculate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ calculationType: 'Full' })
    });
  } catch { /* recalc best-effort */ }
}