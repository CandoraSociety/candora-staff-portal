import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_ID, getGraphToken, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';

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

    // Only the requested rows (16-31 + 56) and only U(20)/V(21) non-empty cells
    const body = await req.json().catch(() => ({}));
    const half = body.half;
    const targets = body.rows
      ? body.rows.map(r => r - 1)
      : half === 1
      ? [19,20,21,22]
      : half === 2
      ? [23,24,25,26,27]
      : [28,29,30,55];
    const rows = [];
    for (const r of targets) {
      const rv = values[r] || [];
      const rf = formulas[r] || [];
      const cols = {};
      for (const c of [20, 21]) {
        const f = String(rf[c] ?? '');
        const v = rv[c] ?? '';
        if (f.startsWith('=') || (v !== '' && v != null)) {
          cols[colLetter(c)] = { v, f };
        }
      }
      rows.push({ row: r + 1, label: String(rv[0] ?? '').trim(), cols });
    }

    return Response.json({ workbook: wb.name, sheet, rows });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

const colLetter = (idx) => {
  let n = idx + 1, s = '';
  while (n > 0) { const rem = (n - 1) % 26; s = String.fromCharCode(65 + rem) + s; n = Math.floor((n - 1) / 26); }
  return s;
};