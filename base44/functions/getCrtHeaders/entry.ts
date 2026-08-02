import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, getGraphToken, getActiveCrtWorkbook
} from '../../shared/crtWorkbook.ts';

// Reads the actual Client Data header rows (row 11 + row 12) of the ACTIVE
// CRT workbook, cell-by-cell across columns A–Y, and reports each column's
// letter + value. Used to settle whether 30/60/180-day columns exist (even
// if hidden) vs. the visible headers the staff see in Excel.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = await getGraphToken();
    const wb = await getActiveCrtWorkbook(accessToken);
    if (!wb) return Response.json({ error: 'No active workbook' }, { status: 404 });

    const rangeRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${wb.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='A11:Y12')`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!rangeRes.ok) {
      return Response.json({ error: 'range read failed: ' + await rangeRes.text() }, { status: 502 });
    }
    const rangeData = await rangeRes.json();
    const values = rangeData.values || [];
    const row11 = values[0] || [];
    const row12 = values[1] || [];
    const letters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y'];
    const cols = letters.map((L, i) => ({
      column: L,
      headerRow11: row11[i] ?? '',
      subHeaderRow12: row12[i] ?? '',
    }));

    return Response.json({ file: wb.name, headerRow: 11, subHeaderRow: 12, columns: cols });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}