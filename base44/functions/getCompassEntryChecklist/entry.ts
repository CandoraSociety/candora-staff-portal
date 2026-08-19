import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW,
  getGraphToken, getActiveCrtWorkbook, listCrtFiles, parseCrtDate
} from '../../shared/crtWorkbook.ts';

// Reads the CRT Client Data sheet for the selected billing month and returns
// every client who had activity in that month — recognized by ANY date column
// in their row falling within the selected month. For each active client the
// filled fields (columns A–R) are returned as a checklist of what should be
// reflected in Compass.
//
// Columns S–Y (Comments + the trailing derived flags: Placement Outcome Date
// mirror, Work Exposure, Wage Subsidy, Employed FT/PT, Service Navigation,
// Service Nav Billing Month) are excluded — they're free-text or auto-derived,
// not Compass entry fields.

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

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const billingMonth = payload?.billingMonth || currentMonthEdmonton();

    const accessToken = await getGraphToken();
    let workbook = findWorkbookForMonth(await listCrtFiles(accessToken), billingMonth);
    if (!workbook) workbook = await getActiveCrtWorkbook(accessToken);
    if (!workbook) return Response.json({ status: 'no_workbook', billingMonth });

    // Read the Client Data sheet used range.
    const rangeRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${workbook.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!rangeRes.ok) return Response.json({ status: 'read_error', billingMonth, workbook: workbook.name, error: await rangeRes.text() });
    const rangeData = await rangeRes.json();
    const values = rangeData.values || [];

    // HSID → portal client lookup (for the optional "View Client" link).
    let hsidToClient: Record<string, any> = {};
    try {
      const clients = (await base44.asServiceRole.entities.Client.list('-created_date', 3000)) || [];
      for (const c of clients) {
        if (c.compass_hsid) hsidToClient[String(c.compass_hsid).trim()] = { id: c.id, assigned_worker_name: c.assigned_worker_name || '' };
      }
    } catch { /* lookup is optional */ }

    const items: any[] = [];
    for (let i = CLIENT_DATA_START_ROW - 1; i < values.length; i++) {
      const row = values[i];
      if (!row) continue;
      const name = String(row[0] || '').trim();
      if (!name) continue;

      // Activity in the selected month = any date column parses to a date in billingMonth.
      let active = false;
      for (const di of DATE_COL_INDICES) {
        const d = parseCrtDate(row[di]);
        if (d && d.slice(0, 7) === billingMonth) { active = true; break; }
      }
      if (!active) continue;

      const hsid = String(row[1] || '').trim();
      const fields: any[] = [];
      for (const c of COLUMNS) {
        const raw = row[c.idx];
        const val = (raw == null ? '' : String(raw).trim());
        if (!val) continue;
        const display = c.date ? (parseCrtDate(val) || val) : val;
        fields.push({ label: c.label, value: display });
      }
      const linked = hsid ? hsidToClient[hsid] : null;
      items.push({
        client_name: name,
        hsid,
        row_number: i + 1,
        client_id: linked?.id || null,
        assigned_worker_name: linked?.assigned_worker_name || '',
        fields,
      });
    }

    return Response.json({ status: 'success', billingMonth, workbook: workbook.name, count: items.length, items });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}