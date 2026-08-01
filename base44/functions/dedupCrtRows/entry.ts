import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW, getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';

// One-time cleanup: in every OPEN CRT workbook, find rows with a blank COMPASS
// HSID that are duplicates of each other by sorted name tokens (e.g. a manual
// "Therese ... Ngosso" row and a portal-appended "Ngosso, ... Therese" row) and
// delete the extras (keep the first/lowest row). Has-HSID rows are untouched.
const tokenKey = (s) => String(s || '').toLowerCase().replace(/,/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);

    let closedNames = new Set();
    try {
      const closed = await base44.asServiceRole.entities.CrtWorkbook.filter({ status: 'closed' });
      closedNames = new Set(closed.map(r => r.file_name));
    } catch { /* default: nothing closed */ }

    const report = [];
    for (const f of files) {
      if (closedNames.has(f.name)) { report.push({ file: f.name, skipped: 'closed' }); continue; }
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

      // Group blank-HSID data rows by sorted-token name.
      const groups = {};
      for (let i = CLIENT_DATA_START_ROW - 1; i < values.length; i++) {
        const row = values[i];
        if (!row) continue;
        if (row[1] && String(row[1]).trim()) continue; // has HSID — not a candidate
        const nm = row[0] ? String(row[0]).trim() : '';
        if (!nm) continue;
        const k = tokenKey(nm);
        if (!k) continue;
        if (!groups[k]) groups[k] = [];
        groups[k].push(i);
      }

      // Collect rows to delete: all but the first (lowest-index) in each dup group.
      const toDelete = [];
      for (const k in groups) {
        if (groups[k].length > 1) {
          for (let j = 1; j < groups[k].length; j++) toDelete.push(groups[k][j]);
        }
      }
      if (toDelete.length === 0) { report.push({ file: f.name, duplicates: 0 }); continue; }

      // Clear bottom-up (Graph blocks row-delete via client credentials, but
      // PATCH works). The duplicates are portal-appended rows at the bottom, so
      // blanking their cells removes the duplicate data; the original row above
      // remains and is claimed by token matching on the next sync.
      toDelete.sort((a, b) => b - a);
      const emptyRow = new Array(25).fill('');
      let deleted = 0;
      const delErrors = [];
      for (const idx of toDelete) {
        const excelRow = idx + 1;
        const clrRes = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='A${excelRow}:Y${excelRow}')`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [emptyRow] })
          }
        );
        if (clrRes.ok) deleted++;
        else delErrors.push({ row: excelRow, status: clrRes.status, text: await clrRes.text() });
      }
      report.push({ file: f.name, duplicates: toDelete.length, cleared: deleted, delErrors });
    }

    return Response.json({ status: 'success', report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}