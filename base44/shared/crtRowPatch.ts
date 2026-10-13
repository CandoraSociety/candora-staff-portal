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