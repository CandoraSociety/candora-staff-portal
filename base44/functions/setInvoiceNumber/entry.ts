import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';
import { findInvoiceTrackerSheet, readInvoiceTracker, findMonthRow, billingMonthToKey, writeTrackerCell } from '../../shared/invoiceTracker.ts';

// Manually sets the invoice number for one billing month: writes the value to
// column B of that month's row on the active CRT's Invoice Tracker sheet —
// the cell the auto-generated invoice reads its number from — so the number
// on the invoice and the CRT stay in sync.

const INVOICE_NUMBER_COL = 'B';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const { billingMonth, invoiceNumber } = payload || {};
    if (!billingMonth) return Response.json({ error: 'billingMonth is required' }, { status: 400 });
    const numStr = String(invoiceNumber ?? '').trim();
    if (!numStr) return Response.json({ error: 'invoiceNumber is required' }, { status: 400 });

    const accessToken = await getGraphToken();
    const wb = await getActiveCrtWorkbook(accessToken);
    if (!wb) return Response.json({ status: 'no_workbook', billingMonth });

    const sheetName = await findInvoiceTrackerSheet(accessToken, wb.id);
    if (!sheetName) return Response.json({ status: 'no_sheet', workbook: wb.name, billingMonth });

    const { values, startRow } = await readInvoiceTracker(accessToken, wb.id, sheetName);
    const key = billingMonthToKey(billingMonth);
    if (!key) return Response.json({ status: 'invalid_month', billingMonth });

    const rowNumber = findMonthRow(values, key, startRow);
    if (!rowNumber) return Response.json({ status: 'month_not_found', billingMonth, workbook: wb.name });

    // Numeric values are written as numbers with a General format so fractional
    // resubmission numbers (e.g. 11.3) display exactly; anything else goes in
    // as text.
    const asNum = Number(numStr);
    const isNumeric = !isNaN(asNum);
    const value = isNumeric ? asNum : numStr;
    await writeTrackerCell(accessToken, wb.id, sheetName, INVOICE_NUMBER_COL, rowNumber, value, isNumeric ? 'General' : '@');

    return Response.json({ status: 'success', workbook: wb.name, sheet: sheetName, billingMonth, row: rowNumber, cell: `${INVOICE_NUMBER_COL}${rowNumber}`, value });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}