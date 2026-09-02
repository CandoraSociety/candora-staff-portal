// Shared helper that recomputes and writes the billing-summary quantity
// columns (CEIS (DEA) Starters, WD Complete, WD Placement (EDA Completion),
// CEIS (DEA) 90 Day, WD 90 Day, Service Navigation Fee) plus the paid-work-
// exposure dollar column of the Invoice Tracker sheet inside a given CRT
// workbook. The counts are derived purely from current Client entity fields
// (DEA/WD start date, EDA completion, placement, 90-day outcome, service-nav
// billing month) — so any change to those fields, however it was made, flows
// through to the Invoice Tracker tallies the next time this runs.
//
// Idempotent: cells already holding the correct value are skipped, so this is
// safe to call after every cross-reference push, on every run of the monthly
// advance automation, or manually.
//
// Used by:
//   - advanceInvoiceTracker (monthly scheduled + manual) — for every month
//     from April 2026 through the current reporting month.
//   - syncCrossRefUpdatesToCrt — after pushing cross-ref field values back
//     into client files, so the Invoice Tracker tallies refresh immediately
//     instead of waiting for the monthly advance.

import {
  findInvoiceTrackerSheet, readInvoiceTracker, cellToMonthKey, writeTrackerCell, colIndex
} from './invoiceTracker.ts';
import { computeMonthBillingCounts, computeMonthWorkExposureTotal, computeMonthEmploymentSupportsTotal } from './crtBillingCounts.ts';
import { crtMonthEnd } from './crtWorkbook.ts';

// Retry a Graph API call that may hit a transient 504 (gateway timeout).
// Microsoft Graph occasionally times out on worksheet operations; a short
// back-off + retry usually succeeds.
async function withGraphRetry(fn, retries = 2) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      const msg = String(e.message || e);
      if (i < retries && (msg.includes('504') || msg.includes('502') || msg.includes('503'))) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

const D_START = { year: 2026, month: 3 }; // April 2026 — first month to fill counts

// Column D — fixed monthly fee quantity marker. A "1" is written for every
// month from April 2026 through the current reporting month to indicate that
// month's fixed-fee report is filed. Filled by advanceInvoiceTracker on the
// active workbook AND by refreshBillingCounts (below) on every open workbook,
// so prior months' column D is kept in sync after a cross-reference push.
const COL_D = 'D';
const D_INDEX = 3;

// Quantity columns (the LEFT column under each heading — the heading column
// itself). The RIGHT column (next letter) holds the dollar-amount formula.
const COUNT_COLUMNS = {
  deaStarters: 'L',             // CEIS (DEA) Starters          (formula in M)
  wdComplete: 'X',              // WD Complete                   (formula in Y)
  wdPlacementCompletion: 'AN',  // WD Placement (EDA Completion) (formula in AO)
  dea90Day: 'BH',               // CEIS (DEA) 90 Day             (formula in BI)
  wd90Day: 'BL',                // WD 90 Day                     (formula in BM)
  serviceNavFee: 'CD',          // Service Navigation Fee        (formula in CE)
};

// Dollar-value columns (written directly — no separate formula column).
const DOLLAR_COLUMNS = {
  paidWorkExposure: 'CJ',     // Paid Work Exposure (running $ total)
  employmentSupports: 'CI',   // Employment Supports (running $ total — reimbursable amount, tax excluded)
};

const COUNT_INDICES = Object.fromEntries(
  Object.entries(COUNT_COLUMNS).map(([k, c]) => [k, colIndex(c)])
);
const DOLLAR_INDICES = Object.fromEntries(
  Object.entries(DOLLAR_COLUMNS).map(([k, c]) => [k, colIndex(c)])
);

function rank(k) { return k.year * 12 + k.month; }

function currentMonthEdmonton() {
  const s = new Date().toLocaleString('en-US', {
    timeZone: 'America/Edmonton', month: '2-digit', year: 'numeric'
  });
  const [mon, yr] = s.split('/');
  return { year: parseInt(yr, 10), month: parseInt(mon, 10) - 1 };
}

// Recompute and write the billing-summary counts + paid-work-exposure dollar
// total for every reported month (Apr 2026 .. current Edmonton month) on the
// given workbook's Invoice Tracker sheet. Returns a summary of writes.
//
// `preRead` ({ values, startRow }) optionally supplies already-read Invoice
// Tracker values so callers that read the sheet for other purposes (e.g.
// advanceInvoiceTracker fills columns B + D) avoid a second read.
export async function refreshBillingCounts(base44, accessToken, workbook, preRead?, preFetched?) {
  const sheetName = preRead?.sheetName || await withGraphRetry(() => findInvoiceTrackerSheet(accessToken, workbook.id));
  if (!sheetName) return { status: 'no_sheet', workbook: workbook.name };
  let values, startRow;
  if (preRead && preRead.values) {
    values = preRead.values;
    startRow = preRead.startRow ?? 1;
  } else {
    const read = await withGraphRetry(() => readInvoiceTracker(accessToken, workbook.id, sheetName));
    values = read.values;
    startRow = read.startRow;
  }

  // Use pre-fetched entity lists when provided (avoids re-fetching ALL clients
  // + financial records on every workbook when refreshing multiple months).
  let clients = preFetched?.clients;
  if (!clients) {
    clients = [];
    try { clients = await base44.asServiceRole.entities.Client.list('-created_date', 5000) || []; } catch { /* empty */ }
  }
  let financialRecords = preFetched?.financialRecords;
  if (!financialRecords) {
    financialRecords = [];
    try { financialRecords = await base44.asServiceRole.entities.FinancialRecord.list('-date', 5000) || []; } catch { /* empty */ }
  }

  // Cap the upper bound at this workbook's own month so a prior-month workbook
  // only contains data through that month — not future months' data. The active
  // (current) month's workbook falls back to the current Edmonton month.
  const globalCurrent = currentMonthEdmonton();
  const dStartRank = rank(D_START);
  const globalCurrentRank = rank(globalCurrent);
  const wbMonthEnd = crtMonthEnd(workbook.name);
  let wbRank = globalCurrentRank;
  if (wbMonthEnd) {
    const wbKey = { year: wbMonthEnd.getUTCFullYear(), month: wbMonthEnd.getUTCMonth() };
    if (rank(wbKey) < globalCurrentRank) wbRank = rank(wbKey);
  }

  const countFilled = [];
  const countErrors = [];
  const dollarFilled = [];
  const dFilled = [];
  let countSkipped = 0;
  let dollarSkipped = 0;
  let dSkipped = 0;

  for (let r = 0; r < (values || []).length; r++) {
    const row = values[r];
    if (!row) continue;
    const key = cellToMonthKey(row[0]);
    if (!key) continue;
    const kRank = rank(key);
    if (kRank < dStartRank || kRank > globalCurrentRank) continue;
    const excelRow = startRow + r;
    const monthLabel = `${key.year}-${String(key.month + 1).padStart(2, '0')}`;
    // Months beyond this workbook's own month-end snapshot get zeroed so a
    // prior-month workbook (e.g. April) doesn't show future months' figures.
    const isFuture = kRank > wbRank;

    // Column D — fixed monthly fee marker (1 per month Apr 2026 .. workbook month).
    // Future months on a prior-month workbook are cleared.
    const dExisting = row[D_INDEX];
    const dHasMarker = dExisting === 1 || dExisting === '1' || dExisting === '1.0';
    if (!isFuture) {
      if (dHasMarker) {
        dSkipped++;
      } else {
        try {
          await writeTrackerCell(accessToken, workbook.id, sheetName, COL_D, excelRow, 1);
          dFilled.push({ row: excelRow, month: monthLabel });
        } catch (e) {
          countErrors.push({ row: excelRow, month: monthLabel, column: COL_D, key: 'fixedFee', error: String(e.message || e).slice(0, 120) });
        }
      }
    } else if (dHasMarker) {
      try {
        await writeTrackerCell(accessToken, workbook.id, sheetName, COL_D, excelRow, null);
        dFilled.push({ row: excelRow, month: monthLabel, cleared: true });
      } catch (e) {
        countErrors.push({ row: excelRow, month: monthLabel, column: COL_D, key: 'fixedFee', error: String(e.message || e).slice(0, 120) });
      }
    } else {
      dSkipped++;
    }

    const counts = isFuture ? null : computeMonthBillingCounts(clients, key.year, key.month);
    for (const [ck, col] of Object.entries(COUNT_COLUMNS)) {
      const expected = isFuture ? 0 : counts[ck];
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

    for (const [dk, col] of Object.entries(DOLLAR_COLUMNS)) {
      const dollarExpected = isFuture ? 0 : (dk === 'paidWorkExposure'
        ? computeMonthWorkExposureTotal(financialRecords, key.year, key.month)
        : dk === 'employmentSupports'
          ? computeMonthEmploymentSupportsTotal(financialRecords, key.year, key.month)
          : 0);
      const dollarExisting = row[DOLLAR_INDICES[dk]];
      const dollarExistingNum = (dollarExisting == null || dollarExisting === '') ? 0 : Number(dollarExisting);
      if (dollarExistingNum === dollarExpected) { dollarSkipped++; continue; }
      try {
        await writeTrackerCell(accessToken, workbook.id, sheetName, col, excelRow, dollarExpected);
        dollarFilled.push({ row: excelRow, month: monthLabel, column: col, key: dk, value: dollarExpected });
      } catch (e) {
        countErrors.push({ row: excelRow, month: monthLabel, column: col, key: dk, error: String(e.message || e).slice(0, 120) });
      }
    }
  }

  return {
    status: 'success',
    workbook: workbook.name,
    sheet: sheetName,
    countFilled,
    countSkipped,
    countErrors,
    dollarFilled,
    dollarSkipped,
    dFilled,
    dSkipped,
  };
}