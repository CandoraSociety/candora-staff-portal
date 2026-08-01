import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW,
  getGraphToken, listCrtFiles, parseCrtDate
} from '../../shared/crtWorkbook.ts';

// One-time backfill: scan every CRT workbook's Client Data sheet (open AND
// closed months) and, for each portal client that is missing a
// service_start_date, set it from the CRT. DEA start dates live in column D
// (index 3, "DEA Start Date"); WD start dates in column F (index 5,
// "Service Start Date"). The first non-empty date found across workbooks wins.
// Existing portal start dates are never overwritten.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);
    if (!files.length) return Response.json({ error: 'No CRT workbooks found' }, { status: 404 });

    // hsid → { date, sourceFile }. First non-empty date wins.
    const hsidToDate = {};
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
        if (!hsid || hsidToDate[hsid]) continue;
        const serviceElement = String(row[4] || '').trim().toUpperCase();
        const ceisFlag = String(row[2] || '').trim().toUpperCase();
        const isDea = serviceElement === 'CEIS' || ceisFlag === 'YES';
        const isWd = serviceElement === 'WD';
        if (!isDea && !isWd) continue;
        const startRaw = isDea ? (row[3] || row[5]) : (row[5] || row[3]);
        const parsed = parseCrtDate(startRaw);
        if (parsed) hsidToDate[hsid] = { date: parsed, sourceFile: f.name };
      }
    }

    // Load portal clients and backfill those missing a start date.
    const clients = await base44.asServiceRole.entities.Client.list(null, 500);
    const updates = [];
    for (const c of clients) {
      const hsid = c.compass_hsid ? String(c.compass_hsid).trim() : '';
      if (!hsid || c.service_start_date) continue;
      const match = hsidToDate[hsid];
      if (!match) continue;
      await base44.asServiceRole.entities.Client.update(c.id, { service_start_date: match.date });
      updates.push({
        name: `${c.first_name} ${c.last_name}`,
        hsid,
        service_start_date: match.date,
        source: match.sourceFile,
      });
    }

    return Response.json({
      status: 'success',
      crtFilesScanned: files.length,
      portalClients: clients.length,
      backfilled: updates.length,
      updates,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}