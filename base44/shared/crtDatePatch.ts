import { DRIVE_ID, CLIENT_DATA_SHEET } from './crtWorkbook.ts';

// Excel serial date (days since 1899-12-30) for a JS Date.
// Writing serials (not ISO strings) keeps the cells as real dates so the
// workbook's conditional-formatting date comparisons still work.
export function excelSerial(d: Date): number {
  return Math.round((d.getTime() - Date.UTC(1899, 11, 30)) / 86400000);
}

// Patch a single cell range on a workbook worksheet.
export async function patchCell(accessToken, itemId, sheet, cell, value, fmt?) {
  const url = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${itemId}/workbook/worksheets('${sheet}')/range(address='${cell}')`;
  const body: any = { values: [[value]] };
  if (fmt) body.numberFormat = [[fmt]];
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
  { sheet: 'Outcomes Report', startCell: 'B9', endCell: 'B10' },
];