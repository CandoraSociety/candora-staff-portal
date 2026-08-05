import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW,
  getGraphToken, getActiveCrtWorkbook, listCrtFiles, applyDefaultSheet
} from '../../shared/crtWorkbook.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = await getGraphToken();
    const activeWorkbook = await getActiveCrtWorkbook(accessToken);

    if (!activeWorkbook) {
      return Response.json({
        status: 'no_workbook',
        message: 'No CRT workbook found in _DEPT_Pathways. Upload or create one from the master template.',
        files: await listCrtFiles(accessToken),
      });
    }

    // Get embed/preview URL for the workbook
    let embedUrl = null;
    try {
      const previewRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${activeWorkbook.id}/preview`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: '{}'
        }
      );
      if (previewRes.ok) {
        const previewData = await previewRes.json();
        embedUrl = applyDefaultSheet(previewData.getUrl || null);
      }
    } catch (e) { /* preview is optional */ }

    // Count client rows in the workbook (read column A from row 15)
    let clientCount = 0;
    let submissionRange = { start: '', end: '' };
    let outcomesRange = { start: '', end: '' };
    // Graph returns date cells as Excel serial numbers (days since 1899-12-30)
    // when valuesOnly=true; convert back to an ISO date for display.
    const cellToISO = (v) => {
      if (typeof v === 'number' && v > 0) {
        return new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000).toISOString().slice(0, 10);
      }
      if (v && typeof v === 'string') return v;
      return '';
    };
    try {
      const rangeRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${activeWorkbook.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (rangeRes.ok) {
        const rangeData = await rangeRes.json();
        const values = rangeData.values || [];
        // Submission range is in row 8: B8 = start, E8 = end
        if (values[7]) {
          submissionRange.start = cellToISO(values[7][1]);
          submissionRange.end = cellToISO(values[7][4]);
        }
        // Count rows from row 15 that have a name in column A
        for (let i = CLIENT_DATA_START_ROW - 1; i < values.length; i++) {
          if (values[i] && values[i][0] && String(values[i][0]).trim()) {
            clientCount++;
          }
        }
      }
    } catch (e) { /* range read is optional */ }

    // Read Outcomes Report B9:B10 (merged B9:C9 / B10:C10) to see what's actually there.
    try {
      const orRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${activeWorkbook.id}/workbook/worksheets('Outcomes Report')/range(address='B9:B10')`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (orRes.ok) {
        const orData = await orRes.json();
        const vals = orData.values || [];
        outcomesRange.start = cellToISO(vals[0]?.[0]);
        outcomesRange.end = cellToISO(vals[1]?.[0]);
      }
    } catch (e) { /* optional */ }

    // Open/closed status per file (default 'open' when no record exists yet)
    let statusMap = {};
    try {
      const recs = await base44.asServiceRole.entities.CrtWorkbook.list();
      for (const r of recs) statusMap[r.file_name] = r.status;
    } catch { /* default open */ }
    const allFiles = (await listCrtFiles(accessToken)).map(f => ({
      id: f.id, name: f.name, webUrl: f.webUrl, lastModifiedDateTime: f.lastModifiedDateTime,
      crtStatus: statusMap[f.name] || 'open',
    }));

    return Response.json({
      status: 'success',
      outcomesRange,
      submissionRange,
      activeWorkbook: {
        id: activeWorkbook.id,
        name: activeWorkbook.name,
        webUrl: activeWorkbook.webUrl,
        embedUrl,
        createdDateTime: activeWorkbook.createdDateTime,
        lastModifiedDateTime: activeWorkbook.lastModifiedDateTime,
        size: activeWorkbook.size,
        crtStatus: statusMap[activeWorkbook.name] || 'open',
      },
      clientCount,
      allFiles,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}