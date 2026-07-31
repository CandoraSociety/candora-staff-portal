import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, CLIENT_DATA_SHEET, CLIENT_DATA_START_ROW,
  getGraphToken, getActiveCrtWorkbook, listCrtFiles
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
        embedUrl = previewData.getUrl || null;
      }
    } catch (e) { /* preview is optional */ }

    // Count client rows in the workbook (read column A from row 15)
    let clientCount = 0;
    let submissionRange = { start: '', end: '' };
    try {
      const rangeRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${activeWorkbook.id}/workbook/worksheets('${CLIENT_DATA_SHEET}')/usedRange(valuesOnly=true)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (rangeRes.ok) {
        const rangeData = await rangeRes.json();
        const values = rangeData.values || [];
        // Submission range is in row 9: B9 = start, E9 = end
        if (values[8]) {
          submissionRange.start = values[8][1] || '';
          submissionRange.end = values[8][4] || '';
        }
        // Count rows from row 15 that have a name in column A
        for (let i = CLIENT_DATA_START_ROW - 1; i < values.length; i++) {
          if (values[i] && values[i][0] && String(values[i][0]).trim()) {
            clientCount++;
          }
        }
      }
    } catch (e) { /* range read is optional */ }

    return Response.json({
      status: 'success',
      activeWorkbook: {
        id: activeWorkbook.id,
        name: activeWorkbook.name,
        webUrl: activeWorkbook.webUrl,
        embedUrl,
        createdDateTime: activeWorkbook.createdDateTime,
        lastModifiedDateTime: activeWorkbook.lastModifiedDateTime,
        size: activeWorkbook.size,
      },
      submissionRange,
      clientCount,
      allFiles: (await listCrtFiles(accessToken)).map(f => ({
        id: f.id, name: f.name, webUrl: f.webUrl, lastModifiedDateTime: f.lastModifiedDateTime
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}