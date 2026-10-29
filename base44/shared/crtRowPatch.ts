import { DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW, NUM_COLUMNS, parseCrtDate } from './crtWorkbook.ts';
import { findCrtRowIndexes } from './crtRowIdentity.ts';

// Shared single-row CRT patch: writes the given cells (column index → string)
// into the row matching hsid (preferred) or the normalized client name, in
// every provided (open) workbook, preserving all other columns.

const NORM = (s) => String(s || '').toLowerCase().replace(/,/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

export async function patchClientRows({ accessToken, files, hsid, clientName, writeVals }) {
  const results = [];
  const groups = [];
  for (const [key, value] of Object.entries(writeVals).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    const col = Number(key), previous = groups[groups.length - 1];
    if (previous && previous.end + 1 === col) { previous.end = col; previous.values.push(value); }
    else groups.push({ start: col, end: col, values: [value] });
  }
  if (!groups.length) return results;
  const dateColumns = new Set([3, 5, 7, 9, 11, 13, 15, 17, 19, 24]);
  const normalized = (value, col) => dateColumns.has(col)
    ? (parseCrtDate(value) || String(value ?? '').trim()) : String(value ?? '').trim();
  for (const f of files) {
    try {
      const baseUrl = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')`;
      const headers = { Authorization: `Bearer ${accessToken}`, 'Cache-Control': 'no-cache' };
      const rangeRes = await fetch(`${baseUrl}/usedRange(valuesOnly=true)`, { headers, signal: AbortSignal.timeout(30000) });
      if (!rangeRes.ok) throw new Error('Could not read Client Data');
      const { values = [] } = await rangeRes.json();
      const indexes = findCrtRowIndexes(values, hsid, clientName);
      if (!indexes.length) { results.push({ file: f.name, status: 'no_match' }); continue; }
      const ranges = [];
      for (const rowIdx of indexes) {
        for (const group of groups) {
          // Write only the explicitly requested cells, never a stale full row.
          const address = `${String.fromCharCode(65 + group.start)}${rowIdx + 1}:${String.fromCharCode(65 + group.end)}${rowIdx + 1}`;
          const url = `${baseUrl}/range(address='${address}')`;
          const patch = await fetch(url, {
            method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [group.values] }), signal: AbortSignal.timeout(30000),
          });
          if (!patch.ok) throw new Error(`Could not write ${address}: ${(await patch.text()).slice(0, 120)}`);
          let verified = false;
          for (let attempt = 0; attempt < 3; attempt++) {
            if (attempt) await new Promise(resolve => setTimeout(resolve, 1000));
            const check = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
            if (!check.ok) throw new Error(`Could not verify ${address}`);
            const actual = (await check.json()).values?.[0] || [];
            verified = group.values.every((value, i) => normalized(actual[i], group.start + i) === normalized(value, group.start + i));
            if (verified) break;
          }
          if (!verified) throw new Error(`Saved values do not match in ${address}`);
          ranges.push(address);
        }
      }
      results.push({ file: f.name, status: 'patched', row: indexes[0] + 1, ranges, verified: true });
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

      let lastDataRow = CLIENT_DATA_START_ROW - 2;
      for (let i = values.length - 1; i >= CLIENT_DATA_START_ROW - 1; i--) {
        if (values[i] && values[i].some(v => v !== '' && v !== null && v !== undefined)) { lastDataRow = i; break; }
      }

      const writes = new Map(); // row index -> row values
      for (const e of entries) {
        const rowIndexes = findCrtRowIndexes(values, e.hsid, e.clientName);
        const incoming = (e.row || []).slice(0, NUM_COLUMNS);
        while (incoming.length < NUM_COLUMNS) incoming.push('');

        if (rowIndexes.length) {
          for (const rowIdx of rowIndexes) {
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
          }
        } else {
          lastDataRow += 1;
          values[lastDataRow] = incoming;
          writes.set(lastDataRow, incoming);
          summary.added++;
          summary.clients[keyOf(e)] = 'added';
        }
      }

      if (!writes.size) { out.files.push(summary); continue; }

      // One bounded PATCH per workbook. Include untouched rows between the
      // changed rows exactly as read, rather than opening the same workbook
      // once per scattered client and overwhelming Excel's edit locks.
      const idxs = [...writes.keys()].sort((a, b) => a - b);
      const blocks = [[idxs[0], idxs[idxs.length - 1]]];

      for (const [a, b] of blocks) {
        const rows = [];
        for (let i = a; i <= b; i++) rows.push(values[i] || new Array(NUM_COLUMNS).fill(''));
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
      // Confirm every written cell, including each duplicate client row.
      // Accept Excel serial dates and formatted dates equally.
      if (summary.status === 'ok') {
        const first = idxs[0], last = idxs[idxs.length - 1];
        let mismatch = '';
        // Excel may briefly serve the pre-PATCH range. Retry the read only,
        // without re-writing or declaring a stale read successful.
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt) await new Promise(resolve => setTimeout(resolve, 1500));
          const check = await fetch(
            `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='A${first + 1}:Y${last + 1}')`,
            { headers: { Authorization: `Bearer ${accessToken}`, 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(30000) }
          );
          if (!check.ok) throw new Error('Could not verify written CRT fields');
          const actual = (await check.json()).values || [];
          mismatch = '';
          for (const i of idxs) {
            const expected = writes.get(i), saved = actual[i - first] || [];
            const dateColumns = new Set([3, 5, 7, 9, 11, 13, 15, 17, 19, 24]);
            const normalize = (value, col) => dateColumns.has(col)
              ? (parseCrtDate(value) || String(value ?? '').trim())
              : String(value ?? '').replace(/\r\n/g, '\n').trim();
            for (let col = 0; col < NUM_COLUMNS; col++) {
              if (normalize(saved[col], col) !== normalize(expected[col], col)) {
                mismatch = `CRT verification failed for ${expected[0]}, column ${String.fromCharCode(65 + col)}: expected ${expected[col] ?? ''}, read ${saved[col] ?? ''}`;
                break;
              }
            }
            if (mismatch) break;
          }
          if (!mismatch) break;
        }
        if (mismatch) throw new Error(mismatch);
      }
    } catch (e) {
      summary.status = 'error';
      summary.error = String(e.message || e).slice(0, 200);
    }
    out.files.push(summary);
    for (const [k, v] of Object.entries(summary.clients)) {
      out.clients[k] = out.clients[k] === 'error' || summary.status === 'error'
        ? 'error' : (out.clients[k] === 'added' || v === 'added' ? 'added' : v);
    }
  }
  // Never let a later successful workbook mask a failed or missing workbook.
  if (!out.files.length || out.files.some(f => f.status !== 'ok')) {
    for (const entry of entries) out.clients[keyOf(entry)] = 'error';
  }
  out.written = out.files.filter(f => f.status === 'ok').reduce((n, f) => n + f.updated + f.added, 0);
  return out;
}