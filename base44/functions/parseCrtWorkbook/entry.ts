import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import * as XLSX from 'npm:xlsx@0.18.5';

// Column keys we extract from each Career Counsellor CRT sheet
const FIELDS = [
  ['participant_name', 'participant legal name'],
  ['hsid', 'compass hsid'],
  ['email', 'participant email'],
  ['phone', 'participant telephone'],
  ['ceis_dea', 'ceis'],
  ['dea_start_date', 'dea start'],
  ['service_element', 'service element'],
  ['service_start_date', 'service start date'],
  ['service_outcome', 'service outcome'],
  ['service_outcome_date', 'service outcome date'],
  ['placement_outcome', 'placement outcome'],
  ['placement_outcome_date', 'placement outcome date'],
  ['day30_outcome', '30 day outcome'],
  ['day30_outcome_date', '30 day outcome date'],
  ['day60_outcome', '60 day outcome'],
  ['day60_outcome_date', '60 day outcome date'],
  ['day90_outcome', '90 day outcome'],
  ['day90_outcome_date', '90 day outcome date'],
  ['day180_outcome', '180 day outcome'],
  ['day180_outcome_date', '180 day outcome date'],
  ['comments', 'comments'],
  ['eda_completion_date', 'eda completion date'],
  ['work_exposure', 'work exposure'],
  ['wage_subsidy', 'wage subsidy'],
  ['employed_ftpt', 'employed'],
  ['service_nav_support', 'service navigation support'],
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });

    const response = await fetch(file_url);
    if (!response.ok) return Response.json({ error: 'Failed to download file' }, { status: 502 });
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

    const rows = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });

      // Locate the CRT header row. Only counsellor CRT sheets contain
      // "Participant Legal Name" + "COMPASS HSID" + "CEIS (DEA)" — this naturally
      // excludes the Service Navigator sheet (Dawn) and all reference sheets.
      let headerIdx = -1;
      for (let i = 0; i < Math.min(raw.length, 15); i++) {
        const rowStr = (raw[i] || []).map(c => String(c || '').toLowerCase()).join('|');
        if (rowStr.includes('participant legal name') &&
            rowStr.includes('compass hsid') &&
            rowStr.includes('ceis')) {
          headerIdx = i;
          break;
        }
      }
      if (headerIdx === -1) continue;

      const headers = (raw[headerIdx] || []).map(h =>
        String(h || '').toLowerCase().replace(/\s+/g, ' ').trim()
      );

      // Map each field to a column index. Date columns ("30 day outcome date")
      // are matched on their full string so they don't collide with the outcome column.
      const colIdx = {};
      for (const [key, needle] of FIELDS) {
        if (key.endsWith('_date')) {
          colIdx[key] = headers.findIndex(h => h === needle || h === needle.replace('date', ' date').trim() || h.includes(needle));
        } else {
          colIdx[key] = headers.findIndex(h => h.includes(needle));
        }
      }

      // Data rows follow the header. Skip empty rows and the "Last Name, First Name" /
      // "MM/DD/YY" format-hint row that sits directly under the header in some sheets.
      const dataRows = raw.slice(headerIdx + 1).filter(r => r.some(c => String(c || '').trim()));
      for (const r of dataRows) {
        const name = colIdx.participant_name >= 0 ? String(r[colIdx.participant_name] || '').trim() : '';
        if (!name) continue;
        const lower = name.toLowerCase();
        if (lower === 'last name, first name' || lower.includes('mm/dd')) continue;

        const row = { source_sheet: sheetName };
        for (const [key] of FIELDS) {
          row[key] = colIdx[key] >= 0 ? String(r[colIdx[key]] || '').trim() : '';
        }
        rows.push(row);
      }
    }
    return Response.json({ rows, count: rows.length, sheets: rows.map(r => r.source_sheet) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}