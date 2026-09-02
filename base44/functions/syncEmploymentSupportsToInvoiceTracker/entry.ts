import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook, listCrtFiles, crtMonthEnd } from '../../shared/crtWorkbook.ts';
import {
  findInvoiceTrackerSheet, readInvoiceTracker, trackerMonthFromPayload, writeMonthlyRunningTotal
} from '../../shared/invoiceTracker.ts';
import { computeMonthEmploymentSupportsTotal } from '../../shared/crtBillingCounts.ts';

// Writes the cumulative running dollar total of all employment-supports
// purchases for a given billing month into column CI of the Invoice Tracker
// sheet. The total EXCLUDES tax (only the reimbursable `amount` is summed).
// Idempotent — recomputes the full month total each call, so additional
// purchases accumulate into the CI column.
//
// Writes to EVERY open monthly CRT workbook whose month is on or after the
// billing month — each workbook carries cumulative rows for all prior
// months, so the month's row appears in every subsequent workbook. This
// keeps the Employment Supports total consistent across the active workbook
// (which drives the live portal invoice) and every other open month's CRT
// (which is what gets submitted to the funder). Closed/frozen workbooks are
// skipped.
//
// Triggered from the purchase-request determination flow on approval AND from
// the FinancialRecord entity automation (create/update/delete).

const COL_CI = 'CI';

export default async function(req: Request): Promise<Response> {
  try {
    let payload: any = {};
    try { payload = await req.json(); } catch {}
    const billingMonth = trackerMonthFromPayload(payload?.data || payload || {});
    const [yearStr, monthStr] = billingMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month0 = parseInt(monthStr, 10) - 1;
    const key = { year, month: month0 };

    const accessToken = await getGraphToken();

    const base44 = createClientFromRequest(req);

    let financialRecords: any[] = [];
    try { financialRecords = await base44.asServiceRole.entities.FinancialRecord.list('-date', 5000) || []; }
    catch { financialRecords = []; }

    const expected = computeMonthEmploymentSupportsTotal(financialRecords, year, month0);

    const files = await listCrtFiles(accessToken);
    if (!files.length) {
      return Response.json({ status: 'no_workbook', message: 'No CRT workbooks found in SharePoint.', expected, billingMonth });
    }

    // Skip closed (frozen) workbooks — they are no longer synced.
    let closedNames = new Set();
    try {
      const closed = await base44.asServiceRole.entities.CrtWorkbook.filter({ status: 'closed' });
      closedNames = new Set(closed.map(r => r.file_name));
    } catch { /* default: nothing closed */ }

    // Target every open workbook whose month is on or after the billing month
    // (each carries the cumulative row for this billing month). Always include
    // the active workbook even if it somehow wasn't listed.
    const active = await getActiveCrtWorkbook(accessToken);
    const targets = files.filter(f => {
      if (closedNames.has(f.name)) return false;
      const me = crtMonthEnd(f.name);
      if (!me) return false;
      return (me.getUTCFullYear() > key.year) ||
             (me.getUTCFullYear() === key.year && me.getUTCMonth() >= key.month);
    }).sort((a, b) => crtMonthEnd(a.name).getTime() - crtMonthEnd(b.name).getTime());
    if (active && !targets.some(t => t.id === active.id)) targets.push(active);

    let primary = null;
    const workbooks: any[] = [];
    for (const wb of targets) {
      try {
        const sheetName = await findInvoiceTrackerSheet(accessToken, wb.id);
        if (!sheetName) { workbooks.push({ workbook: wb.name, status: 'no_sheet' }); continue; }
        const { values, startRow } = await readInvoiceTracker(accessToken, wb.id, sheetName);
        const { rowFound, written, skipped } = await writeMonthlyRunningTotal(accessToken, wb.id, sheetName, values, startRow, COL_CI, year, month0, expected);
        const r = { workbook: wb.name, status: rowFound < 0 ? 'no_row' : 'success', row: rowFound, written, skipped };
        workbooks.push(r);
        if (active && wb.id === active.id) primary = r;
      } catch (e) {
        workbooks.push({ workbook: wb.name, status: 'error', error: String(e.message || e).slice(0, 200) });
      }
    }

    return Response.json({
      status: primary?.status || (workbooks.some(w => w.status === 'success') ? 'success' : 'no_row'),
      workbook: active?.name,
      billingMonth,
      expected,
      workbooks,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}