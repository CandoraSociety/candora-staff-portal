import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, getActiveCrtWorkbook, DRIVE_ID } from '../../shared/crtWorkbook.ts';
import { DELIVERABLES_SHEET, colLetter } from '../../shared/deliverablesSheet.ts';
import { cellToMonthKey } from '../../shared/invoiceTracker.ts';

// Reads the Deliverables sheet region rows 12-20, columns Q-AB (the manual-
// entry region) from the active CRT workbook, returning row labels (col A),
// each column's month header (scanned from the header rows above), and the
// current cell values. Used by the Manual Deliverables Entry UI.

const ROWS = [12, 13, 14, 15, 16, 17, 18, 19, 20];
const COLS = ['Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB'];

function colIdx(letter: string): number {
  let n = 0;
  for (const ch of letter) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* service role ok */ }
    const accessToken = await getGraphToken();
    const active = await getActiveCrtWorkbook(accessToken);
    if (!active) return Response.json({ status: 'no_workbook' });

    // Read A1:AB30 (covers header rows + rows 12-20 + columns A through AB).
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${active.id}/workbook/worksheets('${DELIVERABLES_SHEET}')/usedRange(valuesOnly=true)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return Response.json({ error: 'Failed to read Deliverables: ' + await res.text() }, { status: 500 });
    const data = await res.json();
    const values: any[][] = data.values || [];

    const rowLabels = ROWS.map(r => ({ row: r, label: values[r - 1]?.[0] ?? '' }));

    // Determine each target column's month header by scanning header rows 1-11
    // for a date cell in that column.
    const columns = COLS.map(cl => {
      const ci = colIdx(cl);
      let monthKey: any = null;
      for (let r = 0; r < Math.min(values.length, 11); r++) {
        const key = cellToMonthKey(values[r]?.[ci]);
        if (key) { monthKey = key; break; }
      }
      const month = monthKey ? `${monthKey.year}-${String(monthKey.month + 1).padStart(2, '0')}` : null;
      return { colLetter: cl, month, header: values[0]?.[ci] ?? '' };
    });

    const cells: Record<string, Record<string, any>> = {};
    for (const r of ROWS) {
      cells[String(r)] = {};
      for (const cl of COLS) {
        const ci = colIdx(cl);
        const v = values[r - 1]?.[ci];
        cells[String(r)][cl] = v ?? '';
      }
    }

    return Response.json({
      status: 'success',
      workbook: active.name,
      sheet: DELIVERABLES_SHEET,
      rowLabels,
      columns,
      cells,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}