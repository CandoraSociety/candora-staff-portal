import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW, getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';

// Read-only diagnostic: scan ALL CRT workbooks (open + closed) and return the
// raw key-column values for rows matching the given HSIDs (exact) or name
// substrings (case-insensitive). Used to inspect exactly what the CRT holds
// for clients the portal mis-imported.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const hsids = new Set((payload.hsids || []).map(h => String(h).trim()));
    const nameParts = (payload.names || []).map(n => String(n).toLowerCase().trim());

    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);
    const matches = [];

    for (const f of files) {
      let rangeRes;
      try {
        rangeRes = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      } catch { continue; }
      if (!rangeRes.ok) continue;
      const data = await rangeRes.json();
      const values = data.values || [];
      for (let i = CLIENT_DATA_START_ROW - 1; i < values.length; i++) {
        const row = values[i];
        if (!row || !row[0] || !String(row[0]).trim()) continue;
        const hsid = String(row[1] || '').trim();
        const name = String(row[0] || '').trim();
        const nameLower = name.toLowerCase();
        const byHsid = hsid && hsids.has(hsid);
        const byName = nameParts.some(p => p && nameLower.includes(p));
        if (byHsid || byName) {
          matches.push({
            sourceFile: f.name,
            name, hsid,
            ceis_flag: String(row[2] || '').trim(),
            dea_start_date: String(row[3] || '').trim(),
            service_element: String(row[4] || '').trim(),
            service_start_date: String(row[5] || '').trim(),
            service_outcome: String(row[6] || '').trim(),
          });
        }
      }
    }

    return Response.json({ filesScanned: files.length, matches });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}