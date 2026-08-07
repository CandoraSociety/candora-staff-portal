import { getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';
import {
  findInvoiceTrackerSheet, readInvoiceTracker, cellToMonthKey, writeTrackerCell
} from '../../shared/invoiceTracker.ts';

// Column D of the Invoice Tracker sheet holds a "1" marker for each month that
// has had its fixed-fee monthly report submitted (column E is a formula that
// derives the fee from D, so we only ever write D).
//
// This function fills column D = 1 for every month row from April 2026 (the
// first month not already completed) up to and including the current reporting
// month. It is idempotent: rows already marked 1 are skipped, and months
// outside the [Apr 2026 .. current month] window are never touched (so the two
// early empty months and any future months are left alone).
//
// Triggered two ways:
//   1. Manually via the SDK with {} — fills through the current month now.
//   2. Scheduled automation — runs monthly to advance column D to the new
//      current month.

// Reporting starts April 2026; everything prior was already completed.
const START_MONTH = { year: 2026, month: 3 }; // month0: 3 = April
const COLUMN = 'D';

function currentMonthEdmonton() {
  // Candora operates in Alberta. Use America/Edmonton so "current month" tracks
  // the business month, not UTC.
  const s = new Date().toLocaleString('en-US', {
    timeZone: 'America/Edmonton', month: '2-digit', year: 'numeric'
  });
  const [mon, yr] = s.split('/');
  return { year: parseInt(yr, 10), month: parseInt(mon, 10) - 1 };
}

function keyRank(k) { return k.year * 12 + k.month; }

export default async function(req: Request): Promise<Response> {
  try {
    const accessToken = await getGraphToken();
    const workbook = await getActiveCrtWorkbook(accessToken);
    if (!workbook) {
      return Response.json({ status: 'no_workbook', message: 'No active CRT workbook found in SharePoint.' });
    }
    const sheetName = await findInvoiceTrackerSheet(accessToken, workbook.id);
    if (!sheetName) {
      return Response.json({ status: 'no_sheet', message: 'No Invoice Tracker sheet found.', workbook: workbook.name });
    }
    const { values, startRow } = await readInvoiceTracker(accessToken, workbook.id, sheetName);

    const current = currentMonthEdmonton();
    const startRank = keyRank(START_MONTH);
    const currentRank = keyRank(current);

    const filled = [];
    let skippedAlreadyFilled = 0;

    for (let r = 0; r < (values || []).length; r++) {
      const row = values[r];
      if (!row) continue;
      const key = cellToMonthKey(row[0]); // column A = month date serial
      if (!key) continue;
      const rank = keyRank(key);
      if (rank < startRank || rank > currentRank) continue; // outside window

      // Skip rows already marked 1 (idempotent — don't overwrite completed months).
      const existing = row[3];
      if (existing === 1 || existing === '1' || existing === '1.0') {
        skippedAlreadyFilled++;
        continue;
      }

      const excelRow = startRow + r;
      await writeTrackerCell(accessToken, workbook.id, sheetName, COLUMN, excelRow, 1);
      filled.push({ row: excelRow, month: `${key.year}-${String(key.month + 1).padStart(2, '0')}` });
    }

    return Response.json({
      status: 'success',
      workbook: workbook.name,
      sheet: sheetName,
      currentMonth: `${current.year}-${String(current.month + 1).padStart(2, '0')}`,
      windowStart: '2026-04',
      filledCount: filled.length,
      filled,
      skippedAlreadyFilled
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}