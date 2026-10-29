import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_ID, getGraphToken } from '../../shared/crtWorkbook.ts';
import { applySubmissionRange, monthFromCrtFileName, excelSerial } from '../../shared/crtDatePatch.ts';

// Returns the embed (preview) URL for a specific CRT workbook file so the
// frontend can show any monthly file in the live preview WITHOUT changing
// which workbook is "active" for sync/roll-forward.
//
// Before returning the embed, the workbook's submission-range date cells are
// aligned to that file's own month, so the preview always shows the date range
// for the month being viewed (never a month carried over from a copy).
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

    // Align this workbook's date ranges to its own month (best-effort — a
    // locked sheet must not stop the preview from loading).
    let rangeError = null;
    try {
      const metaRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${fileId}?$select=name`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const month = monthFromCrtFileName(meta.name);
        if (month) {
          const startSerial = excelSerial(new Date(Date.UTC(month.year, month.monthIdx, 1)));
          const endSerial = excelSerial(new Date(Date.UTC(month.year, month.monthIdx + 1, 0)));
          // Cheap check first: only write when this workbook's headers don't
          // already show its own month (avoids a slow write on every preview).
          const checkRes = await fetch(
            `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${fileId}/workbook/worksheets('Invoice Tracker')/range(address='B8:B9')`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const existing = checkRes.ok ? ((await checkRes.json()).values || []) : [];
          const alreadyRight = existing[0]?.[0] === startSerial && existing[1]?.[0] === endSerial;
          if (!alreadyRight) {
            const { errors } = await applySubmissionRange(accessToken, fileId, month.year, month.monthIdx);
            if (errors.length) rangeError = errors.join('; ');
          }
        }
      }
    } catch (e) {
      rangeError = String(e.message || e);
    }

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
    return Response.json({ embedUrl: previewData.getUrl || null, rangeError });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}