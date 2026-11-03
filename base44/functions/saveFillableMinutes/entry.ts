import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Saves a completed fillable board-minutes form back into the Board Portal:
// attendance, minute entries, motions, in-camera notes and the final minutes
// document. Used by the in-app overlay and by the no-login shared fillable link,
// so the secretary's work shows up under the meeting either way.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const meetingId = body?.meeting_id;
    if (!meetingId) return Response.json({ error: 'meeting_id is required' }, { status: 400 });

    const meetings = await base44.asServiceRole.entities.Meeting.filter({ id: meetingId });
    const meeting = meetings[0];
    if (!meeting) return Response.json({ error: 'Meeting not found' }, { status: 404 });

    const attendance = body.attendance || null;
    const minuteEntries = Array.isArray(body.minute_entries) ? body.minute_entries : null;
    const newItems = Array.isArray(body.new_items) ? body.new_items : [];
    const motionRecords = Array.isArray(body.motions) ? body.motions : null;
    const inCameraRecords = Array.isArray(body.in_camera) ? body.in_camera : null;
    const document = body.document || null;

    // Agenda items added while the minutes were being taken — the entries filed
    // under them need the real record ids.
    const idMap = {};
    if (newItems.length) {
      const existing = await base44.asServiceRole.entities.AgendaItem.filter({ meeting_id: meetingId });
      let maxOrder = 0;
      existing.forEach((i) => { maxOrder = Math.max(maxOrder, Number(i.order_index) || 0); });
      const created = await base44.asServiceRole.entities.AgendaItem.bulkCreate(
        newItems.map((n, idx) => ({
          meeting_id: meetingId,
          title: n.title,
          section: n.section,
          order_index: maxOrder + idx + 1,
        }))
      );
      created.forEach((rec, idx) => { idMap[newItems[idx].temp_id] = rec.id; });
    }

    if (attendance) {
      const existing = await base44.asServiceRole.entities.BoardMinutesAttendance.filter({ meeting_id: meetingId });
      const data = {
        present_member_names: attendance.present_names || [],
        guest_names: attendance.guest_names || [],
      };
      if (existing[0]) await base44.asServiceRole.entities.BoardMinutesAttendance.update(existing[0].id, data);
      else await base44.asServiceRole.entities.BoardMinutesAttendance.create({ meeting_id: meetingId, ...data });
    }

    // Replace only the entries this form created — anything typed directly in
    // the Minutes Taker stays put.
    if (minuteEntries) {
      await base44.asServiceRole.entities.MinuteEntry.deleteMany({ meeting_id: meetingId, source: 'fillable' });
      const records = minuteEntries
        .filter((e) => e && e.entry_type)
        .map((e) => ({
          meeting_id: meetingId,
          agenda_item_id: idMap[e.agenda_item_id] || e.agenda_item_id || undefined,
          entry_type: e.entry_type,
          content: e.content || '',
          motion_verbiage: e.motion_verbiage || '',
          moved_by: e.moved_by || '',
          seconded_by: e.seconded_by || '',
          motion_result: e.motion_result || '',
          votes_in_favour: typeof e.votes_in_favour === 'number' ? e.votes_in_favour : undefined,
          votes_opposed: typeof e.votes_opposed === 'number' ? e.votes_opposed : undefined,
          votes_abstained: typeof e.votes_abstained === 'number' ? e.votes_abstained : undefined,
          action_assigned_to: e.action_assigned_to || '',
          action_due_date: e.action_due_date || undefined,
          is_in_camera: false,
          order_index: Number(e.order_index) || 0,
          source: 'fillable',
        }));
      if (records.length) await base44.asServiceRole.entities.MinuteEntry.bulkCreate(records);
    }

    if (motionRecords) {
      await base44.asServiceRole.entities.BoardMotion.deleteMany({ meeting_id: meetingId });
      if (motionRecords.length) await base44.asServiceRole.entities.BoardMotion.bulkCreate(motionRecords);
    }

    if (inCameraRecords) {
      await base44.asServiceRole.entities.InCameraNote.deleteMany({ meeting_id: meetingId });
      if (inCameraRecords.length) await base44.asServiceRole.entities.InCameraNote.bulkCreate(inCameraRecords);
    }

    let docSaved = false;
    if (document && document.html) {
      const file = new File([document.html], document.file_name || 'Minutes.html', { type: 'text/html' });
      const uploaded = await base44.asServiceRole.integrations.Core.UploadPublicFile({ file });
      const fileUrl = uploaded?.file_url;
      if (!fileUrl) throw new Error('Could not store the minutes document');
      const docData = {
        title: document.title || `${meeting.title || 'Board Meeting'} — Minutes`,
        file_url: fileUrl,
        file_name: document.file_name || 'Minutes.html',
        description: 'Finalized board minutes (from the fillable minutes)',
      };
      const existing = await base44.asServiceRole.entities.BoardDocument.filter({ meeting_id: meetingId, document_type: 'minutes' });
      if (existing.length) await base44.asServiceRole.entities.BoardDocument.update(existing[0].id, docData);
      else await base44.asServiceRole.entities.BoardDocument.create({ ...docData, document_type: 'minutes', meeting_id: meetingId });
      docSaved = true;
    }

    return Response.json({ ok: true, meeting_id: meetingId, document_saved: docSaved });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}