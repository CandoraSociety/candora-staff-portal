import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW, NUM_COLUMNS,
  getGraphToken, listCrtFiles
} from '../../shared/crtWorkbook.ts';

// Removes a client from every CRT workbook (open + archived months).
// Required body: { names: ["Last, First"], hsids?: ["123..."], dryRun?: boolean }
// Graph blocks row-delete with client credentials, so matching rows are blanked
// across the full width (the established pattern used by dedupCrtRows).
// Unlike deleteCrtClientDataRow this does NOT require the client to be a duplicate.

const colLetter = (n) => {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const names = Array.isArray(body?.names) ? body.names.filter(Boolean).map((n) => String(n).trim()) : [];
    const hsids = new Set((Array.isArray(body?.hsids) ? body.hsids : []).map((h) => String(h).trim()).filter(Boolean));
    const dryRun = body?.dryRun !== false;
    if (!names.length && !hsids.size) {
      return Response.json({ error: 'names or hsids are required' }, { status: 400 });
    }

    const tokenSets = names.map((n) => String(n).toLowerCase().split(/[\s,]+/).filter(Boolean));
    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);
    if (!files.length) return Response.json({ error: 'No CRT workbooks found' }, { status: 404 });

    const matches = [];
    const cleared = [];
    const errors = [];

    for (const f of files) {
      let values = [];
      try {
        const res = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
          { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(30000) }
        );
        if (!res.ok) { errors.push({ file: f.name, stage: 'read', status: res.status }); continue; }
        const data = await res.json();
        values = data.values || [];
      } catch (e) {
        errors.push({ file: f.name, stage: 'read', text: String(e?.message || e).slice(0, 200) });
        continue;
      }

      for (let i = CLIENT_DATA_START_ROW - 1; i < values.length; i++) {
        const row = values[i] || [];
        const nameCell = String(row[0] || '').trim();
        const hsidCell = String(row[1] || '').trim();
        const nameLower = nameCell.toLowerCase();
        const byHsid = hsidCell && hsids.has(hsidCell);
        const byName = nameLower && tokenSets.some((tokens) => tokens.length && tokens.every((t) => nameLower.includes(t)));
        if (!byHsid && !byName) continue;

        const rowNumber = i + 1;
        matches.push({
          sourceFile: f.name, row: rowNumber, name: nameCell, hsid: hsidCell,
          service_element: String(row[4] || '').trim(),
          service_outcome: String(row[6] || '').trim(),
        });

        if (dryRun) continue;

        const emptyRow = new Array(NUM_COLUMNS).fill('');
        try {
          const clrRes = await fetch(
            `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='A${rowNumber}:${colLetter(NUM_COLUMNS)}${rowNumber}')`,
            {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ values: [emptyRow] }),
              signal: AbortSignal.timeout(30000),
            }
          );
          if (clrRes.ok) cleared.push({ file: f.name, row: rowNumber });
          else errors.push({ file: f.name, row: rowNumber, stage: 'clear', status: clrRes.status, text: (await clrRes.text().catch(() => '')).slice(0, 200) });
        } catch (e) {
          errors.push({ file: f.name, row: rowNumber, stage: 'clear', text: String(e?.message || e).slice(0, 200) });
        }
      }
    }

    return Response.json({ dryRun, filesScanned: files.length, matches, cleared, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}