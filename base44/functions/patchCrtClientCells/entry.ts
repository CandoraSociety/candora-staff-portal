import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW, NUM_COLUMNS,
  getGraphToken, listCrtFiles, formatDateForCrt
} from '../../shared/crtWorkbook.ts';

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

const NORM = (s) => String(s || '').toLowerCase().replace(/,/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

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

    const results = [];
    for (const f of files) {
      if (closedNames.has(f.name)) { results.push({ file: f.name, status: 'skipped_closed' }); continue; }
      try {
        const rangeRes = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!rangeRes.ok) { results.push({ file: f.name, status: 'error', error: 'read failed' }); continue; }
        const data = await rangeRes.json();
        const values = (data.values || []).map((r) => {
          const p = [...r];
          while (p.length < NUM_COLUMNS) p.push('');
          return p.slice(0, NUM_COLUMNS);
        });

        let rowIdx = -1;
        if (hsid) {
          for (let i = CLIENT_DATA_START_ROW - 1; i < values.length; i++) {
            if (values[i] && String(values[i][1] || '').trim() === hsid) { rowIdx = i; break; }
          }
        }
        if (rowIdx < 0 && clientName) {
          const nk = NORM(clientName);
          for (let i = CLIENT_DATA_START_ROW - 1; i < values.length; i++) {
            if (values[i] && NORM(values[i][0] || '') === nk) { rowIdx = i; break; }
          }
        }
        if (rowIdx < 0) { results.push({ file: f.name, status: 'no_match' }); continue; }

        const row = [...values[rowIdx]];
        for (const [colStr, v] of Object.entries(writeVals)) row[Number(colStr)] = v;

        const rangeAddress = `A${rowIdx + 1}:Y${rowIdx + 1}`;
        const patchRes = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='${rangeAddress}')`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [row] }),
          }
        );
        if (!patchRes.ok) {
          const errText = await patchRes.text().catch(() => '');
          results.push({ file: f.name, status: 'error', error: 'write failed: ' + errText.slice(0, 200) });
          continue;
        }
        results.push({ file: f.name, status: 'patched', row: rowIdx + 1 });
      } catch (e) {
        results.push({ file: f.name, status: 'error', error: String(e.message || e).slice(0, 200) });
      }
    }

    return Response.json({ status: 'success', results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}