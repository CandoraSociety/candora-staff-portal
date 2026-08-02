import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, getGraphToken, getActiveCrtWorkbook
} from '../../shared/crtWorkbook.ts';

// Read-only diagnostic: returns the header rows (rows 11-14) and the first
// data row (row 15) of the Client Data sheet from the active CRT workbook,
// so the portal-side column mapping can be verified against the real headers.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = await getGraphToken();
    const wb = await getActiveCrtWorkbook(accessToken);
    if (!wb) return Response.json({ error: 'No active CRT workbook found' }, { status: 404 });

    // List ALL worksheets so it's unambiguous which sheet 'Client Data' is
    const sheetsRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${wb.id}/workbook/worksheets`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const sheetsData = sheetsRes.ok ? await sheetsRes.json() : { value: [] };
    const worksheetNames = (sheetsData.value || []).map(s => s.name);

    const rangeRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${wb.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!rangeRes.ok) {
      return Response.json({ error: 'Failed to read sheet', details: await rangeRes.text() }, { status: 500 });
    }
    const rangeData = await rangeRes.json();
    const values = rangeData.values || [];

    // Column letter helper for readability
    const colLetter = (i) => String.fromCharCode(65 + i);

    // Build a column-by-column view from the header row immediately above the
    // data (row 14, 1-based → index 13), falling back across rows 11-14.
    const headerRowIdx = 13;
    const headers = (values[headerRowIdx] || []).map((h, i) => ({
      column: colLetter(i),
      index: i,
      header: String(h ?? '').trim(),
    }));

    return Response.json({
      workbook: wb.name,
      worksheetQueried: CLIENT_DATA_SHEET,
      allWorksheets: worksheetNames,
      totalRows: values.length,
      // Rows 9-15 raw, so any multi-row header band is visible
      rawRows: values.slice(9, 15).map((r, i) => ({ excelRow: 10 + i, cells: r })),
      headers, // parsed from row 14
      firstDataRow: values[14] ? { excelRow: 15, cells: values[14] } : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}