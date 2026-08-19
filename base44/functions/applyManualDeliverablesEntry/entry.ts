import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook, listCrtFiles } from '../../shared/crtWorkbook.ts';
import { DELIVERABLES_SHEET } from '../../shared/deliverablesSheet.ts';
import { patchProtectedSheet } from '../../shared/crtDatePatch.ts';
import { parseValue, recalc } from '../../shared/manualEntryHelpers.ts';

// Manually writes values into the Deliverables sheet's manual-entry region
// (rows 12-20, columns Q-AB) of the active CRT workbook AND every other monthly
// CRT workbook, so the same grid shows up consistently across all monthly CRTs.
// The Deliverables sheet has a fixed column layout (Q=Apr … AB=Mar) shared by
// every workbook, so writing by column letter is consistent across files.
//
// Accepts { entries: [{ row, colLetter, value }, ...] }. Row must be 12-20 and
// colLetter must be Q-AB. Numeric input is parsed to a number; everything else
// is written as text. After each workbook a full recalculation is requested.

const ALLOWED_ROWS = new Set([12, 13, 14, 15, 16, 17, 18, 19, 20]);
const ALLOWED_COLS = new Set(['Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB']);

async function writeToWorkbook(accessToken: string, wb: any, entries: any[]) {
  const patches = entries.map(e => ({ cell: `${e.colLetter}${e.row}`, value: parseValue(e.value) }));
  try {
    await patchProtectedSheet(accessToken, wb.id, DELIVERABLES_SHEET, patches);
    await recalc(accessToken, wb.id);
    return { workbook: wb.name, status: 'success', written: patches.length };
  } catch (e: any) {
    return { workbook: wb.name, status: 'error', error: e.message };
  }
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const entries = Array.isArray(payload?.entries) ? payload.entries : [];
    if (!entries.length) return Response.json({ error: 'No entries provided' }, { status: 400 });

    // Validate every entry is within the allowed region.
    const clean = entries.map((e: any) => ({
      row: Number(e.row),
      colLetter: String(e.colLetter || '').toUpperCase(),
      value: e.value,
    }));
    for (const e of clean) {
      if (!ALLOWED_ROWS.has(e.row)) return Response.json({ error: `Row ${e.row} is out of range (12-20)` }, { status: 400 });
      if (!ALLOWED_COLS.has(e.colLetter)) return Response.json({ error: `Column ${e.colLetter} is out of range (Q-AB)` }, { status: 400 });
    }

    const accessToken = await getGraphToken();
    const active = await getActiveCrtWorkbook(accessToken);
    if (!active) return Response.json({ status: 'no_workbook' });

    const files = await listCrtFiles(accessToken);
    // Write to every CRT workbook so the grid is consistent across all monthly CRTs.
    const targets = files.length ? files : [active];
    if (!targets.some(t => t.id === active.id)) targets.unshift(active);

    const results = [];
    let primary = null;
    for (const wb of targets) {
      const r = await writeToWorkbook(accessToken, wb, clean);
      results.push(r);
      if (wb.id === active.id) primary = r;
    }

    return Response.json({
      status: primary?.status || 'success',
      workbook: active.name,
      sheet: DELIVERABLES_SHEET,
      written: clean.length,
      workbooks: results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}