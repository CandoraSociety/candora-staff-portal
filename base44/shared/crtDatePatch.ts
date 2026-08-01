import { DRIVE_ID, CLIENT_DATA_SHEET } from './crtWorkbook.ts';

// Excel serial date (days since 1899-12-30) for a JS Date.
// Writing serials (not ISO strings) keeps the cells as real dates so the
// workbook's conditional-formatting date comparisons still work.
export function excelSerial(d: Date): number {
  return Math.round((d.getTime() - Date.UTC(1899, 11, 30)) / 86400000);
}

// Column letter(s) → 1-based number, e.g. "B" → 2, "AA" → 27.
function colToNum(col: string): number {
  return col.split('').reduce((n, c) => n * 26 + (c.charCodeAt(0) - 64), 0);
}

// Width (column count) of a range address: 'B8' → 1, 'B9:C9' → 2.
function rangeWidth(cell: string): number {
  const i = cell.indexOf(':');
  if (i < 0) return 1;
  const startCol = cell.slice(0, i).match(/[A-Z]+/)![0];
  const endCol = cell.slice(i + 1).match(/[A-Z]+/)![0];
  return colToNum(endCol) - colToNum(startCol) + 1;
}

// Patch a cell (or merged range) on a workbook worksheet. For merged cells,
// pass the full merged range address (e.g. 'B9:C9'); the value is written to
// every cell in the range — Excel retains only the top-left for merged ranges.
export async function patchCell(accessToken, itemId, sheet, cell, value, fmt?) {
  const width = rangeWidth(cell);
  const rowVals = Array(width).fill(value);
  const url = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${itemId}/workbook/worksheets('${sheet}')/range(address='${cell}')`;
  const body: any = { values: [rowVals] };
  if (fmt) body.numberFormat = [Array(width).fill(fmt)];
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${sheet}!${cell}: ${res.status} ${await res.text()}`);
}

// Patch with retry — the workbook may not be editable immediately after a copy.
export async function patchWithRetry(accessToken, itemId, sheet, cell, value, fmt?) {
  for (let i = 0; i < 4; i++) {
    try { await patchCell(accessToken, itemId, sheet, cell, value, fmt); return; }
    catch (e) { if (i === 3) throw e; await new Promise(r => setTimeout(r, 2500)); }
  }
}

// Submission start/end date cells across CRT workbook sheets.
export const SUBMISSION_RANGE_CELLS = [
  { sheet: CLIENT_DATA_SHEET, startCell: 'B8', endCell: 'E8' },
  { sheet: 'Invoice Tracker', startCell: 'B8', endCell: 'B9' },
  // Outcomes Report sheet is protected — only B9/B10 (merged with C) are
  // editable. Protection blocks numberFormat writes, so write the value only
  // and rely on the cells' existing mm/dd/yy format carried over from the copy.
  { sheet: 'Outcomes Report', startCell: 'B9:C9', endCell: 'B10:C10', skipFormat: true },
];