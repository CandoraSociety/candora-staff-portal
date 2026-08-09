import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_ID, CLIENT_DATA_SHEET, getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';
import { findInvoiceTrackerSheet, readInvoiceTracker, findMonthRow, billingMonthToKey } from '../../shared/invoiceTracker.ts';

// Reads everything needed to render a single month's auto-generated invoice
// from the ACTIVE CRT workbook:
//   • Client Data sheet A2:B6 (rows 2–6) — the org/contract header info.
//   • Invoice Tracker month row — invoice number (column C) + the six
//     deliverable line items (quantity column + adjacent formula-amount
//     column) and the five direct-cost reimbursement columns.
//
// Only the active (latest) workbook is read. Past months that have rolled over
// out of the active workbook return 'month_not_found' (the caller then falls
// back to the snapshot stored on the closed Invoice record). The invoice only
// ever contains the requested month's figures — no prior-month accumulation.

// Deliverables: quantity column (left) + dollar-amount column (right, a
// pre-built formula computing qty × unit price).
const DELIVERABLES = [
  { key: 'deaStarters', label: 'CEIS (DEA) Starters', qtyCol: 'L', amtCol: 'M' },
  { key: 'wdComplete', label: 'WD Complete', qtyCol: 'X', amtCol: 'Y' },
  { key: 'wdPlacementCompletion', label: 'WD Placement (EDA Completion)', qtyCol: 'AN', amtCol: 'AO' },
  { key: 'dea90Day', label: 'CEIS (DEA) 90 Day', qtyCol: 'BH', amtCol: 'BI' },
  { key: 'wd90Day', label: 'WD 90 Day', qtyCol: 'BL', amtCol: 'BM' },
  { key: 'serviceNavFee', label: 'Service Navigation Fee', qtyCol: 'CD', amtCol: 'CE' },
];
// Direct-cost reimbursements: dollar-only columns (no quantity / unit price).
const DIRECT_COSTS = [
  { key: 'employmentSupports', label: 'Employment Supports (Reimbursement)', amtCol: 'CI' },
  { key: 'exposureCourseDea', label: 'Exposure Courses — DEA (Reimbursement)', amtCol: 'CF' },
  { key: 'exposureCourseWd', label: 'Exposure Courses — WD (Reimbursement)', amtCol: 'CG' },
  { key: 'childminding', label: 'Childminding (Reimbursement)', amtCol: 'CH' },
  { key: 'paidWorkExposure', label: 'Paid Work Exposure (Reimbursement)', amtCol: 'CJ' },
];
const INVOICE_NUMBER_COL = 'B';
const FIXED_MONTHLY_FEE = 31755;

function colIndex(letter) {
  let n = 0;
  for (let i = 0; i < letter.length; i++) n = n * 26 + (letter.charCodeAt(i) - 64);
  return n - 1;
}

function currentMonthEdmonton() {
  const s = new Date().toLocaleString('en-US', { timeZone: 'America/Edmonton', month: '2-digit', year: 'numeric' });
  const [mon, yr] = s.split('/');
  return `${yr}-${mon}`;
}

function num(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const billingMonth = payload?.billingMonth || currentMonthEdmonton();

    const accessToken = await getGraphToken();
    const wb = await getActiveCrtWorkbook(accessToken);
    if (!wb) return Response.json({ status: 'no_workbook', billingMonth });

    // Header rows 2–6 of the Client Data sheet (columns A & B).
    let header = [];
    try {
      const r = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${wb.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='A2:B6')`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (r.ok) {
        const d = await r.json();
        const vals = d.values || [];
        header = vals
          .map((row) => ({ label: String(row[0] ?? '').trim(), value: String(row[1] ?? '').trim() }))
          .filter((x) => x.label || x.value);
      }
    } catch { /* header optional */ }

    const sheetName = await findInvoiceTrackerSheet(accessToken, wb.id);
    if (!sheetName) return Response.json({ status: 'no_sheet', workbook: wb.name, billingMonth, header });

    const { values, startRow } = await readInvoiceTracker(accessToken, wb.id, sheetName);
    const key = billingMonthToKey(billingMonth);
    if (!key) return Response.json({ status: 'invalid_month', billingMonth, header });

    const rowNumber = findMonthRow(values, key, startRow);
    if (!rowNumber) {
      // Current in-progress month whose row hasn't been added to the tracker yet:
      // still render the invoice with the fixed monthly fee and zeroed activity,
      // so the open month is always visible. Past/other months stay not_found.
      if (billingMonth === currentMonthEdmonton()) {
        const lineItems: any[] = [
          { key: 'fixedMonthlyFee', label: 'Fixed Monthly Fee', section: 'fixed', quantity: null, unitPrice: null, amount: FIXED_MONTHLY_FEE },
        ];
        for (const d of DELIVERABLES) {
          lineItems.push({ key: d.key, label: d.label, section: 'deliverable', quantity: 0, unitPrice: 0, amount: 0 });
        }
        for (const d of DIRECT_COSTS) {
          lineItems.push({ key: d.key, label: d.label, section: 'direct_cost', quantity: null, unitPrice: null, amount: 0 });
        }
        return Response.json({
          status: 'success',
          workbook: wb.name,
          sheet: sheetName,
          billingMonth,
          invoiceNumber: null,
          header,
          lineItems,
          subtotalDeliverables: 0,
          subtotalDirectCosts: 0,
          subtotalFixed: FIXED_MONTHLY_FEE,
          total: FIXED_MONTHLY_FEE,
        });
      }
      return Response.json({ status: 'month_not_found', workbook: wb.name, sheet: sheetName, billingMonth, header });
    }

    const row = values[rowNumber - startRow] || [];

    const invRaw = row[colIndex(INVOICE_NUMBER_COL)];
    const invoiceNumber = invRaw != null && invRaw !== '' && !isNaN(Number(invRaw)) ? Number(invRaw) : null;

    const lineItems = [];
    let subtotalDeliverables = 0;
    lineItems.push({ key: 'fixedMonthlyFee', label: 'Fixed Monthly Fee', section: 'fixed', quantity: null, unitPrice: null, amount: FIXED_MONTHLY_FEE });
    for (const d of DELIVERABLES) {
      const quantity = num(row[colIndex(d.qtyCol)]);
      const amount = num(row[colIndex(d.amtCol)]);
      const unitPrice = quantity > 0 ? Math.round((amount / quantity) * 100) / 100 : 0;
      subtotalDeliverables += amount;
      lineItems.push({ key: d.key, label: d.label, section: 'deliverable', quantity, unitPrice, amount });
    }
    let subtotalDirectCosts = 0;
    for (const d of DIRECT_COSTS) {
      const amount = num(row[colIndex(d.amtCol)]);
      subtotalDirectCosts += amount;
      lineItems.push({ key: d.key, label: d.label, section: 'direct_cost', quantity: null, unitPrice: null, amount });
    }

    return Response.json({
      status: 'success',
      workbook: wb.name,
      sheet: sheetName,
      billingMonth,
      invoiceNumber,
      header,
      lineItems,
      subtotalDeliverables: Math.round(subtotalDeliverables * 100) / 100,
      subtotalDirectCosts: Math.round(subtotalDirectCosts * 100) / 100,
      subtotalFixed: FIXED_MONTHLY_FEE,
      total: Math.round((FIXED_MONTHLY_FEE + subtotalDeliverables + subtotalDirectCosts) * 100) / 100,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}