import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW, NUM_COLUMNS, getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';

// Removes ONE duplicate client row from the Client Data sheet and closes the
// gap: every row below is rewritten one row higher and the trailing row is
// blanked (Graph refuses a true row delete with client credentials, so the
// shift is done with a bounded range write instead of /delete).
// Safety: the target row must hold the requested client, and that client must
// appear more than once in the same workbook.
// Body: { clientName?, hsid?, row: 133, fileNames?: ["CRT_October_2026.xlsx"] }
// Graph serves reads briefly stale after a write, so verification retries.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const hsid = String(body?.hsid || '').trim();
    const nameKey = String(body?.clientName || '').toLowerCase().replace(/,/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');
    const row = Number(body?.row);
    const cellWrite = body?.action === 'write' && body?.address && Array.isArray(body?.values);
    if (!cellWrite && (!row || (!hsid && !nameKey))) {
      return Response.json({ error: 'row and hsid or clientName are required' }, { status: 400 });
    }

    const accessToken = await getGraphToken();
    const allFiles = await listCrtFiles(accessToken);
    const wanted = Array.isArray(body?.fileNames) ? body.fileNames.map(String) : null;
    const files = wanted ? allFiles.filter(f => wanted.includes(f.name)) : allFiles;

    const norm = (s) => String(s || '').toLowerCase().replace(/,/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');
    const readSheet = async (file) => {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${file.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
        { headers: { Authorization: `Bearer ${accessToken}`, 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(30000) }
      );
      if (!res.ok) throw new Error('could not read Client Data');
      const data = await res.json();
      let startRow = 1;
      const m = String(data.address || '').match(/!([A-Z]+)(\d+):/);
      if (m) startRow = parseInt(m[2], 10);
      return { values: data.values || [], startRow };
    };
    const writeRange = async (file, address, rows) => {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${file.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='${address}')`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: rows }),
          signal: AbortSignal.timeout(45000),
        }
      );
      if (!res.ok) throw new Error(`write ${address} failed: ${(await res.text()).slice(0, 200)}`);
    };
    const pad = (r) => {
      const p = [...(r || [])];
      while (p.length < NUM_COLUMNS) p.push('');
      return p.slice(0, NUM_COLUMNS);
    };
    const matches = (r) => {
      if (!r) return false;
      if (hsid) return String(r[1] || '').trim() === hsid;
      return nameKey ? norm(r[0]) === nameKey : false;
    };

    const results = [];
    for (const f of files) {
      try {
        if (cellWrite) {
          await writeRange(f, String(body.address), body.values);
          results.push({ file: f.name, status: 'written', address: body.address });
          continue;
        }

        const { values, startRow } = await readSheet(f);
        const targetIdx = row - startRow;
        if (!matches(values[targetIdx])) { results.push({ file: f.name, status: 'not_at_row' }); continue; }
        const occurrences = values.filter((r) => matches(r)).length;
        if (occurrences < 2) { results.push({ file: f.name, status: 'not_duplicate', occurrences }); continue; }

        let lastIdx = values.length - 1;
        while (lastIdx >= CLIENT_DATA_START_ROW - 1 && !(values[lastIdx] || []).some(v => v !== '' && v !== null && v !== undefined)) lastIdx--;

        // Shift every row below the deleted one up by one (onto the deleted
        // row), then blank the now-duplicated trailing row.
        const below = values.slice(targetIdx + 1, lastIdx + 1).map(pad);
        if (below.length) {
          await writeRange(f, `A${row}:Y${row + below.length - 1}`, below);
        }
        const tailRow = lastIdx + startRow;
        await writeRange(f, `A${tailRow}:Y${tailRow}`, [new Array(NUM_COLUMNS).fill('')]);

        let remaining = occurrences;
        for (let attempt = 0; attempt < 4; attempt++) {
          if (attempt) await new Promise(r => setTimeout(r, 2000));
          const after = (await readSheet(f)).values;
          remaining = after.filter((r) => matches(r)).length;
          if (remaining === occurrences - 1) break;
        }
        results.push({
          file: f.name,
          status: remaining === occurrences - 1 ? 'removed' : 'verify_failed',
          deleted_row: row,
          before: occurrences,
          after: remaining,
        });
      } catch (e) {
        results.push({ file: f.name, status: 'error', error: String(e.message || e).slice(0, 200) });
      }
    }

    return Response.json({ status: 'success', results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}