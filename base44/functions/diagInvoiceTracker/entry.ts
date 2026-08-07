import { getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';
import { findInvoiceTrackerSheet, readInvoiceTracker } from '../../shared/invoiceTracker.ts';

// Diagnostic: dump the Invoice Tracker sheet's used range so we can see the
// header row and column D values for every month row. Returns column A (month
// label), column B, column C, column D for all rows.
export default async function(req: Request): Promise<Response> {
  try {
    const accessToken = await getGraphToken();
    const workbook = await getActiveCrtWorkbook(accessToken);
    if (!workbook) return Response.json({ status: 'no_workbook' });
    const sheetName = await findInvoiceTrackerSheet(accessToken, workbook.id);
    if (!sheetName) return Response.json({ status: 'no_sheet', workbook: workbook.name });
    const { values, startRow } = await readInvoiceTracker(accessToken, workbook.id, sheetName);

    // Focus: month rows (where col A is a date serial) + header context.
    const monthRows = (values || []).map((row, i) => {
      const a = row[0];
      const isSerial = typeof a === 'number' && a > 30000 && a < 80000;
      return isSerial ? { excelRow: startRow + i, A: a, D: row[3] ?? null, E: row[4] ?? null } : null;
    }).filter(Boolean);

    // Header rows 11-14 column D for context
    const headerCtx = (values || []).slice(10, 14).map((row, i) => ({
      excelRow: startRow + 10 + i, D: row[3] ?? null, E: row[4] ?? null
    }));

    return Response.json({
      status: 'success',
      workbook: workbook.name,
      sheet: sheetName,
      headerCtx,
      monthRowCount: monthRows.length,
      monthRows
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}