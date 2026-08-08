import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';
import {
  findInvoiceTrackerSheet, readInvoiceTracker, trackerMonthFromPayload, writeMonthlyRunningTotal
} from '../../shared/invoiceTracker.ts';
import { computeMonthEmploymentSupportsTotal } from '../../shared/crtBillingCounts.ts';

// Writes the cumulative running dollar total of all employment-supports
// purchases for a given billing month into column CI of the Invoice Tracker
// sheet inside the active CRT workbook. The total EXCLUDES tax (only the
// reimbursable `amount` is summed). Idempotent — recomputes the full month
// total each call, so additional purchases accumulate into the CI column.
// Triggered from the purchase-request determination flow on approval.

const COL_CI = 'CI';

export default async function(req: Request): Promise<Response> {
  try {
    let payload: any = {};
    try { payload = await req.json(); } catch {}
    const billingMonth = trackerMonthFromPayload(payload?.data || payload || {});
    const [yearStr, monthStr] = billingMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month0 = parseInt(monthStr, 10) - 1;

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

    const base44 = createClientFromRequest(req);
    let financialRecords: any[] = [];
    try { financialRecords = await base44.asServiceRole.entities.FinancialRecord.list('-date', 5000) || []; }
    catch { financialRecords = []; }

    const expected = computeMonthEmploymentSupportsTotal(financialRecords, year, month0);
    const { rowFound, written, skipped } = await writeMonthlyRunningTotal(accessToken, workbook.id, sheetName, values, startRow, COL_CI, year, month0, expected);

    return Response.json({
      status: rowFound < 0 ? 'no_row' : 'success',
      workbook: workbook.name,
      sheet: sheetName,
      billingMonth,
      expected,
      row: rowFound,
      written,
      skipped,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}