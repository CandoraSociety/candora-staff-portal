import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW,
  getGraphToken, listCrtFiles
} from '../../shared/crtWorkbook.ts';

// Read the Client Data sheet of a specific CRT workbook (by file_name, e.g.
// "CRT_March_2026.xlsx"; defaults to the active/latest workbook when not
// provided) and return parsed rows keyed the same way parseCrtWorkbook does,
// so the frontend can cross-reference a monthly CRT against the cross-reference
// tab clients (e.g. flag completed / cancelled clients as of that month).

const COLUMNS = [
  'participant_name', 'hsid', 'ceis_dea', 'dea_start_date', 'service_element',
  'service_start_date', 'service_outcome', 'service_outcome_date',
  'placement_outcome', 'placement_outcome_date', 'day30_outcome', 'day30_outcome_date',
  'day60_outcome', 'day60_outcome_date', 'day90_outcome', 'day90_outcome_date',
  'day180_outcome', 'day180_outcome_date', 'comments', 'eda_completion_date',
  'work_exposure', 'wage_subsidy', 'employed_ftpt', 'service_nav_support', 'service_nav_billing_month'
];

// Graph returns date cells as Excel serial numbers (days since 1899-12-30) when
// valuesOnly=true; convert to MM/DD/YY to match the uploaded-parser format.
const cellToString = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') {
    if (v > 30000 && v < 80000) {
      const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const yy = String(d.getUTCFullYear()).slice(-2);
      return `${mm}/${dd}/${yy}`;
    }
    return String(v);
  }
  return String(v).trim();
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const wantedName = String(payload.file_name || '').trim().toLowerCase();

    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);
    let file = wantedName ? files.find(f => f.name.toLowerCase() === wantedName) : null;
    if (!file) file = files[0]; // latest (active) — listCrtFiles is sorted desc
    if (!file) return Response.json({ error: 'No CRT workbook found', rows: [], count: 0 });

    const rangeRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${file.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!rangeRes.ok) return Response.json({ error: 'Failed to read workbook', rows: [], count: 0 });
    const data = await rangeRes.json();
    const values = data.values || [];

    const rows = [];
    for (let i = CLIENT_DATA_START_ROW - 1; i < values.length; i++) {
      const r = values[i];
      if (!r || !r[0] || !String(r[0]).trim()) continue;
      const row = { source_sheet: CLIENT_DATA_SHEET };
      for (let c = 0; c < COLUMNS.length; c++) {
        row[COLUMNS[c]] = cellToString(r[c]);
      }
      rows.push(row);
    }

    return Response.json({ file_name: file.name, rows, count: rows.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}