import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_ID, getGraphToken, applyDefaultSheet } from '../../shared/crtWorkbook.ts';

// Returns the embed (preview) URL for a specific CRT workbook file so the
// frontend can show any monthly file in the live preview WITHOUT changing
// which workbook is "active" for sync/roll-forward.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let fileId: string | null = null;
    try {
      const body = await req.json();
      fileId = body?.fileId || null;
    } catch { /* fall through to query param */ }
    if (!fileId) {
      const url = new URL(req.url);
      fileId = url.searchParams.get('fileId');
    }
    if (!fileId) return Response.json({ error: 'fileId required' }, { status: 400 });

    const accessToken = await getGraphToken();
    const previewRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${fileId}/preview`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: '{}'
      }
    );
    if (!previewRes.ok) {
      return Response.json({ error: `Preview failed: ${previewRes.status}` }, { status: previewRes.status });
    }
    const previewData = await previewRes.json();
    return Response.json({ embedUrl: applyDefaultSheet(previewData.getUrl || null) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}