import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_ID, getGraphToken, listCrtFiles, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW } from '../../shared/crtWorkbook.ts';

const EMPLOYED = ['E-RF', 'E-UF', 'SE'];

function toISO(d) {
  if (!d) return '';
  const date = new Date(d.length === 10 ? d + 'T12:00:00' : d);
  return isNaN(date.getTime()) ? '' : `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function serialToISO(serial) {
  if (!serial || typeof serial !== 'number') return '';
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return isNaN(d.getTime()) ? '' : `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* ok */ }
    const token = await getGraphToken();
    const files = await listCrtFiles(token);
    const file = files.find(f => f.name === 'CRT_June_2026.xlsx');
    if (!file) return Response.json({ error: 'June workbook not found' });

    // Read Client Data E, G, H (cols 5,7,8) + A (name) for rows 14-200
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${file.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/range(address='A14:Y200')`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    const values = data.values || [];

    // B8/B9 for June = 46174 (June 1) .. 46203 (June 30)
    const juneStart = 46174, juneEnd = 46203;
    const sheetMatches = [];
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      if (!row) continue;
      const excelRow = 14 + i;
      const E = String(row[4] || '').trim();   // Service Element
      const G = String(row[6] || '').trim();   // Service Outcome
      const H = row[7];                         // Service Outcome Date (serial or string)
      const Hserial = typeof H === 'number' ? H : null;
      const Hiso = serialToISO(Hserial) || toISO(String(H));
      if (E === 'WD' && G === 'Complete' && Hserial >= juneStart && Hserial <= juneEnd) {
        sheetMatches.push({ excelRow, name: row[0], E, G, H, Hiso });
      }
    }

    // Portal computation: WD clients with G="Complete" + H in June
    const clients = await base44.asServiceRole.entities.Client.list('-created_date', 5000);
    const monthEnd = new Date(Date.UTC(2026, 5, 30, 23, 59, 59));
    const gate = (ds) => {
      if (!monthEnd || !ds) return true;
      const d = new Date(ds.length === 10 ? ds + 'T12:00:00' : ds);
      return isNaN(d.getTime()) || d.getTime() <= monthEnd.getTime();
    };
    const portalMatches = [];
    for (const c of clients) {
      if (c.service_type !== 'pathways') continue;
      const edaOK = gate(c.eda_completion_date);
      let G = 'In Progress', H = '';
      if (edaOK && c.eda_completion_date) {
        G = 'Complete';
        H = toISO(c.eda_completion_date);
      } else if (c.program_status === 'complete') {
        G = 'Complete';
        H = gate(c.completion_date) ? toISO(c.completion_date) : '';
      } else if (c.program_status === 'cancelled') { G = 'Cancelled'; }
      else if (c.program_status === 'incomplete') { G = 'Incomplete'; }
      const junePrefix = '2026-06';
      if (G === 'Complete' && H && H.slice(0,7) === junePrefix) {
        portalMatches.push({ name: `${c.last_name}, ${c.first_name}`, G, H, eda: c.eda_completion_date, comp: c.completion_date, program_status: c.program_status });
      }
    }

    // Cross-reference: find sheet names not in portal
    const normName = (s) => String(s||'').toLowerCase().replace(/,/g,' ').split(/\s+/).filter(Boolean).sort().join(' ');
    const portalNames = new Set(portalMatches.map(p => normName(p.name)));
    const onlyInSheet = sheetMatches.filter(s => !portalNames.has(normName(s.name)));
    const sheetNames = new Set(sheetMatches.map(s => normName(s.name)));
    const onlyInPortal = portalMatches.filter(p => !sheetNames.has(normName(p.name)));

    return Response.json({
      sheetCount: sheetMatches.length,
      portalCount: portalMatches.length,
      onlyInSheet,
      onlyInPortal,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}