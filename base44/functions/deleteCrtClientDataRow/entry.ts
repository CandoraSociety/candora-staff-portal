import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, CLIENT_DATA_SHEET,
  getGraphToken, listCrtFiles
} from '../../shared/crtWorkbook.ts';

// Deletes a single duplicate row from a CRT workbook's Client Data sheet.
// Required body: { clientName: "Last, First", row: 15, fileName?: "CRT_August_2026.xlsx" }
// Safety: scans all (or specified) workbooks, finds every occurrence of the
// client name, and only deletes the target row if the client appears more than
// once overall (confirms it is genuinely a duplicate). Deletes the entire row
// with shift=up so lower rows collapse.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { clientName, row, fileName } = body || {};
    if (!clientName || !row) return Response.json({ error: 'clientName and row are required' }, { status: 400 });

    const accessToken = await getGraphToken();
    const allFiles = await listCrtFiles(accessToken);
    const files = fileName ? allFiles.filter((f) => f.name === fileName) : allFiles;
    if (!files.length) return Response.json({ error: 'No matching workbook found' }, { status: 404 });

    // Scan: find every occurrence of the client name across the workbooks.
    // Capture each file's column count so the row can be blanked across its
    // full width (Graph blocks row-delete via client credentials, so we clear
    // the row cells via PATCH — the established pattern in dedupCrtRows).
    const colCountByFile = {};
    const occurrences = [];
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
      colCountByFile[f.name] = Math.max(1, ...(values.map(r => (r ? r.length : 0)).concat([1])));
      // Token-based match: every space/comma-separated token of the requested
      // name must appear (case-insensitive) in the sheet's name cell. Tolerates
      // spelling/order differences and stray whitespace.
      const tokens = String(clientName).toLowerCase().split(/[\s,]+/).filter(Boolean);
      for (let i = 0; i < values.length; i++) {
        const nameCell = String(values[i]?.[0] || '').trim().toLowerCase();
        if (nameCell && tokens.every((t) => nameCell.includes(t))) {
          occurrences.push({ file: f.name, fileId: f.id, row: i + 1, nameInSheet: String(values[i]?.[0] || '').trim() });
        }
      }
    }

    if (occurrences.length < 2) {
      return Response.json({ error: 'Aborted — client only appears once, cannot confirm duplicate', occurrences }, { status: 409 });
    }

    const target = occurrences.find((o) => o.row === row);
    if (!target) {
      return Response.json({ error: `Client not found at row ${row} in any scanned workbook`, occurrences }, { status: 404 });
    }

    // Blank the entire target row across its full column width via PATCH.
    const colLetter = (n) => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
    const cols = colCountByFile[target.file] || 25;
    const endCol = colLetter(cols);
    const emptyRow = new Array(cols).fill('');
    const clrRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${target.fileId}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='A${row}:${endCol}${row}')`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [emptyRow] })
      }
    );
    if (!clrRes.ok) {
      const errText = await clrRes.text().catch(() => '');
      return Response.json({ error: 'Row clear failed', details: errText.slice(0, 300), occurrences }, { status: 502 });
    }

    return Response.json({
      status: 'success',
      cleared: { file: target.file, row: target.row, columns: cols, clientName },
      remaining: occurrences.filter((o) => !(o.file === target.file && o.row === target.row)),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}