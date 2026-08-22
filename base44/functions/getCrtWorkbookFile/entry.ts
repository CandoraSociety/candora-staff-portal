import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_ID, getGraphToken } from '../../shared/crtWorkbook.ts';

/**
 * Streams the raw CRT workbook (.xlsx) binary for a given SharePoint drive
 * item id. The frontend uses base44.functions.fetch() (not invoke) to get the
 * native Response and read .blob() — needed because the SharePoint webUrl is
 * auth-gated and CORS-blocked from the browser, so the ZIP can't fetch it
 * directly.
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

    const blob = await contentRes.blob();
    // Determine a safe filename from the Content-Disposition header if present.
    const cd = contentRes.headers.get('Content-Disposition') || '';
    const nameMatch = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    const fileName = nameMatch ? decodeURIComponent(nameMatch[1]) : `CRT_${itemId}.xlsx`;

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}