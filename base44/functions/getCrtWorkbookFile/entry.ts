import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_ID, getGraphToken } from '../../shared/crtWorkbook.ts';

/**
 * Streams the raw CRT workbook (.xlsx) binary for a given SharePoint drive
 * item id. SharePoint's webUrl is auth-gated and CORS-blocked from the browser,
 * so the ZIP can't fetch it directly. This function runs server-side, fetches
 * the binary via Graph, and returns it as base64 inside JSON so the frontend
 * can decode and bundle it into the ZIP via the standard functions.invoke path
 * (functions.fetch uses a different URL path that isn't routed for this app).
 */
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch { /* empty body */ }
    const itemId = body.file_id;
    if (!itemId) return Response.json({ error: 'file_id is required' }, { status: 400 });

    const accessToken = await getGraphToken();
    const contentRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${itemId}/content`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!contentRes.ok) {
      return Response.json(
        { error: `Graph content fetch failed: ${contentRes.status}` },
        { status: 502 }
      );
    }

    const arrayBuffer = await contentRes.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    // Binary → base64
    let binary = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    const base64 = btoa(binary);

    // Determine a safe filename from the Content-Disposition header if present.
    const cd = contentRes.headers.get('Content-Disposition') || '';
    const nameMatch = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    const fileName = nameMatch ? decodeURIComponent(nameMatch[1]) : `CRT_${itemId}.xlsx`;

    return Response.json({
      ok: true,
      file_name: fileName,
      content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      base64,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}