import { getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';
import {
  findInvoiceTrackerSheet, readInvoiceTracker, cellToMonthKey, writeTrackerCell
} from '../../shared/invoiceTracker.ts';

// Advances the monthly columns of the Invoice Tracker sheet inside the active
// CRT workbook up to and including the current reporting month:
//
//   • Column D — a "1" marker for each month whose fixed-fee report is filed.
//     Filled for every month from April 2026 (the first month not already
//     completed) through the current month. Months before that are left alone
//     (the two early empty months and the already-completed months).
//
//   • Column B — the sequential Invoice Number, starting at 1 for June 2025
//     (the fixed-fee section start) and incrementing by 1 for each reported
//     month through the current month.
//
// Both are idempotent: cells already holding the correct value are skipped, so
// re-running is safe. Column E (fee amount) is a formula derived from D, so we
// never write it. Triggered manually (SDK, {}) or by the monthly automation.

const D_START = { year: 2026, month: 3 };      // April 2026 — first month to fill D
const B_START = { year: 2025, month: 5 };      // June 2025  — invoice #1
const COL_B = 'B';
const COL_D = 'D';

function currentMonthEdmonton() {
  const s = new Date().toLocaleString('en-US', {
    timeZone: 'America/Edmonton', month: '2-digit', year: 'numeric'
  });
  const [mon, yr] = s.split('/');
  return { year: parseInt(yr, 10), month: parseInt(mon, 10) - 1 };
}

function rank(k) { return k.year * 12 + k.month; }

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
    const dStartRank = rank(D_START);
    const currentRank = rank(current);
    const bStartRank = rank(B_START);

    const dFilled = [];
    const bFilled = [];
    let invoiceNumber = 0;
    let dSkipped = 0;
    let bSkipped = 0;

    for (let r = 0; r < (values || []).length; r++) {
      const row = values[r];
      if (!row) continue;
      const key = cellToMonthKey(row[0]); // column A = month date serial
      if (!key) continue;
      const kRank = rank(key);
      const excelRow = startRow + r;
      const withinReported = kRank >= bStartRank && kRank <= currentRank;

      // Column D — fill 1 for months in [Apr 2026 .. current] not already 1.
      if (kRank >= dStartRank && kRank <= currentRank) {
        const d = row[3];
        if (d === 1 || d === '1' || d === '1.0') {
          dSkipped++;
        } else {
          await writeTrackerCell(accessToken, workbook.id, sheetName, COL_D, excelRow, 1);
          dFilled.push({ row: excelRow, month: `${key.year}-${String(key.month + 1).padStart(2, '0')}` });
        }
      }

      // Column B — sequential invoice number for every reported month
      // (June 2025 .. current). Skips months outside that window (the two
      // early empty months and any future months).
      if (withinReported) {
        invoiceNumber++;
        const b = row[1];
        if (b === invoiceNumber) {
          bSkipped++;
        } else {
          await writeTrackerCell(accessToken, workbook.id, sheetName, COL_B, excelRow, invoiceNumber);
          bFilled.push({ row: excelRow, month: `${key.year}-${String(key.month + 1).padStart(2, '0')}`, invoiceNumber });
        }
      }
    }

    return Response.json({
      status: 'success',
      workbook: workbook.name,
      sheet: sheetName,
      currentMonth: `${current.year}-${String(current.month + 1).padStart(2, '0')}`,
      columnD: { filledCount: dFilled.length, filled: dFilled, skippedAlreadyFilled: dSkipped },
      columnB: { filledCount: bFilled.length, filled: bFilled, skippedAlreadyFilled: bSkipped, lastInvoiceNumber: invoiceNumber }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}