import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  DRIVE_ID, getGraphToken, listCrtFiles
} from '../../shared/crtWorkbook.ts';

// Read-only diagnostic: lists ALL CRT files + each file's worksheet names only
// (no cell reads) to keep it fast. Reconciles which file staff look at.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);

    const out = [];
    for (const f of files) {
      const entry = { file: f.name, id: f.id, worksheetCount: 0, worksheets: [], error: null };
      try {
        const sheetsRes = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${f.id}/workbook/worksheets`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!sheetsRes.ok) { entry.error = 'sheets read failed'; out.push(entry); continue; }
        const sheetsData = await sheetsRes.json();
        entry.worksheets = (sheetsData.value || []).map(s => s.name);
        entry.worksheetCount = entry.worksheets.length;
      } catch (e) {
        entry.error = e.message;
      }
      out.push(entry);
    }

    return Response.json({ fileCount: out.length, files: out });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}