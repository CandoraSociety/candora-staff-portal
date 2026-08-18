import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';
import {
  findInvoiceTrackerSheet, readInvoiceTracker, findMonthRow,
  billingMonthToKey, cellToMonthKey, writeTrackerCell
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

    const totals: Record<string, number> = {};
    for (const r of recs) {
      const bm = r.date ? String(r.date).slice(0, 7) : null;
      if (!bm) continue;
      totals[bm] = (totals[bm] || 0) + (Number(r.billing_amount) || 0);
    }

    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);
    if (!files || files.length === 0) {
      return Response.json({ status: 'no_workbook', message: 'No CRT workbooks found in SharePoint.' });
    }
    // Exclude closed/frozen workbooks so we only sync open months.
    let closedNames = new Set();
    try {
      const closed = await base44.asServiceRole.entities.CrtWorkbook.filter({ status: 'closed' });
      closedNames = new Set(closed.map(r => r.file_name));
    } catch { /* default: nothing closed */ }
    const openFiles = files.filter(f => !closedNames.has(f.name));

    if (months.length === 0) {
      return Response.json({ status: 'no_months', message: 'No childminding billing months to sync.' });
    }

    // Each open workbook has its own Invoice Tracker sheet. Push the matching
    // month's childminding total into every open workbook so prior months
    // (April, May, ...) stay in sync — not just the active (latest) one.
    const workbooks = [];
    for (const workbook of openFiles) {
      let sheetName: string;
      try {
        sheetName = await findInvoiceTrackerSheet(accessToken, workbook.id);
      } catch { continue; }
      if (!sheetName) { workbooks.push({ workbook: workbook.name, status: 'no_sheet' }); continue; }
      let read: any;
      try {
        read = await readInvoiceTracker(accessToken, workbook.id, sheetName);
      } catch (e) {
        workbooks.push({ workbook: workbook.name, status: 'read_error', error: String(e.message || e).slice(0, 200) });
        continue;
      }
      const { values, startRow } = read;

      const results = [];
      for (const bm of months) {
        const key = billingMonthToKey(bm);
        if (!key) { results.push({ month: bm, status: 'invalid_month' }); continue; }
        const row = findMonthRow(values, key, startRow);
        if (!row) { results.push({ month: bm, status: 'row_not_found' }); continue; }
        const total = Math.round((totals[bm] || 0) * 100) / 100;
        try {
          await writeTrackerCell(accessToken, workbook.id, sheetName, CHILDMINDING_COLUMN, row, total);
          results.push({ month: bm, status: 'synced', row, column: CHILDMINDING_COLUMN, total });
        } catch (e) {
          results.push({ month: bm, status: 'write_error', error: String(e.message || e).slice(0, 200) });
        }
      }
      workbooks.push({ workbook: workbook.name, sheet: sheetName, results });
    }

    return Response.json({ status: 'success', workbooks });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}