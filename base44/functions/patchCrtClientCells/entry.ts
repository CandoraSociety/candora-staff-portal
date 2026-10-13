import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getGraphToken, listCrtFiles, formatDateForCrt } from '../../shared/crtWorkbook.ts';
import { patchClientRows } from '../../shared/crtRowPatch.ts';

// Writes CRT cells the portal doesn't manage (30/60/180-day outcomes + dates)
// directly into a matched client's row across every OPEN monthly workbook via
// a targeted single-row PATCH that preserves all other columns. These columns
// are preserved by the entity-triggered CRT sync (it only force-writes
// portal-managed columns), so a direct patch here persists across future
// client updates. Used by the "Edit CRT" inline editor in the Compass
// verification checklist to correct follow-up outcome columns that have no
// corresponding Client entity field (and therefore no automation).

const CELL_COL = {
  day30_outcome: 10,
  day30_outcome_date: 11,
  day60_outcome: 12,
  day60_outcome_date: 13,
  day180_outcome: 16,
  day180_outcome_date: 17,
  service_nav_support: 23,          // X: Service Navigation Support Y/N
  service_nav_billing_month: 24,    // Y: Service Nav Billing Month (MM/DD/YY)
};

// Keys whose value is a date that must be formatted as MM/DD/YY for the CRT
// (the *_date keys plus the billing-month column, which is a date, not text).
const DATE_KEYS = new Set(['day30_outcome_date', 'day60_outcome_date', 'day180_outcome_date', 'service_nav_billing_month']);

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* service-role fallback */ }

    const payload = await req.json().catch(() => ({}));
    const hsid = String(payload.hsid || '').trim();
    const clientName = String(payload.client_name || '').trim();
    const cells = (payload.cells && typeof payload.cells === 'object') ? payload.cells : {};
    if (!hsid && !clientName) return Response.json({ error: 'hsid or client_name required' }, { status: 400 });

    // Normalize incoming cell values: dates → MM/DD/YY (CRT format), text → trimmed.
    const writeVals: Record<number, string> = {};
    for (const [key, raw] of Object.entries(cells)) {
      const col = CELL_COL[key];
      if (col === undefined) continue;
      const v = String(raw ?? '').trim();
      writeVals[col] = (key.endsWith('_date') || DATE_KEYS.has(key)) && v ? (formatDateForCrt(v) || v) : v;
    }

    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);

    let closedNames = new Set();
    try {
      const closed = await base44.asServiceRole.entities.CrtWorkbook.filter({ status: 'closed' });
      closedNames = new Set(closed.map(r => r.file_name));
    } catch { /* default: nothing closed */ }

    const openFiles = files.filter(f => !closedNames.has(f.name));
    const results = await patchClientRows({ accessToken, files: openFiles, hsid, clientName, writeVals });
    const skipped = files.filter(f => closedNames.has(f.name)).map(f => ({ file: f.name, status: 'skipped_closed' }));

    return Response.json({ status: 'success', results: [...results, ...skipped] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}