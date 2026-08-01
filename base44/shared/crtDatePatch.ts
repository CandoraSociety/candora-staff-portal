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
    catch (e) {
      // Protection/access errors are terminal — retrying won't help.
      if (/403|401|accessdenied|forbidden/i.test(String(e.message || ''))) throw e;
      if (i === 3) throw e;
      await new Promise(r => setTimeout(r, 2500));
    }
  }
}

// --- Worksheet protection helpers (for protected sheets like Outcomes Report) ---
// Sheet protection blocks app-only writes even to unlocked cells. We capture the
// sheet's protection options, temporarily unprotect, write, then restore the
// exact protection. Only works for password-less protection.
async function getWorksheetProtection(accessToken, itemId, sheet) {
  const url = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${itemId}/workbook/worksheets('${sheet}')/protection`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  return await res.json();
}

async function unprotectWorksheet(accessToken, itemId, sheet) {
  const url = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${itemId}/workbook/worksheets('${sheet}')/protection/unprotect`;
  // Per MS Graph docs the unprotect body is empty. Try no-body first; if the
  // service insists on JSON, fall back to an empty object, then an empty password.
  const attempts = [
    { headers: { Authorization: `Bearer ${accessToken}` } },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: '{}' },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: '' }) },
  ];
  let lastErr: any;
  for (const a of attempts) {
    const res = await fetch(url, { method: 'POST', ...a });
    if (res.ok) return;
    lastErr = new Error(`unprotect ${sheet}: ${res.status} ${await res.text()}`);
    // If it's a real auth/access error, stop trying.
    if (res.status === 401 || res.status === 403) break;
  }
  throw lastErr;
}

async function protectWorksheet(accessToken, itemId, sheet, options) {
  const url = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${itemId}/workbook/worksheets('${sheet}')/protection/protect`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ options: options || {} })
  });
  if (!res.ok) throw new Error(`protect ${sheet}: ${res.status} ${await res.text()}`);
}

// Try a direct write first. If the sheet is writable (common right after a
// roll-forward copy), this just works. Only if the write is blocked (403/401)
// do we attempt to temporarily unprotect, write, and restore protection —
// which only succeeds for password-less protection.
// writes: [{ cell, value, fmt }]
export async function patchProtectedSheet(accessToken, itemId, sheet, writes) {
  let directErr: any = null;
  try {
    for (const w of writes) {
      await patchWithRetry(accessToken, itemId, sheet, w.cell, w.value, w.fmt);
    }
    return;
  } catch (e) {
    directErr = e;
    const msg = String(e.message || '');
    if (!/403|401|accessdenied|forbidden/i.test(msg)) throw e;
    // fall through to unprotect path
  }

  let wasProtected = false;
  let options: any = {};
  const prot = await getWorksheetProtection(accessToken, itemId, sheet);
  if (prot?.protected) {
    wasProtected = true;
    options = prot.options || {};
    let unprotectErr: any;
    try { await unprotectWorksheet(accessToken, itemId, sheet); }
    catch (e) { unprotectErr = e; }
    if (unprotectErr) {
      throw new Error(`${sheet} is password-protected — the app cannot update ${writes.map(w => w.cell).join(' & ')} or their format. In Excel, go to Review → Unprotect Sheet (or unlock cells B9/B10), then run Repair or Roll Forward.`);
    }
  } else {
    throw new Error(`${sheet} write blocked (${directErr ? directErr.message.split('\n')[0] : 'unknown'}).`);
  }
  try {
    for (const w of writes) {
      await patchWithRetry(accessToken, itemId, sheet, w.cell, w.value, w.fmt);
    }
  } finally {
    if (wasProtected) {
      try { await protectWorksheet(accessToken, itemId, sheet, options); }
      catch { /* best-effort — leave unprotected if restore fails */ }
    }
  }
}

// Submission start/end date cells across CRT workbook sheets.
export const SUBMISSION_RANGE_CELLS = [
  { sheet: CLIENT_DATA_SHEET, startCell: 'B8', endCell: 'E8' },
  { sheet: 'Invoice Tracker', startCell: 'B8', endCell: 'B9' },
  // Outcomes Report B9/B10 (merged B9:C9 / B10:C10). The sheet is marked "protected"
  // but is writable right after a roll-forward copy; try a direct write first and
  // only fall back to unprotect/protect if the direct write is blocked.
  { sheet: 'Outcomes Report', startCell: 'B9:C9', endCell: 'B10:C10', protected: true },
];