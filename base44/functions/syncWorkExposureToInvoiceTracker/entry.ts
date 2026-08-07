import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';
import {
  findInvoiceTrackerSheet, readInvoiceTracker, cellToMonthKey, writeTrackerCell
} from '../../shared/invoiceTracker.ts';
import { computeMonthWorkExposureTotal } from '../../shared/crtBillingCounts.ts';

// Writes the running dollar total of all paid work-exposure placements for a
// given billing month into column CJ of the Invoice Tracker sheet inside the
// active CRT workbook. Idempotent. Triggered manually (SDK, { billing_month })
// or automatically by the WorkExposureHoursSubmission entity automation
// (create/update/delete) — the event payload's data carries billing_month or
// period_end_date, from which the month is derived.

const COL_CJ = 'CJ';

function colIndex(letter: string): number {
  let n = 0;
  for (let i = 0; i < letter.length; i++) n = n * 26 + (letter.charCodeAt(i) - 64);
  return n - 1;
}

function monthFromPayload(data: any): string {
  if (data?.billing_month) return data.billing_month;
  if (data?.period_end_date) {
    const d = new Date(data.period_end_date.length === 10 ? data.period_end_date + 'T12:00:00' : data.period_end_date);
    if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default async function(req: Request): Promise<Response> {
  try {
    let payload: any = {};
    try { payload = await req.json(); } catch {}
    const billingMonth = monthFromPayload(payload?.data || payload || {});
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

    const expected = computeMonthWorkExposureTotal(financialRecords, year, month0);
    const cjIdx = colIndex(COL_CJ);

    let rowFound = -1;
    let written = false;
    let skipped = false;

    for (let r = 0; r < (values || []).length; r++) {
      const row = values[r];
      if (!row) continue;
      const key = cellToMonthKey(row[0]);
      if (!key) continue;
      if (key.year === year && key.month === month0) {
        rowFound = startRow + r;
        const existing = row[cjIdx];
        const existingNum = (existing == null || existing === '') ? 0 : Number(existing);
        if (existingNum === expected) {
          skipped = true;
        } else {
          await writeTrackerCell(accessToken, workbook.id, sheetName, COL_CJ, rowFound, expected);
          written = true;
        }
        break;
      }
    }

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