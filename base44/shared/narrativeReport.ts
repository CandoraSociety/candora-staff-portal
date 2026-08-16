// Shared helper for the "Narrative Report" sheet inside a monthly CRT workbook.
// Each monthly CRT (CRT_<Month>_<Year>.xlsx) is created by copying the previous
// month's file (rollForwardCrtWorkbook). The copy carries over the previous
// month's Narrative Report rows — both the Reporting Period dates (cols A/B)
// and the Category + Summary narrative text (cols C/D). Left untouched, a new
// month's workbook shows the previous month's narrative under the previous
// month's dates.
//
// This sync aligns the sheet with the workbook's own month:
//   1. Set every data row's Reporting Period Start (A) and End (B) to the
//      workbook month's first / last day (as Excel serials, so the cells stay
//      real dates and keep their date number format).
//   2. Keep Category/Summary text ONLY on rows whose existing Reporting Period
//      already matches the workbook month (this month's narrative, preserved).
//      Rows whose existing dates belong to a different month are stale
//      carry-over — clear their Category/Summary text. Rows with no parseable
//      date are treated as fresh in-progress entries: keep their text and
//      assign the workbook month's dates.
//
// Idempotent: re-running on a correctly-dated workbook keeps everything; a
// rolled-forward workbook gets a clean slate for the new month.

import { DRIVE_ID } from './crtWorkbook.ts';
import { cellToMonthKey } from './invoiceTracker.ts';
import { excelSerial } from './crtDatePatch.ts';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const NARRATIVE_SHEET = 'Narrative Report';
const DATA_START_ROW = 10; // 1-based; row 9 is the header row
const NUM_COLS = 4; // A: Reporting Period (Start), B: (End), C: Category, D: Summary

// Parse the workbook month from its filename (CRT_<Month>_<Year>.xlsx) →
// { year, month0 } or null.
export function narrativeMonthFromFileName(fileName) {
  const m = String(fileName).match(/CRT_(\w+)_(\d{4})/i);
  if (!m) return null;
  const monthName = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  const monthIdx = MONTHS.indexOf(monthName);
  if (monthIdx < 0) return null;
  return { year: parseInt(m[2], 10), month: monthIdx };
}

// Sync the Narrative Report sheet of a single workbook to that workbook's
// month. Returns a small status object. Non-fatal: callers may run this
// alongside the client-data sync without aborting on a narrative error.
export async function syncNarrativeReportIntoWorkbook(accessToken, workbook) {
  const wbKey = narrativeMonthFromFileName(workbook.name);
  if (!wbKey) {
    return { status: 'no_month', message: 'Could not parse month from filename: ' + workbook.name };
  }
  const monthStart = new Date(Date.UTC(wbKey.year, wbKey.month, 1));
  const monthEnd = new Date(Date.UTC(wbKey.year, wbKey.month + 1, 0));
  const startSerial = excelSerial(monthStart);
  const endSerial = excelSerial(monthEnd);

  // Read the used range of the Narrative Report sheet (values only).
  const usedRes = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbook.id}/workbook/worksheets('${NARRATIVE_SHEET}')/usedRange(valuesOnly=true)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!usedRes.ok) {
    return { status: 'read_failed', error: await usedRes.text() };
  }
  const used = await usedRes.json();
  const values = used.values || [];

  // Find the last row (from row 10 onward) that has any content in A–D.
  let lastDataIdx = DATA_START_ROW - 2; // 0-based index; -1 means none
  for (let i = values.length - 1; i >= DATA_START_ROW - 1; i--) {
    const row = values[i] || [];
    let hasContent = false;
    for (let c = 0; c < NUM_COLS; c++) {
      const v = row[c];
      if (v !== null && v !== undefined && String(v).trim() !== '') { hasContent = true; break; }
    }
    if (hasContent) { lastDataIdx = i; break; }
  }
  if (lastDataIdx < DATA_START_ROW - 1) {
    return { status: 'no_data', month: `${wbKey.year}-${String(wbKey.month + 1).padStart(2, '0')}` };
  }

  // Compose the updated A:D rows for the data region.
  let kept = 0, cleared = 0, fresh = 0;
  const outRows = [];
  for (let i = DATA_START_ROW - 1; i <= lastDataIdx; i++) {
    const row = values[i] || [];
    const aKey = cellToMonthKey(row[0]);
    const bKey = cellToMonthKey(row[1]);
    const cText = row[2] != null ? row[2] : '';
    const dText = row[3] != null ? row[3] : '';
    const hasText = String(cText).trim() !== '' || String(dText).trim() !== '';

    let newC = cText;
    let newD = dText;

    if (aKey || bKey) {
      // Row already has reporting-period dates.
      const aMatches = aKey && aKey.year === wbKey.year && aKey.month === wbKey.month;
      const bMatches = bKey && bKey.year === wbKey.year && bKey.month === wbKey.month;
      if (aMatches || bMatches) {
        // Already this month — preserve the narrative text.
        if (hasText) kept++;
      } else {
        // Stale carry-over from a different month — clear the narrative text.
        newC = '';
        newD = '';
        if (hasText) cleared++;
      }
    } else {
      // No parseable date — treat as a fresh in-progress entry: keep any text
      // and assign this month's dates so the row is correctly dated.
      if (hasText) fresh++;
    }

    outRows.push([startSerial, endSerial, newC, newD]);
  }

  // PATCH the data region A10:D<lastRow>.
  const endRow1 = lastDataIdx + 1; // 1-based
  const rangeAddress = `A${DATA_START_ROW}:D${endRow1}`;
  const patchRes = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbook.id}/workbook/worksheets('${NARRATIVE_SHEET}')/range(address='${rangeAddress}')`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: outRows })
    }
  );
  if (!patchRes.ok) {
    return { status: 'write_failed', error: await patchRes.text() };
  }

  return {
    status: 'success',
    month: `${wbKey.year}-${String(wbKey.month + 1).padStart(2, '0')}`,
    rows: outRows.length,
    kept, cleared, fresh,
    startSerial, endSerial
  };
}