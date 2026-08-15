import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook, DRIVE_ID } from '../../shared/crtWorkbook.ts';
import { findInvoiceTrackerSheet, readInvoiceTracker, findMonthRow, billingMonthToKey, writeTrackerCell } from '../../shared/invoiceTracker.ts';

// Manually writes one or more Invoice Tracker cells for the row whose month
// matches the package's billing month, inside the active CRT workbook. After
// all writes a full workbook recalculation is requested so dependent formula
// columns refresh before the invoice is re-read by getMonthlyInvoiceData.
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
    const wb = await getActiveCrtWorkbook(accessToken);
    if (!wb) return Response.json({ status: 'no_workbook' });

    const sheetName = await findInvoiceTrackerSheet(accessToken, wb.id);
    if (!sheetName) return Response.json({ status: 'no_sheet', workbook: wb.name });

    const { values, startRow } = await readInvoiceTracker(accessToken, wb.id, sheetName);
    const key = billingMonthToKey(billingMonth);
    if (!key) return Response.json({ status: 'invalid_month', billingMonth });

    const row = findMonthRow(values, key, startRow);
    if (!row) return Response.json({ status: 'month_not_found', billingMonth, workbook: wb.name });

    const written: any[] = [];
    for (const a of list) {
      const col = String(a.colLetter).toUpperCase();
      const cellValue = parseValue(a.value);
      await writeTrackerCell(accessToken, wb.id, sheetName, col, row, cellValue);
      written.push({ colLetter: col, value: cellValue });
    }

    // Force a full recalc so formula cells reflect the new values before the
    // invoice is re-read.
    try {
      await fetch(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${wb.id}/workbook/application/calculate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ calculationType: 'Full' })
      });
    } catch { /* recalc best-effort */ }

    return Response.json({
      status: 'success',
      workbook: wb.name,
      sheet: sheetName,
      billingMonth,
      row,
      written,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}