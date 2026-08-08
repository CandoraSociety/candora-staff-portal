// Shared helpers for the "Invoice Tracker" sheet that lives inside the active
// CRT workbook. Each automation (childminding now, others later) writes a
// per-month dollar value into a fixed column for the row whose month label
// matches that billing month. Mirrors the month-bound philosophy of the CRT
// client-data sync: a given month's row only ever holds that month's total.

import { DRIVE_ID } from './crtWorkbook.ts';

const MONTH_ABBR = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const MONTH_FULL = ['january','february','march','april','may','june','july','august','september','october','november','december'];

// Convert any month-label cell value to a { year, month0 } key, or null.
// Handles Excel serials, ISO dates, and text forms like "Apr-26", "Apr 26",
// "April 2026", "Apr-2026", "April-26".
export function cellToMonthKey(val) {
  if (val == null || val === '') return null;
  if (typeof val === 'number' && val > 30000 && val < 80000) {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    return null;
  }
  const s = String(val).trim();
  if (!s) return null;
  const iso = s.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?/);
  if (iso) return { year: parseInt(iso[1], 10), month: parseInt(iso[2], 10) - 1 };
  const m = s.match(/^([A-Za-z]{3,9})[\s\-\/]+(\d{2,4})$/);
  if (m) {
    const abbr = MONTH_ABBR.indexOf(m[1].slice(0, 3).toLowerCase());
    const full = MONTH_FULL.indexOf(m[1].toLowerCase());
    const mon = abbr >= 0 ? abbr : full;
    if (mon < 0) return null;
    let yr = parseInt(m[2], 10);
    if (yr < 100) yr += 2000;
    return { year: yr, month: mon };
  }
  return null;
}

// "YYYY-MM" -> { year, month0 }
export function billingMonthToKey(billingMonth) {
  const m = String(billingMonth).match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  return { year: parseInt(m[1], 10), month: parseInt(m[2], 10) - 1 };
}

// Locate the Invoice Tracker worksheet inside a workbook. Prefers a sheet name
// mentioning both "invoice" and "tracker"; falls back to either keyword.
export async function findInvoiceTrackerSheet(accessToken, workbookId) {
  const res = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbookId}/workbook/worksheets`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('Failed to list worksheets: ' + await res.text());
  const data = await res.json();
  const sheets = data.value || [];
  const norm = (n) => String(n || '').toLowerCase();
  let best = null, bestScore = 0;
  for (const s of sheets) {
    const n = norm(s.name);
    let score = 0;
    if (n.includes('invoice')) score += 2;
    if (n.includes('tracker')) score += 1;
    if (score > bestScore) { best = s; bestScore = score; }
  }
  if (best && bestScore >= 2) return best.name;
  const fb = sheets.find(s => {
    const n = norm(s.name);
    return n.includes('invoice') || n.includes('tracker');
  });
  return fb ? fb.name : null;
}

// Read the Invoice Tracker used range. Returns { values, startRow } where
// startRow is the absolute 1-based Excel row of values[0] (parsed from the
// range address, in case the used range doesn't start at row 1).
export async function readInvoiceTracker(accessToken, workbookId, sheetName) {
  const res = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbookId}/workbook/worksheets('${sheetName}')/usedRange(valuesOnly=true)`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('Failed to read Invoice Tracker sheet: ' + await res.text());
  const data = await res.json();
  let startRow = 1;
  if (data.address) {
    const m = String(data.address).match(/!([A-Z]+)(\d+):/);
    if (m) startRow = parseInt(m[2], 10);
  }
  return { values: data.values || [], startRow };
}

// Find the absolute 1-based Excel row whose month label matches the target.
// The Invoice Tracker identifies each month row by an Excel date serial in
// column A (e.g. row 47 = Apr-26). Matching column A ONLY avoids false matches
// on date serials elsewhere in the sheet (e.g. the agreement Start/End date
// cells in the header area, or helper-row dates).
export function findMonthRow(values, targetKey, startRow = 1) {
  if (!values || !targetKey) return null;
  const target = `${targetKey.year}-${targetKey.month}`;
  for (let r = 0; r < values.length; r++) {
    const row = values[r];
    if (!row) continue;
    const key = cellToMonthKey(row[0]);
    if (key && `${key.year}-${key.month}` === target) return startRow + r;
  }
  return null;
}

// Write a single value to a column-letter + row cell (e.g. colLetter='CH', row=47).
export async function writeTrackerCell(accessToken, workbookId, sheetName, colLetter, rowNumber, value) {
  const address = `${colLetter}${rowNumber}`;
  const res = await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbookId}/workbook/worksheets('${sheetName}')/range(address='${address}')`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [[value]] })
  });
  if (!res.ok) throw new Error(`Failed to write ${address}: ` + await res.text());
  return true;
}

// Convert a spreadsheet column letter (e.g. 'CI') to a 0-based column index.
export function colIndex(letter: string): number {
  let n = 0;
  for (let i = 0; i < letter.length; i++) n = n * 26 + (letter.charCodeAt(i) - 64);
  return n - 1;
}

// Derive a "YYYY-MM" billing month from a webhook/payload object, looking at
// billing_month, period_end_date, or purchase_date (falling back to now).
export function trackerMonthFromPayload(data: any): string {
  if (data?.billing_month) return data.billing_month;
  if (data?.period_end_date) {
    const d = new Date(data.period_end_date.length === 10 ? data.period_end_date + 'T12:00:00' : data.period_end_date);
    if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  if (data?.purchase_date) {
    const d = new Date(data.purchase_date.length === 10 ? data.purchase_date + 'T12:00:00' : data.purchase_date);
    if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Find the Invoice Tracker row whose month label matches the target month and
// write `expected` into `colLetter` for that row (skipping the write if the
// cell already holds that value). Returns { rowFound, written, skipped }.
export async function writeMonthlyRunningTotal(accessToken, workbookId, sheetName, values, startRow, colLetter, year, month0, expected): Promise<{ rowFound: number; written: boolean; skipped: boolean }> {
  const idx = colIndex(colLetter);
  let rowFound = -1, written = false, skipped = false;
  for (let r = 0; r < (values || []).length; r++) {
    const row = values[r];
    if (!row) continue;
    const key = cellToMonthKey(row[0]);
    if (!key) continue;
    if (key.year === year && key.month === month0) {
      rowFound = startRow + r;
      const existing = row[idx];
      const existingNum = (existing == null || existing === '') ? 0 : Number(existing);
      if (existingNum === expected) {
        skipped = true;
      } else {
        await writeTrackerCell(accessToken, workbookId, sheetName, colLetter, rowFound, expected);
        written = true;
      }
      break;
    }
  }
  return { rowFound, written, skipped };
}