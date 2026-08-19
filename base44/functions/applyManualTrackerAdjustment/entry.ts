import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook, listCrtFiles, crtMonthEnd, DRIVE_ID } from '../../shared/crtWorkbook.ts';
import { findInvoiceTrackerSheet, readInvoiceTracker, findMonthRow, billingMonthToKey, writeTrackerCell } from '../../shared/invoiceTracker.ts';

// Manually writes one or more Invoice Tracker cells for the row whose month
// matches the package's billing month. Writes to BOTH:
//   1. The active (latest) CRT workbook — so the live portal invoice (which
//      reads the active workbook) reflects the change immediately.
//   2. The CRT workbook whose filename matches the billing month (e.g.
//      CRT_June_2026.xlsx for "2026-06") — so the value lands in the month's
//      own CRT, which is the workbook submitted to the funder for that month.
// If the two are the same workbook (current month), it's a single write.
// After each write a full workbook recalculation is requested so dependent
// formula columns refresh.
//
// Accepts { billingMonth, adjustments: [{ colLetter, value }, ...] } (batch)
// or the legacy single { billingMonth, colLetter, value }. Numeric input is
// parsed to a number; everything else is written as text.

function parseValue(v: any): number | string {
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

async function recalc(accessToken: string, workbookId: string) {
  try {
    await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbookId}/workbook/application/calculate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ calculationType: 'Full' })
    });
  } catch { /* recalc best-effort */ }
}

// Write a list of adjustments to one workbook's Invoice Tracker month row.
async function writeToWorkbook(accessToken: string, wb: any, key: { year: number; month: number }, list: any[]) {
  const sheetName = await findInvoiceTrackerSheet(accessToken, wb.id);
  if (!sheetName) return { workbook: wb.name, status: 'no_sheet' };
  const { values, startRow } = await readInvoiceTracker(accessToken, wb.id, sheetName);
  const row = findMonthRow(values, key, startRow);
  if (!row) return { workbook: wb.name, status: 'month_not_found' };
  const written: any[] = [];
  for (const a of list) {
    const col = String(a.colLetter).toUpperCase();
    const cellValue = parseValue(a.value);
    await writeTrackerCell(accessToken, wb.id, sheetName, col, row, cellValue);
    written.push({ colLetter: col, value: cellValue });
  }
  await recalc(accessToken, wb.id);
  return { workbook: wb.name, status: 'success', sheet: sheetName, row, written };
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const { billingMonth, adjustments, colLetter, value } = payload || {};
    if (!billingMonth) return Response.json({ error: 'billingMonth is required' }, { status: 400 });

    const list: any[] = Array.isArray(adjustments)
      ? adjustments
      : (colLetter ? [{ colLetter, value }] : []);
    if (!list.length) return Response.json({ error: 'No adjustments provided' }, { status: 400 });

    const accessToken = await getGraphToken();
    const key = billingMonthToKey(billingMonth);
    if (!key) return Response.json({ status: 'invalid_month', billingMonth });

    const active = await getActiveCrtWorkbook(accessToken);
    if (!active) return Response.json({ status: 'no_workbook' });

    const files = await listCrtFiles(accessToken);

    // The billing month's row (e.g. April, row 47) exists in the Invoice Tracker
    // of EVERY workbook whose month is on or after the billing month — each
    // monthly CRT carries cumulative rows for all prior months. So a manual
    // entry must be written to all of those workbooks so it shows up
    // consistently on the billing month's own CRT and every subsequent CRT.
    const targets = files.filter(f => {
      const me = crtMonthEnd(f.name);
      if (!me) return false;
      return (me.getUTCFullYear() > key.year) ||
             (me.getUTCFullYear() === key.year && me.getUTCMonth() >= key.month);
    }).sort((a, b) => crtMonthEnd(a.name).getTime() - crtMonthEnd(b.name).getTime());

    // Always include the active workbook even if it somehow wasn't listed (it
    // drives the live portal invoice).
    if (!targets.some(t => t.id === active.id)) targets.push(active);

    const results = [];
    let primary = null;
    for (const wb of targets) {
      const r = await writeToWorkbook(accessToken, wb, key, list);
      results.push(r);
      if (wb.id === active.id) primary = r;
    }

    return Response.json({
      status: primary?.status || 'success',
      workbook: active.name,
      sheet: primary?.sheet,
      billingMonth,
      row: primary?.row,
      written: primary?.written || [],
      workbooks: results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}