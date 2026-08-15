import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook, DRIVE_ID } from '../../shared/crtWorkbook.ts';
import { findInvoiceTrackerSheet, readInvoiceTracker, findMonthRow, billingMonthToKey, writeTrackerCell } from '../../shared/invoiceTracker.ts';

// Manually writes a value into a single Invoice Tracker cell — the chosen
// column letter + the row whose month label matches the package's billing
// month — inside the active CRT workbook. After the write a full workbook
// recalculation is requested so dependent formula columns (the dollar-amount
// columns next to each quantity heading) refresh before the invoice is
// re-read by getMonthlyInvoiceData.
//
// Numeric input is parsed to a number; everything else is written as text.

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

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const { billingMonth, colLetter, value } = payload || {};
    if (!billingMonth || !colLetter) {
      return Response.json({ error: 'billingMonth and colLetter are required' }, { status: 400 });
    }

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

    const cellValue = parseValue(value);
    await writeTrackerCell(accessToken, wb.id, sheetName, String(colLetter).toUpperCase(), row, cellValue);

    // Force a full recalc so formula cells (e.g. the amount columns M/Y/AO/…)
    // reflect the new quantity/value before the invoice is re-read.
    try {
      await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${wb.id}/workbook/application/calculate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ calculationType: 'Full' })
      });
    } catch { /* recalc best-effort — reads may still return updated values */ }

    return Response.json({
      status: 'success',
      workbook: wb.name,
      sheet: sheetName,
      billingMonth,
      row,
      colLetter: String(colLetter).toUpperCase(),
      written: cellValue,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}