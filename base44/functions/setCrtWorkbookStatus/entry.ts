import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Marks a monthly CRT workbook open (resumes month-bound syncing) or closed
// (freezes it as a snapshot — it will be skipped by future syncs). The reporting
// date range is never affected by this; it always reflects the file's own month.
// Payload: { file_name, drive_item_id?, status: 'open' | 'closed' }
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch {}
    const { file_name, drive_item_id, status } = body || {};
    if (!file_name || !status) {
      return Response.json({ error: 'file_name and status are required' }, { status: 400 });
    }
    if (!['open', 'closed'].includes(status)) {
      return Response.json({ error: "status must be 'open' or 'closed'" }, { status: 400 });
    }

    const closedDate = status === 'closed' ? new Date().toISOString().slice(0, 10) : null;
    const closedBy = status === 'closed' ? (user.full_name || user.email || '') : null;

    const recs = await base44.asServiceRole.entities.CrtWorkbook.filter({ file_name });
    if (recs.length) {
      await base44.asServiceRole.entities.CrtWorkbook.update(recs[0].id, {
        status, closed_date: closedDate, closed_by_name: closedBy
      });
    } else {
      await base44.asServiceRole.entities.CrtWorkbook.create({
        file_name, drive_item_id: drive_item_id || null, status,
        closed_date: closedDate, closed_by_name: closedBy
      });
    }

    return Response.json({
      status: 'success',
      file_name,
      workbook_status: status,
      message: status === 'closed'
        ? `${file_name} marked complete — frozen, will no longer sync.`
        : `${file_name} reopened — will sync again.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}