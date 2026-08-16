import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';
import {
  findInvoiceTrackerSheet, readInvoiceTracker, trackerMonthFromPayload, writeMonthlyRunningTotal
} from '../../shared/invoiceTracker.ts';
import { computeMonthExposureCourseTotals } from '../../shared/crtBillingCounts.ts';
import { writeDeliverablesMonthlyCells } from '../../shared/deliverablesSheet.ts';

// Deliverables-sheet row that holds the exposure-course COSTS for a month —
// kept equal to the sum of Invoice-Tracker CF + CG (the dea + wd totals below).
const EXPOSURE_COURSE_COSTS_ROW = 17;

// Writes the cumulative running dollar total of all exposure-course
// purchases for a given billing month into the Invoice Tracker sheet inside
// the active CRT workbook, SPLIT by the client's program:
//   column CF = Exposure Courses for DEA clients (service_type 'direct_to_employment')
//   column CG = Exposure Courses for WD clients  (service_type 'pathways')
// The total EXCLUDES tax (only the reimbursable `amount` is summed).
// Idempotent — recomputes the full month total each call, so additional
// purchases accumulate into CF / CG. Triggered from the purchase-request
// determination flow on exposure-course approval.

const COL_CF = 'CF'; // Exposure Courses (DEA)
const COL_CG = 'CG'; // Exposure Courses (WD)

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
    let clients: any[] = [];
    try { clients = await base44.asServiceRole.entities.Client.list('-created_date', 5000) || []; }
    catch { clients = []; }

    const { dea, wd } = computeMonthExposureCourseTotals(financialRecords, clients, year, month0);
    const cfRes = await writeMonthlyRunningTotal(accessToken, workbook.id, sheetName, values, startRow, COL_CF, year, month0, dea);
    const cgRes = await writeMonthlyRunningTotal(accessToken, workbook.id, sheetName, values, startRow, COL_CG, year, month0, wd);

    // Refresh Deliverables row 17 (Exposure Courses - Costs) = CF + CG for this month.
    let costRow17: any = null;
    try {
      costRow17 = await writeDeliverablesMonthlyCells(accessToken, workbook.id, year, month0, [
        { row: EXPOSURE_COURSE_COSTS_ROW, value: dea + wd },
      ]);
    } catch (e) {
      costRow17 = { error: String(e.message || e) };
    }

    return Response.json({
      status: cfRes.rowFound < 0 && cgRes.rowFound < 0 ? 'no_row' : 'success',
      workbook: workbook.name,
      sheet: sheetName,
      billingMonth,
      dea, wd,
      cf: cfRes, cg: cgRes,
      costRow17,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}