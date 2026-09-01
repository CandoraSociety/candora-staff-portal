import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW,
  getGraphToken, getActiveCrtWorkbook, listCrtFiles, parseCrtDate
} from '../../shared/crtWorkbook.ts';

// Reads the CRT Client Data sheet for the selected billing month(s) and returns
// EVERY client present in that month's workbook — the full billing roster to
// verify against Compass, not just clients with a dated change that month.
// Results are de-duplicated: a client in multiple months appears once, with the
// months they appear in listed and their fields taken from the latest month's
// snapshot (most current). Filled fields (columns A–R, plus S = Comments) are
// returned as a checklist of what should be reflected in Compass.
//
// Columns T–Y (Placement Outcome Date mirror, Work Exposure, Wage Subsidy,
// Employed FT/PT, Service Navigation, Service Nav Billing Month) are excluded
// — they're auto-derived flags, not Compass entry fields.

const COLUMNS = [
  { idx: 0, label: 'Client Legal Name' },
  { idx: 1, label: 'COMPASS HSID #' },
  { idx: 2, label: 'CEIS (DEA)' },
  { idx: 3, label: 'DEA Start Date', date: true },
  { idx: 4, label: 'Service Element' },
  { idx: 5, label: 'Service Start Date', date: true },
  { idx: 6, label: 'Service Outcome' },
  { idx: 7, label: 'Service Outcome Date', date: true },
  { idx: 8, label: 'Placement Outcome' },
  { idx: 9, label: 'Placement Outcome Date', date: true },
  { idx: 10, label: '30 Day Outcome' },
  { idx: 11, label: '30 Day Outcome Date', date: true },
  { idx: 12, label: '60 Day Outcome' },
  { idx: 13, label: '60 Day Outcome Date', date: true },
  { idx: 14, label: '90 Day Outcome' },
  { idx: 15, label: '90 Day Outcome Date', date: true },
  { idx: 16, label: '180 Day Outcome' },
  { idx: 17, label: '180 Day Outcome Date', date: true },
  { idx: 18, label: 'Comments' },
];
const DATE_COL_INDICES = COLUMNS.filter((c) => c.date).map((c) => c.idx);
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function currentMonthEdmonton() {
  const s = new Date().toLocaleString('en-US', { timeZone: 'America/Edmonton', month: '2-digit', year: 'numeric' });
  const [mon, yr] = s.split('/');
  return `${yr}-${mon}`;
}

function findWorkbookForMonth(files, billingMonth) {
  const [y, m] = String(billingMonth).split('-').map(Number);
  if (!y || !m) return null;
  const target = `CRT_${MONTH_NAMES[m - 1]}_${y}`;
  return (files || []).find((f) => f.name === target) || null;
}

// Token-sort normalized name for HSID-less de-dup.
const normName = (s) => String(s || '').toLowerCase().replace(/,/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    let months: string[] = [];
    if (Array.isArray(payload?.months)) months = payload.months.map(String).filter(Boolean);
    else if (payload?.billingMonth) months = [String(payload.billingMonth)];
    if (months.length === 0) months = [currentMonthEdmonton()];
    months = Array.from(new Set(months)).sort();

    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);

    // HSID → portal client lookup (shared across all months).
    let hsidToClient: Record<string, any> = {};
    try {
      const clients = (await base44.asServiceRole.entities.Client.list('-created_date', 3000)) || [];
      for (const c of clients) {
        if (c.compass_hsid) hsidToClient[String(c.compass_hsid).trim()] = { id: c.id, assigned_worker_name: c.assigned_worker_name || '' };
      }
    } catch { /* lookup is optional */ }

    // Per-month counts (how many clients had activity that month — before de-dup).
    const monthCounts: { month: string; count: number }[] = [];
    // De-dup map: key (hsid or norm name) → merged entry.
    const byKey: Record<string, any> = {};

    for (const bm of months) {
      let workbook = findWorkbookForMonth(files, bm);
      if (!workbook) {
        try { workbook = await getActiveCrtWorkbook(accessToken); } catch { workbook = null; }
      }
      if (!workbook) { monthCounts.push({ month: bm, count: 0 }); continue; }

      const rangeRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbook.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!rangeRes.ok) { monthCounts.push({ month: bm, count: 0 }); continue; }
      const rangeData = await rangeRes.json();
      const values = rangeData.values || [];

      let monthActive = 0;
      for (let i = CLIENT_DATA_START_ROW - 1; i < values.length; i++) {
        const row = values[i];
        if (!row) continue;
        const name = String(row[0] || '').trim();
        if (!name) continue;

        // Include EVERY client present in this month's CRT Client Data sheet.
        // The verification checklist must cover the full billing roster for the
        // month — not only clients with a dated change that month — so active
        // clients whose service started in a prior month (and have no new dated
        // event this month) are still surfaced for Compass verification.
        monthActive++;

        const hsid = String(row[1] || '').trim();
        const key = hsid || normName(name);

        const fields: any[] = [];
        for (const c of COLUMNS) {
          const raw = row[c.idx];
          const val = (raw == null ? '' : String(raw).trim());
          if (!val) continue;
          const display = c.date ? (parseCrtDate(val) || val) : val;
          fields.push({ label: c.label, value: display });
        }
        const linked = hsid ? hsidToClient[hsid] : null;

        const existing = byKey[key];
        if (existing) {
          // Track the month; overwrite fields with the latest month's snapshot
          // (months iterate ascending, so the last write is the most recent).
          if (!existing.active_months.includes(bm)) existing.active_months.push(bm);
          existing.fields = fields;
          existing.month = bm;
          existing.row_number = i + 1;
          existing.workbook = workbook.name;
        } else {
          byKey[key] = {
            client_name: name,
            hsid,
            row_number: i + 1,
            client_id: linked?.id || null,
            assigned_worker_name: linked?.assigned_worker_name || '',
            active_months: [bm],
            month: bm,
            workbook: workbook.name,
            fields,
          };
        }
      }
      monthCounts.push({ month: bm, count: monthActive });
    }

    const items = Object.values(byKey).sort((a, b) =>
      (a.client_name || '').localeCompare(b.client_name || '')
    );

    return Response.json({ status: 'success', items, month_counts: monthCounts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}