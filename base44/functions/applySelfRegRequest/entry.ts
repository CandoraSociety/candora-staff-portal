import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { applySelfRegAction, todayStr } from '../../shared/selfReg.ts';

// Registrar actions on self-registration requests (approve / reject / waitlist).
// Requires an authenticated app user; the approval/waitlist creates the real
// registration in the program's own records.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { request_id, action, review_notes } = await req.json().catch(() => ({}));
    if (!request_id || !['approve', 'reject', 'waitlist'].includes(action)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const request = await base44.entities.SelfRegRequest.get(request_id);
    if (!request || request.status !== 'pending') {
      return Response.json({ error: 'Request not found or already reviewed' }, { status: 400 });
    }

    const result = await applySelfRegAction(base44, request, action);
    const reviewer = user.full_name || user.email || 'Staff';
    await base44.entities.SelfRegRequest.update(request_id, {
      status: action === 'approve' ? 'approved' : (action === 'waitlist' ? 'waitlisted' : 'rejected'),
      reviewed_by_name: reviewer,
      reviewed_date: todayStr(),
      review_notes: review_notes || null,
    });
    return Response.json({ ok: true, status: result.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}