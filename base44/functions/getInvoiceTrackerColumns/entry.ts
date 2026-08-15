import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';
import { findInvoiceTrackerSheet, readInvoiceTracker, cellToMonthKey } from '../../shared/invoiceTracker.ts';

// Returns the billing-relevant columns of the active CRT workbook's Invoice
// Tracker sheet (curated, with clean labels + column letters) plus the dynamic
// list of month rows (excelRow + "YYYY-MM") so the billing UI can target a
// specific month. The column letters match those written by the existing
// tracker automations (advanceInvoiceTracker, syncChildminding…, etc.), so a
// manual write lands in the same place the automations read from.

const COLUMNS = [
  { colLetter: 'A',  label: 'Month' },
  { colLetter: 'B',  label: 'Invoice Number' },
  { colLetter: 'D',  label: 'Fixed Fee Marker (1 = filed)' },
  { colLetter: 'L',  label: 'CEIS (DEA) Starters — Qty' },
  { colLetter: 'M',  label: 'CEIS (DEA) Starters — Amount (formula)' },
  { colLetter: 'X',  label: 'WD Complete — Qty' },
  { colLetter: 'Y',  label: 'WD Complete — Amount (formula)' },
  { colLetter: 'AN', label: 'WD Placement (EDA Completion) — Qty' },
  { colLetter: 'AO', label: 'WD Placement (EDA Completion) — Amount (formula)' },
  { colLetter: 'BH', label: 'CEIS (DEA) 90 Day — Qty' },
  { colLetter: 'BI', label: 'CEIS (DEA) 90 Day — Amount (formula)' },
  { colLetter: 'BL', label: 'WD 90 Day — Qty' },
  { colLetter: 'BM', label: 'WD 90 Day — Amount (formula)' },
  { colLetter: 'CD', label: 'Service Navigation Fee — Qty' },
  { colLetter: 'CE', label: 'Service Navigation Fee — Amount (formula)' },
  { colLetter: 'CF', label: 'Exposure Courses — DEA (Reimbursement)' },
  { colLetter: 'CG', label: 'Exposure Courses — WD (Reimbursement)' },
  { colLetter: 'CH', label: 'Childminding' },
  { colLetter: 'CI', label: 'Employment Supports (Reimbursement)' },
  { colLetter: 'CJ', label: 'Paid Work Exposure (Reimbursement)' },
];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = await getGraphToken();
    const wb = await getActiveCrtWorkbook(accessToken);
    if (!wb) return Response.json({ status: 'no_workbook', columns: COLUMNS, monthRows: [] });

    const sheetName = await findInvoiceTrackerSheet(accessToken, wb.id);
    if (!sheetName) return Response.json({ status: 'no_sheet', workbook: wb.name, columns: COLUMNS, monthRows: [] });

    const { values, startRow } = await readInvoiceTracker(accessToken, wb.id, sheetName);

    const monthRows: any[] = [];
    for (let r = 0; r < (values || []).length; r++) {
      const k = cellToMonthKey(values[r]?.[0]);
      if (k) monthRows.push({ excelRow: startRow + r, monthLabel: `${k.year}-${String(k.month + 1).padStart(2, '0')}` });
    }

    return Response.json({ status: 'success', workbook: wb.name, sheet: sheetName, columns: COLUMNS, monthRows });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}