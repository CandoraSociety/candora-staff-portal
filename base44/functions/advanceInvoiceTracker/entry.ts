import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';
import {
  findInvoiceTrackerSheet, readInvoiceTracker, cellToMonthKey, writeTrackerCell
} from '../../shared/invoiceTracker.ts';
import { refreshBillingCounts } from '../../shared/invoiceTrackerCounts.ts';

// Advances the monthly columns of the Invoice Tracker sheet inside the active
// CRT workbook up to and including the current reporting month:
//
//   • Column B — sequential Invoice Number, starting at 1 for June 2025 and
//     incrementing by 1 for each reported month through the current month.
//     April–July 2026 carry resubmission suffixes (11.3, 12.2, 13.3, 14.3)
//     as their invoice numbers. A row's number only populates once the
//     workbook's month reaches that row's month (future rows stay blank).
//     Written to EVERY month's workbook (not just the active one) so each
//     archived workbook bundled into its invoice package carries its number.
//
//   • Column D — a "1" marker for each month whose fixed-fee report is filed,
//     filled for every month from April 2026 through the current month (months
//     before that are left alone — the two early empty months and the already-
//     completed months).
//
//   • Billing-summary quantity columns — delegated to refreshBillingCounts
//     (shared/invoiceTrackerCounts.ts), which recomputes the six per-month
//     quantities (CEIS (DEA) Starters, WD Complete, WD Placement (EDA
//     Completion), CEIS (DEA) 90 Day, WD 90 Day, Service Navigation Fee) plus
//     the paid-work-exposure dollar total from current portal client data for
//     every month from April 2026 through the current month. The same helper
//     is invoked by syncCrossRefUpdatesToCrt so cross-reference pushes refresh
//     these tallies immediately instead of waiting for this monthly run.
//
// All writes are idempotent: cells already holding the correct value are
// skipped, so re-running is safe. Triggered manually (SDK, {}) or by the
// monthly automation.

const D_START = { year: 2026, month: 3 };      // April 2026 — first month to fill D
const B_START = { year: 2025, month: 5 };      // June 2025  — invoice #1 / counts start
const COL_B = 'B';
const COL_D = 'D';

// 2026 only: April–July invoice numbers carry a resubmission suffix on the
// Invoice Tracker sheet — April 11.3, May 12.2, June 13.3, July 14.3.
const SUFFIXES_2026 = { '2026-04': 3, '2026-05': 2, '2026-06': 3, '2026-07': 3 };

function currentMonthEdmonton() {
  const s = new Date().toLocaleString('en-US', {
    timeZone: 'America/Edmonton', month: '2-digit', year: 'numeric'
  });
  const [mon, yr] = s.split('/');
  return { year: parseInt(yr, 10), month: parseInt(mon, 10) - 1 };
}

function rank(k) { return k.year * 12 + k.month; }

const MONTH_NAMES = ['january','february','march','april','may','june','july','august','september','october','november','december'];
// Parse "CRT_<Month>_<Year>.xlsx" → { year, month (0-indexed) }.
function parseWorkbookMonth(fileName) {
  const m = String(fileName || '').match(/CRT_([A-Za-z]+)_(\d{4})\.xlsx/i);
  if (!m) return null;
  const monthIdx = MONTH_NAMES.indexOf(m[1].toLowerCase());
  if (monthIdx < 0) return null;
  return { year: parseInt(m[2], 10), month: monthIdx };
}

export default async function(req: Request): Promise<Response> {
  try {
    const accessToken = await getGraphToken();
    const allFiles = await listCrtFiles(accessToken);
    if (!allFiles || allFiles.length === 0) {
      return Response.json({ status: 'no_workbook', message: 'No CRT workbook found in SharePoint.' });
    }
    const active = allFiles[0]; // listCrtFiles returns newest-first

    const current = currentMonthEdmonton();
    const dStartRank = rank(D_START);
    const currentRank = rank(current);
    const bStartRank = rank(B_START);

    const perWorkbook = [];
    const dFilled = [];
    let dSkipped = 0;
    let lastInvoiceNumber = 0;
    let billingCounts = null;

    // Write Column B (invoice number) to EVERY workbook's Invoice Tracker — not
    // just the active one — so each month's own archived workbook (the one
    // bundled into its invoice package) carries the number too. Column D and
    // the billing-count refresh only touch the active workbook, matching the
    // previous behaviour. All writes are idempotent.
    for (const file of allFiles) {
      const sheetName = await findInvoiceTrackerSheet(accessToken, file.id);
      if (!sheetName) {
        perWorkbook.push({ workbook: file.name, status: 'no_sheet' });
        continue;
      }
      const { values, startRow } = await readInvoiceTracker(accessToken, file.id, sheetName);
      // Only write invoice numbers up to THIS workbook's own month — a month's
      // archived workbook (the one bundled into its invoice package) must only
      // carry numbers up to that month, not future months. The active workbook
      // (newest) carries up to the current month.
      const wbMonth = parseWorkbookMonth(file.name);
      const wbRank = wbMonth ? rank(wbMonth) : currentRank;
      const bFilled = [];
      const bCleared = [];
      let wbBSkipped = 0;

      for (let r = 0; r < (values || []).length; r++) {
        const row = values[r];
        if (!row) continue;
        const key = cellToMonthKey(row[0]); // column A = month date serial
        if (!key) continue;
        const kRank = rank(key);
        const excelRow = startRow + r;
        const monthLabel = `${key.year}-${String(key.month + 1).padStart(2, '0')}`;

        // Column B — sequential invoice number for every reported month, with a
        // ".2" suffix for April–July 2026.
        if (kRank >= bStartRank && kRank <= currentRank) {
          const seq = kRank - bStartRank + 1;
          if (seq > lastInvoiceNumber) lastInvoiceNumber = seq;
          const suffix = SUFFIXES_2026[monthLabel];
          const isSuffix = suffix != null;
          const desired = isSuffix ? `${seq}.${suffix}` : seq;
          const existing = row[1];
          const existingStr = existing == null ? '' : String(existing);

          if (kRank <= wbRank) {
            // On or before this workbook's month — write the invoice number.
            // Suffix cells are always re-written (with General format) so Excel
            // displays "11.1" instead of rounding under an integer column format;
            // plain integer cells skip when already correct (idempotent).
            if (!isSuffix && existingStr === String(desired)) {
              wbBSkipped++;
            } else {
              await writeTrackerCell(accessToken, file.id, sheetName, COL_B, excelRow, desired, isSuffix ? 'General' : undefined);
              bFilled.push({ row: excelRow, month: monthLabel, value: desired });
            }
          } else {
            // Future month relative to this workbook — clear any number written
            // by an earlier run so the archived workbook doesn't leak future
            // invoice numbers into its invoice package.
            if (existingStr !== '') {
              await writeTrackerCell(accessToken, file.id, sheetName, COL_B, excelRow, '');
              bCleared.push({ row: excelRow, month: monthLabel, oldValue: existingStr });
            }
          }
        }

        // Column D — "1" marker for months [Apr 2026 .. current], active workbook only.
        if (file.id === active.id && kRank >= dStartRank && kRank <= currentRank) {
          const d = row[3];
          if (d === 1 || d === '1' || d === '1.0') {
            dSkipped++;
          } else {
            await writeTrackerCell(accessToken, file.id, sheetName, COL_D, excelRow, 1);
            dFilled.push({ row: excelRow, month: monthLabel });
          }
        }
      }

      perWorkbook.push({
        workbook: file.name,
        active: file.id === active.id,
        columnB: { filledCount: bFilled.length, filled: bFilled, clearedCount: bCleared.length, cleared: bCleared, skippedAlreadyFilled: wbBSkipped },
      });

      // Billing-summary counts + paid-work-exposure dollar total — active only.
      if (file.id === active.id) {
        try {
          billingCounts = await refreshBillingCounts(createClientFromRequest(req), accessToken, file, { values, startRow, sheetName });
        } catch (e) {
          billingCounts = { status: 'error', error: String(e.message || e).slice(0, 200) };
        }
      }
    }

    return Response.json({
      status: 'success',
      activeWorkbook: active.name,
      currentMonth: `${current.year}-${String(current.month + 1).padStart(2, '0')}`,
      workbooks: perWorkbook,
      columnD: { filledCount: dFilled.length, filled: dFilled, skippedAlreadyFilled: dSkipped },
      lastInvoiceNumber,
      billingCounts,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}