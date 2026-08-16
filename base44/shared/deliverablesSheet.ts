// Shared helpers for the "Deliverables" sheet that lives inside each monthly CRT
// workbook. The sheet has one column per calendar month (identified by a date
// cell in the header rows) and fixed rows for each deliverable metric. These
// helpers locate a month's column and write absolute values into specific rows
// (handling sheet protection via patchProtectedSheet).

import { DRIVE_ID } from './crtWorkbook.ts';
import { cellToMonthKey } from './invoiceTracker.ts';
import { patchProtectedSheet } from './crtDatePatch.ts';

export const DELIVERABLES_SHEET = 'Deliverables';

// 0-based column index → Excel column letter(s).
export function colLetter(idx0: number): string {
  let n = idx0 + 1, s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// Scan the Deliverables header rows (first ~12) for a date cell matching the
// target month/year. Returns a 0-based column index, or -1 if not found.
export function findDeliverablesColumn(values: any[][], year: number, month0: number): number {
  for (let r = 0; r < Math.min(values.length, 12); r++) {
    const row = values[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const key = cellToMonthKey(row[c]);
      if (key && key.year === year && key.month === month0) return c;
    }
  }
  return -1;
}

// Read the Deliverables used range (values only).
export async function readDeliverablesRange(accessToken: string, workbookId: string): Promise<any[][]> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbookId}/workbook/worksheets('${DELIVERABLES_SHEET}')/usedRange(valuesOnly=true)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error('Failed to read Deliverables sheet: ' + await res.text());
  const data = await res.json();
  return data.values || [];
}

// Write absolute values into specific rows for a given month's column. Skips
// cells that already hold the target value. Throws if the month column isn't
// found. `cells` = [{ row: 1-based Excel row, value: number }].
export async function writeDeliverablesMonthlyCells(
  accessToken: string,
  workbookId: string,
  year: number,
  month0: number,
  cells: { row: number; value: number }[]
): Promise<{ colIdx: number; colLetter: string; written: number; skipped: number }> {
  const values = await readDeliverablesRange(accessToken, workbookId);
  const colIdx = findDeliverablesColumn(values, year, month0);
  if (colIdx < 0) throw new Error(`No Deliverables column for ${year}-${String(month0 + 1).padStart(2, '0')}.`);
  const colL = colLetter(colIdx);
  const readNum = (row1: number): number => {
    const row = values[row1 - 1];
    if (!row) return 0;
    const v = row[colIdx];
    if (v == null || v === '') return 0;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };
  const patches: { cell: string; value: number }[] = [];
  let written = 0, skipped = 0;
  for (const c of cells) {
    if (readNum(c.row) === c.value) { skipped++; continue; }
    patches.push({ cell: `${colL}${c.row}`, value: c.value });
    written++;
  }
  if (patches.length) await patchProtectedSheet(accessToken, workbookId, DELIVERABLES_SHEET, patches);
  return { colIdx, colLetter: colL, written, skipped };
}