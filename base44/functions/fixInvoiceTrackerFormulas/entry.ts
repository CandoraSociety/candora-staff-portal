import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_ID, getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';
import { findInvoiceTrackerSheet } from '../../shared/invoiceTracker.ts';
import { patchProtectedSheet } from '../../shared/crtDatePatch.ts';

// Fixes the locked row-10 billing-summary formulas in the Invoice Tracker
// sheet of every open CRT workbook. The funder's template had several
// formulas that computed the wrong metric for their column label:
//
//   • Column X  (WD Complete)               — was counting EDA completion
//     (G="Complete" & H in month) instead of employed placement
//     (I in E-RF/E-UF/SE & J in month).
//   • Column AN (WD Placement EDA Completion) — was counting T (EDA date) in
//     month without a G="Complete" filter; now uses G="Complete" & H in
//     month to match the portal's wdPlacementCompletion definition
//     (catches legacy clients whose H is set from completion_date, not T).
//   • Columns BH / BL (DEA / WD 90 Day)      — were including "FTT" (Further
//     Training) in the employed-outcome set; the portal only counts E-RF,
//     E-UF, SE as employed for 90-day billing. FTT terms removed.
//
// The formulas are idempotent — only written when the current formula doesn't
// match the expected one (so re-running is safe and cheap).

const ROW = 10;
const CLIENT_DATA = "'Client Data'";

// Expected (corrected) formulas — aligned with the portal's billing-count
// definitions in base44/shared/crtBillingCounts.ts.
const EXPECTED_FORMULAS: Record<string, string> = {
  // X — WD Complete: employed placement (I in E-RF/E-UF/SE) with J in [B8,B9]
  X: `=SUMPRODUCT((${CLIENT_DATA}!$E$14:$E$15002="WD")*(${CLIENT_DATA}!$I$14:$I$15002="E-RF")*(${CLIENT_DATA}!$J$14:$J$15002>=$B$8)*(${CLIENT_DATA}!$J$14:$J$15002<=$B9))+SUMPRODUCT((${CLIENT_DATA}!$E$14:$E$15002="WD")*(${CLIENT_DATA}!$I$14:$I$15002="E-UF")*(${CLIENT_DATA}!$J$14:$J$15002>=$B$8)*(${CLIENT_DATA}!$J$14:$J$15002<=$B9))+SUMPRODUCT((${CLIENT_DATA}!$E$14:$E$15002="WD")*(${CLIENT_DATA}!$I$14:$I$15002="SE")*(${CLIENT_DATA}!$J$14:$J$15002>=$B$8)*(${CLIENT_DATA}!$J$14:$J$15002<=$B9))`,
  // AN — WD Placement (EDA Completion): G="Complete" & H in [B8,B9]
  AN: `=SUMPRODUCT((${CLIENT_DATA}!$E$14:$E$15002="WD")*(${CLIENT_DATA}!$G$14:$G$15002="Complete")*(${CLIENT_DATA}!$H$14:$H$15002>=$B$8)*(${CLIENT_DATA}!$H$14:$H$15002<=$B9))`,
  // BH — CEIS (DEA) 90 Day: O in E-RF/E-UF/SE & P in [B8,B9] (CEIS + legacy CEIS)
  BH: `=SUMPRODUCT((${CLIENT_DATA}!$E$14:$E$15002="CEIS")*(${CLIENT_DATA}!$O$14:$O$15002="E-RF")*(${CLIENT_DATA}!$P$14:$P$15002>=$B$8)*(${CLIENT_DATA}!$P$14:$P$15002<=$B$9))+SUMPRODUCT((${CLIENT_DATA}!$E$14:$E$15002="CEIS")*(${CLIENT_DATA}!$O$14:$O$15002="E-UF")*(${CLIENT_DATA}!$P$14:$P$15002>=$B$8)*(${CLIENT_DATA}!$P$14:$P$15002<=$B$9))+SUMPRODUCT((${CLIENT_DATA}!$E$14:$E$15002="CEIS")*(${CLIENT_DATA}!$O$14:$O$15002="SE")*(${CLIENT_DATA}!$P$14:$P$15002>=$B$8)*(${CLIENT_DATA}!$P$14:$P$15002<=$B$9))+SUMPRODUCT((${CLIENT_DATA}!$C$14:$C$15002="Yes")*(${CLIENT_DATA}!$E$14:$E$15002="")*(${CLIENT_DATA}!$O$14:$O$15002="E-RF")*(${CLIENT_DATA}!$P$14:$P$15002>=$B$8)*(${CLIENT_DATA}!$P$14:$P$15002<=$B$9))+SUMPRODUCT((${CLIENT_DATA}!$C$14:$C$15002="Yes")*(${CLIENT_DATA}!$E$14:$E$15002="")*(${CLIENT_DATA}!$O$14:$O$15002="E-UF")*(${CLIENT_DATA}!$P$14:$P$15002>=$B$8)*(${CLIENT_DATA}!$P$14:$P$15002<=$B$9))+SUMPRODUCT((${CLIENT_DATA}!$C$14:$C$15002="Yes")*(${CLIENT_DATA}!$E$14:$E$15002="")*(${CLIENT_DATA}!$O$14:$O$15002="SE")*(${CLIENT_DATA}!$P$14:$P$15002>=$B$8)*(${CLIENT_DATA}!$P$14:$P$15002<=$B$9))`,
  // BL — WD 90 Day: O in E-RF/E-UF/SE & P in [B8,B9]
  BL: `=SUMPRODUCT((${CLIENT_DATA}!$E$14:$E$15002="WD")*(${CLIENT_DATA}!$O$14:$O$15002="E-RF")*(${CLIENT_DATA}!$P$14:$P$15002>=$B$8)*(${CLIENT_DATA}!$P$14:$P$15002<=$B$9))+SUMPRODUCT((${CLIENT_DATA}!$E$14:$E$15002="WD")*(${CLIENT_DATA}!$O$14:$O$15002="E-UF")*(${CLIENT_DATA}!$P$14:$P$15002>=$B$8)*(${CLIENT_DATA}!$P$14:$P$15002<=$B$9))+SUMPRODUCT((${CLIENT_DATA}!$E$14:$E$15002="WD")*(${CLIENT_DATA}!$O$14:$O$15002="SE")*(${CLIENT_DATA}!$P$14:$P$15002>=$B$8)*(${CLIENT_DATA}!$P$14:$P$15002<=$B$9))`,
};

// Read the current formula in a single cell (returns the formula string or "").
async function readCellFormula(accessToken, workbookId, sheetName, cellAddress) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbookId}/workbook/worksheets('${sheetName}')/range(address='${cellAddress}')`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return { error: `${res.status}` };
  const data = await res.json();
  return { formula: (data.formulas?.[0]?.[0]) || '', value: data.values?.[0]?.[0] };
}

// Write a formula to a single cell, handling sheet protection.
async function writeFormula(accessToken, workbookId, sheetName, cellAddress, formula) {
  // Graph API treats values starting with "=" as formulas.
  await patchProtectedSheet(accessToken, workbookId, sheetName, [
    { cell: cellAddress, value: formula },
  ]);
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* service role ok */ }

    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);

    // Determine which workbooks are open (not archived/closed).
    let openFileNames: Set<string>;
    try {
      const openWbs = await base44.asServiceRole.entities.CrtWorkbook.filter({ status: 'open' });
      openFileNames = new Set(openWbs.map(w => w.file_name));
    } catch {
      openFileNames = new Set(files.map(f => f.name)); // fallback: fix all
    }

    const filesToFix = files.filter(f => openFileNames.has(f.name));
    const results = [];

    for (const file of filesToFix) {
      const sheetName = await findInvoiceTrackerSheet(accessToken, file.id);
      if (!sheetName) {
        results.push({ workbook: file.name, status: 'no_sheet' });
        continue;
      }

      const fixed = [];
      const skipped = [];
      const errors = [];

      for (const [col, expectedFormula] of Object.entries(EXPECTED_FORMULAS)) {
        const cellAddress = `${col}${ROW}`;
        try {
          const current = await readCellFormula(accessToken, file.id, sheetName, cellAddress);
          if (current.error) {
            errors.push({ col, error: `read: ${current.error}` });
            continue;
          }
          // Normalize: trim and collapse whitespace for comparison
          const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
          if (norm(current.formula) === norm(expectedFormula)) {
            skipped.push(col);
            continue;
          }
          // Formula doesn't match — write the corrected one
          try {
            await writeFormula(accessToken, file.id, sheetName, cellAddress, expectedFormula);
            fixed.push(col);
          } catch (e) {
            errors.push({ col, error: String(e.message || e).slice(0, 150) });
          }
        } catch (e) {
          errors.push({ col, error: String(e.message || e).slice(0, 150) });
        }
      }

      results.push({
        workbook: file.name,
        fixed: fixed.length ? fixed : undefined,
        skipped: skipped.length ? skipped : undefined,
        errors: errors.length ? errors : undefined,
      });
    }

    return Response.json({
      status: 'success',
      workbooksChecked: filesToFix.length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}