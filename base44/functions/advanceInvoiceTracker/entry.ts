import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';
import {
  findInvoiceTrackerSheet, readInvoiceTracker, cellToMonthKey, writeTrackerCell
} from '../../shared/invoiceTracker.ts';
import { computeMonthBillingCounts } from '../../shared/crtBillingCounts.ts';

// Advances the monthly columns of the Invoice Tracker sheet inside the active
// CRT workbook up to and including the current reporting month:
//
//   • Column B — sequential Invoice Number, starting at 1 for June 2025 and
//     incrementing by 1 for each reported month through the current month.
//
//   • Column D — a "1" marker for each month whose fixed-fee report is filed,
//     filled for every month from April 2026 through the current month (months
//     before that are left alone — the two early empty months and the already-
//     completed months).
//
//   • Billing-summary quantity columns — the six per-month quantities that
//     mirror the "Billing Summary" tiles on the CRT page, written under the
//     matching headings. Each heading has TWO columns beneath it: the LEFT
//     (the heading column itself) holds the quantity we write; the RIGHT
//     (next column) holds a pre-built formula that computes the dollar amount
//     from the quantity — so we only ever write the left/quantity column.
//     Headings: CEIS (DEA) Starters (L), WD Complete (X), WD Placement (EDA
//     Completion) (AN), CEIS (DEA) 90 Day (BH), WD 90 Day (BL), Service
//     Navigation Fee (CD). Computed from current portal client data for every
//     month from June 2025 through the current month.
//
// All writes are idempotent: cells already holding the correct value are
// skipped, so re-running is safe. Triggered manually (SDK, {}) or by the
// monthly automation.

const D_START = { year: 2026, month: 3 };      // April 2026 — first month to fill D
const B_START = { year: 2025, month: 5 };      // June 2025  — invoice #1 / counts start
const COL_B = 'B';
const COL_D = 'D';

// Quantity columns (the LEFT column under each heading — the heading column
// itself). The RIGHT column (next letter) holds the dollar-amount formula.
const COUNT_COLUMNS = {
  deaStarters: 'L',             // CEIS (DEA) Starters          (formula in M)
  wdComplete: 'X',              // WD Complete                   (formula in Y)
  wdPlacementCompletion: 'AN',  // WD Placement (EDA Completion)  (formula in AO)
  dea90Day: 'BH',               // CEIS (DEA) 90 Day             (formula in BI)
  wd90Day: 'BL',                // WD 90 Day                     (formula in BM)
  serviceNavFee: 'CD',          // Service Navigation Fee        (formula in CE)
};

function currentMonthEdmonton() {
  const s = new Date().toLocaleString('en-US', {
    timeZone: 'America/Edmonton', month: '2-digit', year: 'numeric'
  });
  const [mon, yr] = s.split('/');
  return { year: parseInt(yr, 10), month: parseInt(mon, 10) - 1 };
}

function rank(k) { return k.year * 12 + k.month; }

function colIndex(letter) {
  let n = 0;
  for (let i = 0; i < letter.length; i++) n = n * 26 + (letter.charCodeAt(i) - 64);
  return n - 1; // 0-based
}

const COUNT_INDICES = Object.fromEntries(
  Object.entries(COUNT_COLUMNS).map(([k, c]) => [k, colIndex(c)])
);

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

    // Fetch all clients (DEA + WD) for billing-count computation.
    const base44 = createClientFromRequest(req);
    let clients = [];
    try { clients = await base44.asServiceRole.entities.Client.list('-created_date', 5000) || []; }
    catch { clients = []; }

    const dFilled = [];
    const bFilled = [];
    const countFilled = [];
    const countErrors = [];
    let invoiceNumber = 0;
    let dSkipped = 0;
    let bSkipped = 0;
    let countSkipped = 0;

    for (let r = 0; r < (values || []).length; r++) {
      const row = values[r];
      if (!row) continue;
      const key = cellToMonthKey(row[0]); // column A = month date serial
      if (!key) continue;
      const kRank = rank(key);
      const excelRow = startRow + r;
      const monthLabel = `${key.year}-${String(key.month + 1).padStart(2, '0')}`;
      const withinReported = kRank >= bStartRank && kRank <= currentRank;

      // Column D — fill 1 for months in [Apr 2026 .. current] not already 1.
      if (kRank >= dStartRank && kRank <= currentRank) {
        const d = row[3];
        if (d === 1 || d === '1' || d === '1.0') {
          dSkipped++;
        } else {
          await writeTrackerCell(accessToken, workbook.id, sheetName, COL_D, excelRow, 1);
          dFilled.push({ row: excelRow, month: monthLabel });
        }
      }

      // Column B — sequential invoice number for every reported month.
      if (withinReported) {
        invoiceNumber++;
        const b = row[1];
        if (b === invoiceNumber) {
          bSkipped++;
        } else {
          await writeTrackerCell(accessToken, workbook.id, sheetName, COL_B, excelRow, invoiceNumber);
          bFilled.push({ row: excelRow, month: monthLabel, invoiceNumber });
        }

        // Billing-summary quantities for this month (recomputed from current data).
        const counts = computeMonthBillingCounts(clients, key.year, key.month);
        for (const [ck, col] of Object.entries(COUNT_COLUMNS)) {
          const expected = counts[ck];
          const existing = row[COUNT_INDICES[ck]];
          const existingNum = (existing == null || existing === '') ? 0 : Number(existing);
          if (existingNum === expected) { countSkipped++; continue; }
          try {
            await writeTrackerCell(accessToken, workbook.id, sheetName, col, excelRow, expected);
            countFilled.push({ row: excelRow, month: monthLabel, column: col, key: ck, value: expected });
          } catch (e) {
            countErrors.push({ row: excelRow, month: monthLabel, column: col, key: ck, error: String(e.message || e).slice(0, 120) });
          }
        }
      }
    }

    return Response.json({
      status: 'success',
      workbook: workbook.name,
      sheet: sheetName,
      currentMonth: `${current.year}-${String(current.month + 1).padStart(2, '0')}`,
      clientsConsidered: clients.length,
      columnD: { filledCount: dFilled.length, filled: dFilled, skippedAlreadyFilled: dSkipped },
      columnB: { filledCount: bFilled.length, filled: bFilled, skippedAlreadyFilled: bSkipped, lastInvoiceNumber: invoiceNumber },
      billingCounts: { filledCount: countFilled.length, filled: countFilled, skippedAlreadyFilled: countSkipped, errors: countErrors }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}