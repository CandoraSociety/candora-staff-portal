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
  { colLetter: 'A',  label: 'Month',                                          short: 'Month' },
  { colLetter: 'B',  label: 'Invoice Number',                                  short: 'Inv #' },
  { colLetter: 'D',  label: 'Fixed Fee Marker (1 = filed)',                    short: 'Fixed' },
  { colLetter: 'L',  label: 'CEIS (DEA) Starters — Qty',                       short: 'DEA Start' },
  { colLetter: 'M',  label: 'CEIS (DEA) Starters — Amount (formula)',          short: 'DEA $' },
  { colLetter: 'X',  label: 'WD Complete — Qty',                                short: 'WD Comp' },
  { colLetter: 'Y',  label: 'WD Complete — Amount (formula)',                  short: 'WD $' },
  { colLetter: 'AN', label: 'WD Placement (EDA Completion) — Qty',             short: 'WD Place' },
  { colLetter: 'AO', label: 'WD Placement (EDA Completion) — Amount (formula)', short: 'WD Place $' },
  { colLetter: 'BH', label: 'CEIS (DEA) 90 Day — Qty',                          short: 'DEA 90' },
  { colLetter: 'BI', label: 'CEIS (DEA) 90 Day — Amount (formula)',             short: 'DEA 90 $' },
  { colLetter: 'BL', label: 'WD 90 Day — Qty',                                 short: 'WD 90' },
  { colLetter: 'BM', label: 'WD 90 Day — Amount (formula)',                    short: 'WD 90 $' },
  { colLetter: 'CD', label: 'Service Navigation Fee — Qty',                   short: 'Svc Nav' },
  { colLetter: 'CE', label: 'Service Navigation Fee — Amount (formula)',       short: 'Svc Nav $' },
  { colLetter: 'CF', label: 'Exposure Courses — DEA (Reimbursement)',          short: 'Exp DEA' },
  { colLetter: 'CG', label: 'Exposure Courses — WD (Reimbursement)',           short: 'Exp WD' },
  { colLetter: 'CH', label: 'Childminding',                                    short: 'Child' },
  { colLetter: 'CI', label: 'Employment Supports (Reimbursement)',             short: 'Emp Sup' },
  { colLetter: 'CJ', label: 'Paid Work Exposure (Reimbursement)',              short: 'Work Exp' },
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