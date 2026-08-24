import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_ID, getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';

const colLetter = (idx) => {
  let n = idx + 1, s = '';
  while (n > 0) { const rem = (n - 1) % 26; s = String.fromCharCode(65 + rem) + s; n = Math.floor((n - 1) / 26); }
  return s;
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* service role ok */ }
    const accessToken = await getGraphToken();
    const wb = await getActiveCrtWorkbook(accessToken);
    if (!wb) return Response.json({ error: 'No active workbook' });

    const sheet = 'Outcomes Report';
    const usedRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${wb.id}/workbook/worksheets('${encodeURIComponent(sheet)}')/usedRange`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!usedRes.ok) return Response.json({ error: 'used range failed: ' + await usedRes.text() });
    const used = await usedRes.json();
    const values: any[][] = used.values || [];
    const formulas: any[][] = used.formulas || [];

    // Column T = index 19. Rows 16-31 (0-indexed 15-30) and row 56 (0-indexed 55).
    // Also grab a label column (B, index 1) so we know what each row represents.
    const targetRows = [];
    for (const r of [15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,55]) {
      const rowVals = values[r] || [];
      const rowForm = formulas[r] || [];
      targetRows.push({
        row: r + 1,
        label_A: rowVals[0] ?? '',
        label_B: rowVals[1] ?? '',
        label_C: rowVals[2] ?? '',
        T_value: rowVals[19] ?? '',
        T_formula: String(rowForm[19] ?? ''),
        // Also grab a few neighbouring columns for context (S/U)
        S_value: rowVals[18] ?? '',
        S_formula: String(rowForm[18] ?? ''),
        U_value: rowVals[20] ?? '',
        U_formula: String(rowForm[20] ?? ''),
      });
    }

    // Full row labels for rows 13-31 and 55-57 so we can see section structure
    const sectionLabels = [];
    for (const r of [12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,54,55,56,57]) {
      const rv = values[r] || [];
      sectionLabels.push({
        row: r + 1,
        A: rv[0] ?? '',
        B: rv[1] ?? '',
        C: rv[2] ?? '',
        D: rv[3] ?? '',
        E: rv[4] ?? '',
      });
    }

    // Collect every non-empty formula in column T (all rows) for completeness
    const allT = [];
    for (let r = 0; r < formulas.length; r++) {
      const f = formulas[r]?.[19];
      const v = values[r]?.[19];
      if ((f && String(f).startsWith('=')) || (v !== '' && v != null && v !== 0)) {
        allT.push({ row: r + 1, value: v ?? '', formula: String(f ?? '') });
      }
    }

    return Response.json({ workbook: wb.name, sheet, allT, sectionLabels });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}