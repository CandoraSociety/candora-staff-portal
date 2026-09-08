import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';
import { findInvoiceTrackerSheet, readInvoiceTracker, findMonthRow, billingMonthToKey, writeTrackerCell, colIndex, cellToMonthKey } from '../../shared/invoiceTracker.ts';

// Manually sets the invoice number for one billing month across EVERY CRT
// workbook version: writes the value to column B of that month's row on the
// Invoice Tracker sheet of the active CRT AND every archived CRT copy that
// still has a row for that month. The invoice numbers run sequentially, so a
// manual change also shifts every LATER month row by the same amount the
// changed month moved (in each version), keeping the sequence intact.

const INVOICE_NUMBER_COL = 'B';

// Write the target value + shift every later month row by `delta` in one
// workbook's Invoice Tracker. Returns null when the workbook has no tracker
// sheet or no row for the month. Throws on write failures (the caller decides
// whether to continue with the other workbooks).
async function applyToWorkbook(accessToken, file, key, value, isNumeric, delta, idxB) {
  const sheetName = await findInvoiceTrackerSheet(accessToken, file.id);
  if (!sheetName) return null;
  const { values, startRow } = await readInvoiceTracker(accessToken, file.id, sheetName);
  const rowNumber = findMonthRow(values, key, startRow);
  if (!rowNumber) return null;

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
      await writeTrackerCell(accessToken, file.id, sheetName, INVOICE_NUMBER_COL, startRow + r, nextVal, 'General');
      renumbered.push({ billingMonth: `${rk.year}-${String(rk.month + 1).padStart(2, '0')}`, value: nextVal });
    }
  }

  await writeTrackerCell(accessToken, file.id, sheetName, INVOICE_NUMBER_COL, rowNumber, value, isNumeric ? 'General' : '@');
  return { sheetName, rowNumber, renumbered };
}

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
    const files = await listCrtFiles(accessToken); // sorted latest-first; files[0] = active
    if (!files.length) return Response.json({ status: 'no_workbook', billingMonth });

    const key = billingMonthToKey(billingMonth);
    if (!key) return Response.json({ status: 'invalid_month', billingMonth });

    // Numeric values are written as numbers with a General format so fractional
    // resubmission numbers (e.g. 13.4) display exactly; anything else goes in
    // as text.
    const asNum = Number(numStr);
    const isNumeric = !isNaN(asNum);
    const value = isNumeric ? asNum : numStr;
    const idxB = colIndex(INVOICE_NUMBER_COL);

    // Active workbook first: the month row must exist there, and its current
    // value defines how far the number moved (the ripple delta).
    const active = files[0];
    let activeSheetName: string | null = null;
    try { activeSheetName = await findInvoiceTrackerSheet(accessToken, active.id); } catch { /* none */ }
    if (!activeSheetName) return Response.json({ status: 'no_sheet', workbook: active.name, billingMonth });
    const { values, startRow } = await readInvoiceTracker(accessToken, active.id, activeSheetName);
    const activeRow = findMonthRow(values, key, startRow);
    if (!activeRow) return Response.json({ status: 'month_not_found', billingMonth, workbook: active.name });
    const oldRaw = (values[activeRow - startRow] || [])[idxB];
    const oldNum = oldRaw != null && oldRaw !== '' && !isNaN(Number(oldRaw)) ? Number(oldRaw) : null;
    const delta = isNumeric && oldNum != null ? Math.floor(asNum) - Math.floor(oldNum) : 0;

    // Apply to every CRT version — active first, then each archived copy that
    // still has a row for the month. One workbook failing never stops the rest.
    let renumbered: any[] = [];
    let rowNumber = activeRow;
    const updated: string[] = [];
    const failed: any[] = [];
    for (const file of files) {
      try {
        const res = await applyToWorkbook(accessToken, file, key, value, isNumeric, delta, idxB);
        if (!res) continue; // no tracker sheet / no row for this month in this version
        updated.push(file.name);
        if (file.id === active.id) {
          rowNumber = res.rowNumber;
          renumbered = res.renumbered;
        }
      } catch (e: any) {
        failed.push({ workbook: file.name, error: e.message });
      }
    }

    if (!updated.length) {
      return Response.json({ status: 'error', message: 'No CRT workbook could be updated', failed }, { status: 500 });
    }

    // Keep the Invoice record for the changed month in sync (the dialog
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

    return Response.json({
      status: 'success',
      workbook: active.name,
      billingMonth,
      row: rowNumber,
      cell: `${INVOICE_NUMBER_COL}${rowNumber}`,
      value,
      workbooksUpdated: updated,
      failedWorkbooks: failed,
      renumbered,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}