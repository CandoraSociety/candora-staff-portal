import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW, NUM_COLUMNS, getGraphToken, listCrtFiles
} from '../../shared/crtWorkbook.ts';

// Removes rows that are COMPLETELY identical (every one of the 25 columns
// matches another row for the same client) from the Client Data sheet of every
// open CRT workbook, keeping the topmost row and closing the gap so no blank
// rows are left behind.
//
// Body: { dryRun?: boolean, fileNames?: string[] }
//   dryRun (default true) only reports what it found — nothing is written.
//
// A row is only treated as a duplicate when the whole row matches cell for
// cell, so two rows for the same client carrying different data are reported
// as "differing" and left untouched for a human to resolve.

const key = (row) => {
  const p = [];
  for (let i = 0; i < NUM_COLUMNS; i++) {
    const v = row[i];
    p.push(v === null || v === undefined ? '' : String(v).trim());
  }
  return p.join('\u0001');
};

const clientKey = (row) => {
  const hsid = String(row[1] ?? '').trim();
  if (hsid) return `h:${hsid}`;
  return `n:${String(row[0] ?? '').toLowerCase().replace(/,/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ')}`;
};

const pad = (r) => {
  const p = [...(r || [])];
  while (p.length < NUM_COLUMNS) p.push('');
  return p.slice(0, NUM_COLUMNS);
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dryRun !== false;
    const wanted = Array.isArray(body?.fileNames) ? body.fileNames.map(String) : null;

    const accessToken = await getGraphToken();
    const allFiles = await listCrtFiles(accessToken);

    let closedNames = new Set();
    try {
      const closed = await base44.asServiceRole.entities.CrtWorkbook.filter({ status: 'closed' });
      closedNames = new Set(closed.map((r) => r.file_name));
    } catch { /* default: nothing closed */ }

    const files = allFiles.filter((f) => !closedNames.has(f.name) && (!wanted || wanted.includes(f.name)));
    const baseUrl = (file) => `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${file.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')`;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const readValues = async (file) => {
      const res = await fetch(`${baseUrl(file)}/usedRange(valuesOnly=true)`, {
        headers: { ...headers, 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error('could not read Client Data');
      const data = await res.json();
      return (data.values || []).map(pad);
    };
    const writeBlock = async (file, fromRow, rows) => {
      if (!rows.length) return;
      const address = `A${fromRow}:Y${fromRow + rows.length - 1}`;
      const res = await fetch(`${baseUrl(file)}/range(address='${address}')`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: rows }),
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) throw new Error(`write ${address} failed: ${(await res.text()).slice(0, 160)}`);
    };

    const report = [];
    for (const file of files) {
      try {
        const values = await readValues(file);
        const start = CLIENT_DATA_START_ROW - 1;

        let lastData = start - 1;
        for (let i = values.length - 1; i >= start; i--) {
          if (values[i] && values[i].some((v) => v !== '' && v !== null && v !== undefined)) { lastData = i; break; }
        }

        // Group data rows by client, then split each group into identical rows
        // and differing rows.
        const byClient = {};
        for (let i = start; i <= lastData; i++) {
          const row = values[i];
          if (!row || !String(row[0] ?? '').trim()) continue;
          const ck = clientKey(row);
          (byClient[ck] = byClient[ck] || []).push(i);
        }

        const removeIdx = new Set();
        const duplicates = [];
        const differing = [];
        for (const [ck, idxs] of Object.entries(byClient)) {
          if (idxs.length < 2) continue;
          const seen = new Map();
          for (const i of idxs) {
            const rk = key(values[i]);
            if (seen.has(rk)) {
              removeIdx.add(i);
              duplicates.push({
                client: String(values[i][0] ?? '').trim(),
                hsid: String(values[i][1] ?? '').trim(),
                keep_row: seen.get(rk) + 1,
                remove_row: i + 1,
              });
            } else {
              seen.set(rk, i);
            }
          }
          if (new Set(idxs.map((i) => key(values[i]))).size > 1) {
            differing.push({
              client: String(values[idxs[0]][0] ?? '').trim(),
              hsid: String(values[idxs[0]][1] ?? '').trim(),
              rows: idxs.map((i) => i + 1),
              note: 'rows differ — left untouched',
            });
          }
        }

        if (!duplicates.length) {
          report.push({ file: file.name, duplicates: 0, differing });
          continue;
        }
        if (dryRun) {
          report.push({ file: file.name, duplicates, differing, dryRun: true });
          continue;
        }

        // Compact: keep every surviving data row in order, blank the tail.
        const kept = [];
        for (let i = start; i <= lastData; i++) {
          const row = values[i];
          const isEmpty = !row || !row.some((v) => v !== '' && v !== null && v !== undefined);
          if (isEmpty) continue;
          if (removeIdx.has(i)) continue;
          kept.push(row);
        }
        const blank = new Array(NUM_COLUMNS).fill('');
        const tail = [];
        for (let i = kept.length; i <= lastData - start; i++) tail.push(blank);

        await writeBlock(file, CLIENT_DATA_START_ROW, kept);
        if (tail.length) await writeBlock(file, CLIENT_DATA_START_ROW + kept.length, tail);

        // Verify: no identical duplicate row survives, and every client we
        // de-duplicated still has its kept row present.
        let remaining = null;
        let ok = false;
        for (let attempt = 0; attempt < 3 && !ok; attempt++) {
          if (attempt) await new Promise((r) => setTimeout(r, 1500));
          const after = await readValues(file);
          const rowsByClient = {};
          for (let i = start; i < after.length; i++) {
            const row = after[i];
            if (!row || !String(row[0] ?? '').trim()) continue;
            (rowsByClient[clientKey(row)] = rowsByClient[clientKey(row)] || []).push(key(row));
          }
          remaining = duplicates.filter((d) => {
            const ck = d.hsid ? `h:${d.hsid}` : null;
            if (!ck) return false;
            const rows = rowsByClient[ck] || [];
            return rows.length === 0 || new Set(rows).size !== rows.length;
          }).length;
          ok = remaining === 0;
        }

        report.push({
          file: file.name,
          duplicates,
          differing,
          removed: duplicates.length,
          verified: ok,
          verify_failures: ok ? undefined : remaining,
        });
      } catch (e) {
        report.push({ file: file.name, error: String(e.message || e).slice(0, 200) });
      }
    }

    return Response.json({ status: 'success', dryRun, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}