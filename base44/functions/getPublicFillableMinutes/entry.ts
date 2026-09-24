import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Public (no-login) data feed for the fillable board-minutes form.
// Anyone holding the link can read the blank template: meeting header,
// agenda items and board member names — nothing filled in, no entries.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const data = await req.json().catch(() => ({}));
    const meetingId = data?.meeting_id;
    if (!meetingId) return Response.json({ error: 'meeting_id is required' }, { status: 400 });

    const meetings = await base44.asServiceRole.entities.Meeting.filter({ id: meetingId });
    const meeting = meetings[0];
    if (!meeting) return Response.json({ error: 'Not found' }, { status: 404 });

    const [items, members] = await Promise.all([
      base44.asServiceRole.entities.AgendaItem.filter({ meeting_id: meetingId }),
      base44.asServiceRole.entities.BoardMember.filter({ status: 'active' }),
    ]);

    return Response.json({
      meeting: { id: meeting.id, title: meeting.title, meeting_date: meeting.meeting_date, location: meeting.location },
      items: items
        .map((i) => ({ id: i.id, title: i.title, section: i.section, item_type: i.item_type, presenter: i.presenter, order_index: i.order_index, is_in_camera: i.is_in_camera }))
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
      members: members
        .map((m) => ({ id: m.id, full_name: m.full_name, role: m.role, is_voting: m.is_voting, status: m.status }))
        .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '')),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}