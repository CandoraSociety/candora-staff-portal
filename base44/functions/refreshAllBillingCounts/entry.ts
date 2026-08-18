import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';
import { refreshBillingCounts } from '../../shared/invoiceTrackerCounts.ts';

// Refreshes the Invoice Tracker billing-summary counts (CEIS (DEA) Starters,
// WD Complete, WD Placement (EDA Completion), CEIS (DEA) 90 Day, WD 90 Day,
// Service Navigation Fee) plus the paid-work-exposure dollar total on EVERY
// open monthly CRT workbook — each capped at its own month-end so a prior-month
// workbook only contains data through that month. Used to apply billing-logic
// changes retroactively across all open months in one pass.
//
// Idempotent: cells already holding the correct value are skipped. Closed
// (frozen) workbooks are skipped.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* service role ok */ }

    const token = await getGraphToken();
    const files = await listCrtFiles(token);
    if (!files.length) return Response.json({ status: 'no_workbook', message: 'No CRT workbooks found.' });

    let closedNames = new Set();
    try {
      const closed = await base44.asServiceRole.entities.CrtWorkbook.filter({ status: 'closed' });
      closedNames = new Set(closed.map(r => r.file_name));
    } catch { /* default: nothing closed */ }

    const openFiles = files.filter(f => !closedNames.has(f.name));

    // Fetch all clients + financial records once and reuse across workbooks.
    let allClients = [];
    try { allClients = await base44.asServiceRole.entities.Client.list('-created_date', 5000) || []; } catch { /* empty */ }
    let allFinancialRecords = [];
    try { allFinancialRecords = await base44.asServiceRole.entities.FinancialRecord.list('-date', 5000) || []; } catch { /* empty */ }
    const preFetched = { clients: allClients, financialRecords: allFinancialRecords };

    const perWorkbook = [];
    for (const f of openFiles) {
      try {
        const r = await refreshBillingCounts(base44, token, f, undefined, preFetched);
        perWorkbook.push({
          workbook: f.name,
          status: r.status,
          countFilled: r.countFilled?.length || 0,
          countSkipped: r.countSkipped || 0,
          countErrors: r.countErrors?.length || 0,
          dFilled: r.dFilled?.length || 0,
        });
      } catch (e) {
        perWorkbook.push({ workbook: f.name, status: 'error', error: String(e.message || e).slice(0, 200) });
      }
    }

    return Response.json({ status: 'success', workbooks: perWorkbook });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}