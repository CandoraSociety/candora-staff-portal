import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW,
  getGraphToken, listCrtFiles, parseCrtDate, formatDateForCrt
} from '../../shared/crtWorkbook.ts';

// One-time retroactive backfill: for every CRT workbook (open AND closed), find
// DEA client rows (Column C "CEIS (DEA)" = "Yes") whose Column D (DEA Start
// Date) is populated but Column F (Service Start Date) is blank or differs, and
// set Column F = Column D. Mirrors the new mapClientToCrtRow rule so historical
// rows reflect it. Only Column F is written — no other column is touched.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);
    if (!files.length) return Response.json({ error: 'No CRT workbooks found' }, { status: 404 });

    const results = [];
    for (const f of files) {
      let rangeRes;
      try {
        rangeRes = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      } catch { results.push({ file: f.name, status: 'read_error' }); continue; }
      if (!rangeRes.ok) { results.push({ file: f.name, status: 'read_failed' }); continue; }
      const data = await rangeRes.json();
      const values = data.values || [];

      // Build the Column F values for the full data range, preserving existing
      // values everywhere except DEA rows that need D mirrored into F.
      const startIdx = CLIENT_DATA_START_ROW - 1;
      let endIdx = startIdx - 1;
      for (let i = values.length - 1; i >= startIdx; i--) {
        if (values[i] && values[i].some(v => v !== '' && v !== null && v !== undefined)) { endIdx = i; break; }
      }
      if (endIdx < startIdx) { results.push({ file: f.name, status: 'no_data', updated: 0 }); continue; }

      const colF = [];
      const changedRows = [];
      for (let i = startIdx; i <= endIdx; i++) {
        const row = values[i] || [];
        const ceisFlag = String(row[2] || '').trim().toUpperCase();
        const serviceElement = String(row[4] || '').trim().toUpperCase();
        const isDea = ceisFlag === 'YES' || serviceElement === 'CEIS';
        const dRaw = row[3];
        const dParsed = parseCrtDate(dRaw);
        const fRaw = row[5];
        const fParsed = parseCrtDate(fRaw);
        let newVal = fRaw !== undefined ? fRaw : '';
        if (isDea && dParsed) {
          const mirrored = formatDateForCrt(dParsed);
          // Only write when F is blank or holds a different date than D.
          if (!fParsed || fParsed !== dParsed) {
            newVal = mirrored;
            changedRows.push({ row: i + 1, client: String(row[0] || '').trim(), from: fRaw || '', to: mirrored });
          } else {
            newVal = fRaw !== undefined ? fRaw : mirrored;
          }
        } else {
          newVal = fRaw !== undefined ? fRaw : '';
        }
        colF.push([newVal]);
      }

      if (changedRows.length === 0) { results.push({ file: f.name, status: 'up_to_date', updated: 0 }); continue; }

      const rangeAddress = `F${CLIENT_DATA_START_ROW}:F${endIdx + 1}`;
      const patchRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='${rangeAddress}')`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: colF })
        }
      );
      if (!patchRes.ok) {
        const errText = await patchRes.text().catch(() => '');
        results.push({ file: f.name, status: 'write_failed', error: errText.slice(0, 200) }); continue;
      }
      results.push({ file: f.name, status: 'updated', updated: changedRows.length, changes: changedRows });
    }

    const totalUpdated = results.reduce((n, r) => n + (r.updated || 0), 0);
    return Response.json({ status: 'success', filesScanned: files.length, totalUpdated, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}