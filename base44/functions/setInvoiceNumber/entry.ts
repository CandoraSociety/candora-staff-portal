import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';
import { findInvoiceTrackerSheet, readInvoiceTracker, findMonthRow, billingMonthToKey, writeTrackerCell, colIndex, cellToMonthKey } from '../../shared/invoiceTracker.ts';

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

    // The invoice numbers run sequentially down the tracker, so a manual change
    // shifts every LATER month by the same amount the changed month moved —
    // each subsequent row keeps its offset from this one (including any
    // resubmission suffix), just shifted by the delta.
    const idxB = colIndex(INVOICE_NUMBER_COL);
    const targetRow = values[rowNumber - startRow] || [];
    const oldRaw = targetRow[idxB];
    const oldNum = oldRaw != null && oldRaw !== '' && !isNaN(Number(oldRaw)) ? Number(oldRaw) : null;
    const delta = isNumeric && oldNum != null ? Math.floor(asNum) - Math.floor(oldNum) : 0;

    const renumbered = [];
    if (delta !== 0) {
      for (let r = 0; r < values.length; r++) {
        const rowVals = values[r];
        if (!rowVals) continue;
        const rk = cellToMonthKey(rowVals[0]);
        if (!rk) continue;
        const isLater = rk.year > key.year || (rk.year === key.year && rk.month > key.month);
        if (!isLater) continue;
        const cur = rowVals[idxB];
        if (cur == null || cur === '' || isNaN(Number(cur))) continue; // unassigned rows stay blank
        const nextVal = Number(cur) + delta;
        await writeTrackerCell(accessToken, wb.id, sheetName, INVOICE_NUMBER_COL, startRow + r, nextVal, 'General');
        renumbered.push({ billingMonth: `${rk.year}-${String(rk.month + 1).padStart(2, '0')}`, value: nextVal });
      }
    }

    await writeTrackerCell(accessToken, wb.id, sheetName, INVOICE_NUMBER_COL, rowNumber, value, isNumeric ? 'General' : '@');

    // Keep the Invoice record for the changed month in sync too (the dialog
    // updates it when it has the id; this covers every other view) — best-effort.
    try {
      const recs = await base44.entities.Invoice.filter({ billing_month: billingMonth });
      for (const rec of (recs || [])) {
        if (!rec.billing_month_end || rec.billing_month_end === rec.billing_month) {
          await base44.entities.Invoice.update(rec.id, { invoice_number: numStr });
        }
      }
    } catch { /* record sync is best-effort */ }

    // Keep the Invoice records for renumbered months in sync so closed-off
    // snapshots show the updated numbers too (best-effort).
    for (const rn of renumbered) {
      try {
        const recs = await base44.entities.Invoice.filter({ billing_month: rn.billingMonth });
        for (const rec of (recs || [])) {
          if (!rec.billing_month_end || rec.billing_month_end === rec.billing_month) {
            await base44.entities.Invoice.update(rec.id, { invoice_number: String(rn.value) });
          }
        }
      } catch { /* record sync is best-effort */ }
    }

    return Response.json({ status: 'success', workbook: wb.name, sheet: sheetName, billingMonth, row: rowNumber, cell: `${INVOICE_NUMBER_COL}${rowNumber}`, value, renumbered });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}