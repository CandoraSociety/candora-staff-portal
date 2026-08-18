import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_ID, getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';
import { findInvoiceTrackerSheet } from '../../shared/invoiceTracker.ts';
import { DELIVERABLES_SHEET } from '../../shared/deliverablesSheet.ts';

// Diagnostic: reads the Invoice Tracker rows 1-15 and Deliverables rows 1-25
// WITH FORMULAS (not values-only) from a specified workbook (by file_name, or
// the active workbook if omitted), so we can see what row 10's locked formulas
// reference and whether they draw from a broader date range than the viewing
// month.

async function readRangeWithFormulas(accessToken, workbookId, sheetName, address) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbookId}/workbook/worksheets('${sheetName}')/range(address='${address}')`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return { error: `${res.status}`, text: await res.text() };
  const data = await res.json();
  return { values: data.values, formulas: data.formulas, text: data.text };
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* service role ok */ }
    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const wantedName = String(payload.file_name || '').trim();

    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);
    let file = wantedName ? files.find(f => f.name === wantedName) : null;
    if (!file) file = files[0];
    if (!file) return Response.json({ error: 'No CRT workbook found' });

    const result: any = { workbook: file.name };

    // Invoice Tracker — B8/B9 date values + ALL row 10 formulas (read wider)
    const itSheet = await findInvoiceTrackerSheet(accessToken, file.id);
    if (itSheet) {
      const r = await readRangeWithFormulas(accessToken, file.id, itSheet, 'A1:CR12');
      const f10 = (r.formulas || [])[9] || [];
      const v10 = (r.values || [])[9] || [];
      const formulas = {};
      for (let c = 0; c < f10.length; c++) {
        if (f10[c]) formulas[String.fromCharCode(65 + c < 26 ? 65 + c : 0)] = f10[c]; // simplified
      }
      // Build col letter for index > 25
      const colLetter = (idx) => {
        let n = idx + 1, s = '';
        while (n > 0) { const rem = (n - 1) % 26; s = String.fromCharCode(65 + rem) + s; n = Math.floor((n - 1) / 26); }
        return s;
      };
      const row10All = {};
      const broader = {};  // formulas NOT scoped to B8:B9
      for (let c = 0; c < f10.length; c++) {
        if (f10[c]) {
          row10All[colLetter(c)] = f10[c];
          // Flag formulas that don't use BOTH $B$8 and $B9 (broader/different date range)
          if (!f10[c].includes('$B$8') || !f10[c].includes('$B9')) {
            broader[colLetter(c)] = f10[c];
          }
        }
      }
      result.invoiceTracker = {
        sheet: itSheet,
        B8: (r.values || [])[7]?.[1],
        B9: (r.values || [])[8]?.[1],
        broaderRange: broader,
      };
    }

    // Deliverables: row labels (col A) + row 10 formulas only
    const dR = await readRangeWithFormulas(accessToken, file.id, DELIVERABLES_SHEET, 'A1:Z22');
    const dCompact = (vals, forms) => {
      const out = {};
      for (let c = 0; c < (vals || []).length; c++) {
        const f = forms?.[c];
        const v = vals?.[c];
        if (f || v !== '' && v != null) out[String.fromCharCode(65 + c)] = { value: v, formula: f };
      }
      return out;
    };
    result.deliverables = {
      rowLabels: (dR.values || []).map((row, i) => ({ row: i + 1, A: row?.[0] })),
      row10: dCompact((dR.values || [])[9], (dR.formulas || [])[9]),
      row9: dCompact((dR.values || [])[8], (dR.formulas || [])[8]),
      row11: dCompact((dR.values || [])[10], (dR.formulas || [])[10]),
    };

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}