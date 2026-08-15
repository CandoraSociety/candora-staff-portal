import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import * as XLSX from 'npm:xlsx@0.18.5';

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
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: true });

    const rows = [];
    for (const sheetName of workbook.SheetNames) {
      // Exclude "Sheet1" (case-insensitive, ignores surrounding whitespace)
      if (/^sheet\s*1$/i.test(sheetName.trim())) continue;
      const sheet = workbook.Sheets[sheetName];
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });

      // Find the header row containing "CLIENT NAME" or "HS ID"
      let headerIdx = -1;
      for (let i = 0; i < Math.min(raw.length, 12); i++) {
        const rowStr = (raw[i] || []).map(c => String(c || '').toLowerCase()).join('|');
        if (rowStr.includes('client name') || rowStr.includes('hs id') || rowStr.includes('hsid')) {
          headerIdx = i;
          break;
        }
      }
      if (headerIdx === -1) continue;

      const headers = (raw[headerIdx] || []).map(h => String(h || '').toLowerCase().trim());
      const nameIdx = headers.findIndex(h => h.includes('client name'));
      const hsidIdx = headers.findIndex(h => h.includes('hs id') || h.includes('hsid'));
      const statusIdx = headers.findIndex(h => h === 'status' || h.startsWith('status'));
      const edasIdx = headers.findIndex(h => h.includes('edas'));
      const notesIdx = headers.findIndex(h => h.includes('extra notes') || h.includes('notes'));

      const dataRows = raw.slice(headerIdx + 1).filter(r => r.some(c => String(c || '').trim()));
      for (const r of dataRows) {
        const name = nameIdx >= 0 ? String(r[nameIdx] || '').trim() : '';
        if (!name) continue;
        rows.push({
          source_sheet: sheetName,
          client_name: name,
          hsid: hsidIdx >= 0 ? String(r[hsidIdx] || '').trim() : '',
          status: statusIdx >= 0 ? String(r[statusIdx] || '').trim() : '',
          edas_completed: edasIdx >= 0 ? String(r[edasIdx] || '').trim() : '',
          extra_notes: notesIdx >= 0 ? String(r[notesIdx] || '').trim() : '',
        });
      }
    }
    return Response.json({ rows, count: rows.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}