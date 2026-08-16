import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, listCrtFiles, getActiveCrtWorkbook } from '../../shared/crtWorkbook.ts';
import { syncNarrativeReportIntoWorkbook } from '../../shared/narrativeReport.ts';

// Sync the "Narrative Report" sheet of one or more monthly CRT workbooks so
// its Reporting Period (Start/End) reflects the workbook's own month and only
// Category/Summary text for that reporting month is shown (stale carry-over
// narrative from a previous month is cleared).
//
// Payload:
//   {}                         → sync the active (latest) workbook
//   { workbookName: "..." }     → sync a single named CRT workbook
//   { all: true }              → sync every open (non-closed) CRT workbook
//
// Used manually from the portal and by the scheduled CRT sync.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    // Allow both user calls and service-role scheduled runs.
    try { await base44.auth.me(); } catch { /* scheduled — service role */ }

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }

    const accessToken = await getGraphToken();

    // Resolve the set of workbooks to process.
    let workbooks = [];
    if (payload?.workbookName) {
      const files = await listCrtFiles(accessToken);
      const match = files.find(f => f.name.toLowerCase() === String(payload.workbookName).toLowerCase());
      if (!match) {
        return Response.json({ status: 'not_found', message: 'No CRT workbook named "' + payload.workbookName + '".' });
      }
      workbooks = [match];
    } else if (payload?.all) {
      workbooks = await listCrtFiles(accessToken);
    } else {
      const active = await getActiveCrtWorkbook(accessToken);
      if (!active) {
        return Response.json({ status: 'no_workbook', message: 'No active CRT workbook found in SharePoint.' });
      }
      workbooks = [active];
    }

    // Skip closed (frozen) workbooks, mirroring the client-data sync.
    let closedNames = new Set();
    try {
      const closed = await base44.asServiceRole.entities.CrtWorkbook.filter({ status: 'closed' });
      closedNames = new Set(closed.map(r => r.file_name));
    } catch { /* default: nothing closed */ }

    const results = [];
    for (const wb of workbooks) {
      if (closedNames.has(wb.name)) { results.push({ file: wb.name, status: 'skipped_closed' }); continue; }
      try {
        const r = await syncNarrativeReportIntoWorkbook(accessToken, wb);
        results.push({ file: wb.name, ...r });
      } catch (e) {
        results.push({ file: wb.name, status: 'error', error: e.message });
      }
    }

    return Response.json({ status: 'success', results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}