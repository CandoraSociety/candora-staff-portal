import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';
import {
  findInvoiceTrackerSheet, readInvoiceTracker, findMonthRow,
  billingMonthToKey, writeTrackerCell
} from '../../shared/invoiceTracker.ts';

// Column CH of the Invoice Tracker sheet holds the monthly childminding total.
const CHILDMINDING_COLUMN = 'CH';

// Sync the pathways childminding billing total for one or more billing months
// into column CH of the matching month row on the active CRT workbook's
// Invoice Tracker sheet. Each month row gets only that month's total (a May
// session never appears on April's row). Triggered three ways:
//   1. Manually via the SDK with { billingMonth } or {} (syncs all months).
//   2. Entity automation on ChildmindingRecord (create/update/delete) — the
//      affected record's date(s) drive which month(s) re-sync.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* entity automation — service role */ }

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }

    // Determine which billing months to sync.
    let months: string[] = [];
    if (payload?.billingMonth) {
      months = [String(payload.billingMonth)];
    } else if (payload?.event || payload?.data) {
      const dates = new Set<string>();
      const add = (rec) => { if (rec && rec.date) dates.add(String(rec.date).slice(0, 7)); };
      add(payload?.data);
      add(payload?.old_data);
      months = [...dates].filter(Boolean).sort();
    }

    // All pathways childminding records (modest dataset) — used to compute
    // per-month totals. billing_amount is pre-calculated (hours × $20) and is
    // 0 for non-pathways, so filtering to pathways matches the Supporting
    // Documents childminding section exactly.
    const allRecords = await base44.asServiceRole.entities.ChildmindingRecord.filter({ program: 'pathways' }, '-date', 1000);
    const recs = allRecords || [];

    if (months.length === 0) {
      months = [...new Set(recs.map(r => (r.date ? String(r.date).slice(0, 7) : null)).filter(Boolean))].sort();
    }
    if (months.length === 0) {
      return Response.json({ status: 'no_months', message: 'No childminding billing months to sync.' });
    }

    const totals: Record<string, number> = {};
    for (const r of recs) {
      const bm = r.date ? String(r.date).slice(0, 7) : null;
      if (!bm) continue;
      totals[bm] = (totals[bm] || 0) + (Number(r.billing_amount) || 0);
    }

    const accessToken = await getGraphToken();
    const workbook = await getActiveCrtWorkbook(accessToken);
    if (!workbook) {
      return Response.json({ status: 'no_workbook', message: 'No active CRT workbook found in SharePoint.' });
    }
    const sheetName = await findInvoiceTrackerSheet(accessToken, workbook.id);
    if (!sheetName) {
      return Response.json({ status: 'no_sheet', message: 'No Invoice Tracker sheet found in the active CRT workbook.', workbook: workbook.name });
    }
    const { values, startRow } = await readInvoiceTracker(accessToken, workbook.id, sheetName);

    const results = [];
    for (const bm of months) {
      const key = billingMonthToKey(bm);
      if (!key) { results.push({ month: bm, status: 'invalid_month' }); continue; }
      const row = findMonthRow(values, key, startRow);
      if (!row) { results.push({ month: bm, status: 'row_not_found' }); continue; }
      const total = Math.round((totals[bm] || 0) * 100) / 100;
      await writeTrackerCell(accessToken, workbook.id, sheetName, CHILDMINDING_COLUMN, row, total);
      results.push({ month: bm, status: 'synced', row, column: CHILDMINDING_COLUMN, total });
    }

    return Response.json({
      status: 'success',
      workbook: workbook.name,
      sheet: sheetName,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}