import { DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW, NUM_COLUMNS } from './crtWorkbook.ts';

// Shared single-row CRT patch: writes the given cells (column index → string)
// into the row matching hsid (preferred) or the normalized client name, in
// every provided (open) workbook, preserving all other columns.

const NORM = (s) => String(s || '').toLowerCase().replace(/,/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

export async function patchClientRows({ accessToken, files, hsid, clientName, writeVals }) {
  const results = [];
  for (const f of files) {
    try {
      const rangeRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
        { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(30000) }
      );
      if (!rangeRes.ok) { results.push({ file: f.name, status: 'error', error: 'read failed' }); continue; }
      const data = await rangeRes.json();
      const values = (data.values || []).map((r) => {
        const p = [...r];
        while (p.length < NUM_COLUMNS) p.push('');
        return p.slice(0, NUM_COLUMNS);
      });

      let rowIdx = -1;
      if (hsid) {
        for (let i = CLIENT_DATA_START_ROW - 1; i < values.length; i++) {
          if (values[i] && String(values[i][1] || '').trim() === hsid) { rowIdx = i; break; }
        }
      }
      if (rowIdx < 0 && clientName) {
        const nk = NORM(clientName);
        for (let i = CLIENT_DATA_START_ROW - 1; i < values.length; i++) {
          if (values[i] && NORM(values[i][0] || '') === nk) { rowIdx = i; break; }
        }
      }
      if (rowIdx < 0) { results.push({ file: f.name, status: 'no_match' }); continue; }

      const row = [...values[rowIdx]];
      for (const [colStr, v] of Object.entries(writeVals)) row[Number(colStr)] = v;

      const rangeAddress = `A${rowIdx + 1}:Y${rowIdx + 1}`;
      const patchRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='${rangeAddress}')`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [row] }),
          signal: AbortSignal.timeout(30000),
        }
      );
      if (!patchRes.ok) {
        const errText = await patchRes.text().catch(() => '');
        results.push({ file: f.name, status: 'error', error: 'write failed: ' + errText.slice(0, 200) });
        continue;
      }
      results.push({ file: f.name, status: 'patched', row: rowIdx + 1 });
    } catch (e) {
      results.push({ file: f.name, status: 'error', error: String(e.message || e).slice(0, 200) });
    }
  }
  return results;
}

// Columns always overwritten when merging a portal-derived row into an
// existing CRT row: D/F (stream start dates — clears a stale date after a
// stream switch), H (service outcome date), T (EDA completion mirror),
// S (composed comments) and Y (service nav billing month).
const FORCE_COLS = new Set([3, 5, 7, 18, 19, 24]);

// Bulk upsert of whole client rows into every provided (open) workbook.
//
// The cross-reference push needs to land MANY clients on the CRT at once, so
// each workbook is read once and every changed row is written in a single
// range PATCH (one block per used area) instead of one request per client —
// pushing dozens of clients stays a couple of Graph calls.
//
// entries: [{ hsid, clientName, row, preserveExisting }]
//   preserveExisting=true → portal-derived row: empty portal cells keep
//   whatever staff already typed in that column (columns the portal doesn't
//   manage are never clobbered), forced columns are always written.
//   preserveExisting=false → cross-reference values written as-is for every
//   non-empty cell, so a row with no program stream still carries the
//   reviewed cross-reference data onto the CRT.
export async function upsertClientRows({ accessToken, files, entries }) {
  const out = { files: [], clients: {} };
  const keyOf = (e) => (e.id !== undefined && e.id !== null
    ? String(e.id)
    : (e.hsid ? `h:${String(e.hsid).trim()}` : `n:${NORM(e.clientName)}`));

  for (const f of files) {
    const summary = { file: f.name, status: 'ok', updated: 0, added: 0, clients: {} };
    try {
      const rangeRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
        { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(30000) }
      );
      if (!rangeRes.ok) { summary.status = 'error'; summary.error = 'read failed'; out.files.push(summary); continue; }
      const data = await rangeRes.json();
      const values = (data.values || []).map((r) => {
        const p = [...r];
        while (p.length < NUM_COLUMNS) p.push('');
        return p.slice(0, NUM_COLUMNS);
      });

      const hsidIndex = new Map();
      const nameIndex = new Map();
      for (let i = CLIENT_DATA_START_ROW - 1; i < values.length; i++) {
        const row = values[i];
        if (!row) continue;
        const h = row[1] ? String(row[1]).trim() : '';
        if (h) hsidIndex.set(h, i);
        else if (row[0] && String(row[0]).trim()) nameIndex.set(NORM(row[0]), i);
      }
      let lastDataRow = CLIENT_DATA_START_ROW - 2;
      for (let i = values.length - 1; i >= CLIENT_DATA_START_ROW - 1; i--) {
        if (values[i] && values[i].some(v => v !== '' && v !== null && v !== undefined)) { lastDataRow = i; break; }
      }

      const writes = new Map(); // row index -> row values
      for (const e of entries) {
        const hsid = e.hsid ? String(e.hsid).trim() : '';
        let rowIdx = hsid ? hsidIndex.get(hsid) : undefined;
        if (rowIdx === undefined && e.clientName) {
          const nk = NORM(e.clientName);
          if (nameIndex.has(nk)) rowIdx = nameIndex.get(nk);
        }
        if (rowIdx === undefined && hsid) {
          for (let i = CLIENT_DATA_START_ROW - 1; i < values.length; i++) {
            if (values[i] && NORM(values[i][0]) === NORM(e.clientName || '')) { rowIdx = i; break; }
          }
        }

        const incoming = (e.row || []).slice(0, NUM_COLUMNS);
        while (incoming.length < NUM_COLUMNS) incoming.push('');

        if (rowIdx !== undefined) {
          const existing = values[rowIdx] || new Array(NUM_COLUMNS).fill('');
          const merged = incoming.map((val, col) => {
            if (FORCE_COLS.has(col)) return val;
            if (e.preserveExisting) {
              return (val !== '' && val !== null && val !== undefined) ? val : (existing[col] ?? '');
            }
            return (val !== '' && val !== null && val !== undefined) ? val : (existing[col] ?? '');
          });
          // Cross-reference rows never blank a cell they don't carry.
          if (!e.preserveExisting) {
            for (let col = 0; col < NUM_COLUMNS; col++) {
              if (merged[col] === '' || merged[col] === null || merged[col] === undefined) merged[col] = existing[col] ?? '';
            }
          }
          values[rowIdx] = merged;
          writes.set(rowIdx, merged);
          summary.updated++;
          summary.clients[keyOf(e)] = 'updated';
        } else {
          lastDataRow += 1;
          values[lastDataRow] = incoming;
          writes.set(lastDataRow, incoming);
          summary.added++;
          summary.clients[keyOf(e)] = 'added';
        }
      }

      if (!writes.size) { out.files.push(summary); continue; }

      // One PATCH per contiguous block of changed rows.
      const idxs = [...writes.keys()].sort((a, b) => a - b);
      const blocks = [];
      let start = idxs[0], prev = idxs[0];
      for (const i of idxs.slice(1)) {
        if (i === prev + 1) { prev = i; continue; }
        blocks.push([start, prev]);
        start = i; prev = i;
      }
      blocks.push([start, prev]);

      for (const [a, b] of blocks) {
        const rows = [];
        for (let i = a; i <= b; i++) rows.push(writes.get(i));
        const address = `A${a + 1}:Y${b + 1}`;
        // Excel Online intermittently answers 504 on a busy workbook — retry
        // once before reporting the block as failed.
        let ok = false;
        let errText = '';
        for (let attempt = 0; attempt < 2 && !ok; attempt++) {
          const patchRes = await fetch(
            `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='${address}')`,
            {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ values: rows }),
              signal: AbortSignal.timeout(45000),
            }
          );
          if (patchRes.ok) { ok = true; break; }
          errText = await patchRes.text().catch(() => '');
          if (attempt === 0) await new Promise(r => setTimeout(r, 2500));
        }
        if (!ok) {
          summary.status = 'error';
          summary.error = `write failed (rows ${a + 1}-${b + 1}): ${errText.slice(0, 160)}`;
          break;
        }
      }
    } catch (e) {
      summary.status = 'error';
      summary.error = String(e.message || e).slice(0, 200);
    }
    out.files.push(summary);
    for (const [k, v] of Object.entries(summary.clients)) {
      if (out.clients[k] === 'added') continue;
      out.clients[k] = summary.status === 'error' ? 'error' : v;
    }
  }
  out.written = out.files.filter(f => f.status === 'ok').reduce((n, f) => n + f.updated + f.added, 0);
  return out;
}