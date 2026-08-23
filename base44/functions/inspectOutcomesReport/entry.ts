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

    // Deliverables row 16 — every column's formula (to see how P16/AC16/... are built)
    const dRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${wb.id}/workbook/worksheets('Deliverables')/usedRange`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    let deliverablesRow16 = null;
    if (dRes.ok) {
      const d = await dRes.json();
      const dv: any[][] = d.values || [];
      const df: any[][] = d.formulas || [];
      const r16 = dv[15] || [];
      const f16 = df[15] || [];
      const cells = [];
      for (let c = 0; c < r16.length; c++) {
        if (r16[c] !== '' && r16[c] != null || (f16[c] && String(f16[c]).startsWith('='))) {
          cells.push({ col: colLetter(c), value: r16[c] ?? '', formula: String(f16[c] ?? '') });
        }
      }
      deliverablesRow16 = cells;
    }

    return Response.json({ workbook: wb.name, sheet, deliverablesRow16 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}