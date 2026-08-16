import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';
import { findInvoiceTrackerSheet, readInvoiceTracker, findMonthRow, colIndex } from '../../shared/invoiceTracker.ts';
import {
  DELIVERABLES_SHEET, colLetter, findDeliverablesColumn, readDeliverablesRange
} from '../../shared/deliverablesSheet.ts';
import { patchProtectedSheet } from '../../shared/crtDatePatch.ts';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const EMPLOYMENT_SUPPORTS_ROW = 12;        // "Employment Supports"
const EXPOSURE_COURSE_COSTS_ROW = 17;       // "Exposure Courses - Costs"
const EXPOSURE_COURSE_ATTENDED_ROW = 18;    // "Exposure Courses - # of clients attended"
const COL_CF = 'CF'; // Exposure Courses (DEA) — Invoice Tracker
const COL_CG = 'CG'; // Exposure Courses (WD)  — Invoice Tracker

function deriveBillingMonth(rec: any): string | null {
  if (rec?.billing_month) return String(rec.billing_month).slice(0, 7);
  const d = rec?.reimbursement_date || rec?.date;
  if (d) {
    const s = String(d).slice(0, 10);
    const dt = new Date(s.length === 10 ? s + 'T12:00:00' : s);
    if (!isNaN(dt.getTime())) return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  }
  return null;
}

// Triggered when a FinancialRecord (employment_supports or exposure_course) is
// marked reimbursed (paid). Increments the Deliverables-sheet running total:
//   employment_supports → row 12 (Employment Supports)
//   exposure_course     → row 18 (Exposure Courses - # of clients attended)
// For exposure courses, row 17 (Exposure Courses - Costs) is also refreshed to
// equal the sum of Invoice-Tracker columns CF + CG for that month.
//
// Entity-automation payload: { event, data, old_data, changed_fields }.
// Guard: only counts the false→true reimbursement transition (old_data.reimbursed
// was not already true), so re-saving an already-paid record won't double-count.

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* allow service role */ }

    let body: any = {};
    try { body = await req.json(); } catch { /* no body */ }
    const record: any = body?.data || body || {};
    const recordType = record.record_type;
    // Default delta is +1 (a new "marked as paid" transition). Pass a negative
    // delta to undo a recorded payment (e.g. reverting a test, or an un-reimburse).
    const delta = body?.delta != null ? Number(body.delta) : 1;

    if (recordType !== 'employment_supports' && recordType !== 'exposure_course') {
      return Response.json({ status: 'ignored', message: `record_type '${recordType}' not handled` });
    }
    // Only count the false→true transition; skip if the record was already reimbursed.
    if (delta > 0 && body?.old_data && body.old_data.reimbursed === true) {
      return Response.json({ status: 'already_counted', message: 'record was already reimbursed — no increment' });
    }

    const billingMonth = deriveBillingMonth(record);
    if (!billingMonth) return Response.json({ error: 'billing_month could not be determined' }, { status: 400 });
    const [yStr, mStr] = billingMonth.split('-');
    const year = parseInt(yStr, 10);
    const month0 = parseInt(mStr, 10) - 1;
    if (isNaN(year) || isNaN(month0) || month0 < 0 || month0 > 11) {
      return Response.json({ error: 'invalid billing_month' }, { status: 400 });
    }

    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);
    const fileName = `CRT_${MONTHS[month0]}_${year}.xlsx`;
    const file = (files || []).find(f => f.name === fileName);
    if (!file) {
      return Response.json({ status: 'no_workbook', message: `${fileName} not found — deliverables not updated.` });
    }

    // Locate the Deliverables column for this month.
    const values = await readDeliverablesRange(accessToken, file.id);
    const colIdx = findDeliverablesColumn(values, year, month0);
    if (colIdx < 0) {
      return Response.json({ status: 'column_not_found', message: `No Deliverables column for ${MONTHS[month0]} ${year}.`, workbook: file.name });
    }
    const colL = colLetter(colIdx);
    const readNum = (row1: number): number => {
      const row = values[row1 - 1];
      if (!row) return 0;
      const v = row[colIdx];
      if (v == null || v === '') return 0;
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    };

    const patches: { cell: string; value: number }[] = [];
    const targetRow = recordType === 'employment_supports' ? EMPLOYMENT_SUPPORTS_ROW : EXPOSURE_COURSE_ATTENDED_ROW;
    const newCount = Math.max(0, readNum(targetRow) + delta);
    if (readNum(targetRow) !== newCount) {
      patches.push({ cell: `${colL}${targetRow}`, value: newCount });
    }

    // For exposure courses, refresh row 17 (costs) = CF + CG from the Invoice Tracker.
    let costTotal: number | null = null;
    if (recordType === 'exposure_course') {
      const sheetName = await findInvoiceTrackerSheet(accessToken, file.id);
      if (sheetName) {
        const { values: tVals, startRow } = await readInvoiceTracker(accessToken, file.id, sheetName);
        const tRow = findMonthRow(tVals, { year, month: month0 }, startRow);
        if (tRow) {
          const cellVal = (idx: number): number => {
            const row = tVals[tRow - startRow];
            if (!row) return 0;
            const v = row[idx];
            if (v == null || v === '') return 0;
            const n = Number(v);
            return isNaN(n) ? 0 : n;
          };
          costTotal = cellVal(colIndex(COL_CF)) + cellVal(colIndex(COL_CG));
          if (costTotal != null && readNum(EXPOSURE_COURSE_COSTS_ROW) !== costTotal) {
            patches.push({ cell: `${colL}${EXPOSURE_COURSE_COSTS_ROW}`, value: costTotal });
          }
        }
      }
    }

    if (patches.length) {
      await patchProtectedSheet(accessToken, file.id, DELIVERABLES_SHEET, patches);
    }

    return Response.json({
      status: 'success',
      workbook: file.name,
      billingMonth,
      recordType,
      column: colL,
      countRow: targetRow,
      newCount,
      costTotal,
      patches: patches.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}