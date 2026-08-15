import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';
import { findInvoiceTrackerSheet, readInvoiceTracker, findMonthRow, billingMonthToKey } from '../../shared/invoiceTracker.ts';

// Reads the current value of every billing column for one month row on the
// active CRT's Invoice Tracker sheet, so the billing UI can pre-fill an
// editable row that mirrors the tracker.

const COLS = ['A','B','D','L','M','X','Y','AN','AO','BH','BI','BL','BM','CD','CE','CF','CG','CH','CI','CJ'];

function colIndex(letter: string): number {
  let n = 0;
  for (let i = 0; i < letter.length; i++) n = n * 26 + (letter.charCodeAt(i) - 64);
  return n - 1;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const { billingMonth } = payload || {};
    if (!billingMonth) return Response.json({ error: 'billingMonth is required' }, { status: 400 });

    const accessToken = await getGraphToken();
    const wb = await getActiveCrtWorkbook(accessToken);
    if (!wb) return Response.json({ status: 'no_workbook' });

    const sheetName = await findInvoiceTrackerSheet(accessToken, wb.id);
    if (!sheetName) return Response.json({ status: 'no_sheet', workbook: wb.name });

    const { values, startRow } = await readInvoiceTracker(accessToken, wb.id, sheetName);
    const key = billingMonthToKey(billingMonth);
    if (!key) return Response.json({ status: 'invalid_month', billingMonth });

    const row = findMonthRow(values, key, startRow);
    if (!row) return Response.json({ status: 'month_not_found', billingMonth, workbook: wb.name });

    const rowVals = values[row - startRow] || [];
    const valuesByCol: Record<string, any> = {};
    for (const c of COLS) {
      const v = rowVals[colIndex(c)];
      valuesByCol[c] = (v == null ? '' : v);
    }

    return Response.json({ status: 'success', workbook: wb.name, sheet: sheetName, billingMonth, row, valuesByCol });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}