import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getGraphToken, listCrtFiles, formatDateForCrt } from '../../shared/crtWorkbook.ts';
import { patchClientRows } from '../../shared/crtRowPatch.ts';

// Writes selected placement/follow-up cells into the matched client's row
// across OPEN workbooks, preserving every other column. WD placement values
// should also be saved on Client; DEA doesn't populate I/J automatically, so
// its explicit manual placement values are preserved by normal CRT sync.
// Also used by the Compass inline editor for 30/60/180-day outcome corrections.

const CELL_COL = {
  placement_outcome: 8,              // I: Placement Outcome
  placement_outcome_date: 9,         // J: Placement Outcome Date
  day30_outcome: 10,
  day30_outcome_date: 11,
  day60_outcome: 12,
  day60_outcome_date: 13,
  day180_outcome: 16,
  day180_outcome_date: 17,
  service_nav_support: 23,          // X: Service Navigation Support Y/N
  service_nav_billing_month: 24,    // Y: Service Nav Billing Month (MM/DD/YY)
};

// Column T (EDA Completion Date) mirrors the Placement Outcome Date whenever the
// placement outcome is employed — same rule the full CRT sync applies — so a
// manually patched E-RF/E-UF/SE placement fills T too instead of leaving it blank.
const EMPLOYED_OUTCOMES = ['E-RF', 'E-UF', 'SE'];

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

    // Employed placement → T mirrors the placement date (cleared when the
    // outcome is not employed or the date is blanked).
    if ('placement_outcome' in (cells as any)) {
      const outcome = String((cells as any).placement_outcome ?? '').trim();
      const date = writeVals[CELL_COL.placement_outcome_date] || '';
      writeVals[19] = EMPLOYED_OUTCOMES.includes(outcome) ? date : '';
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