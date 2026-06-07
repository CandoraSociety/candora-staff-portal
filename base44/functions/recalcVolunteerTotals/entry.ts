import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Paginate all time logs
    const hoursMap = {};
    let page = 0;
    const pageSize = 500;
    while (true) {
      const logs = await base44.asServiceRole.entities.VolunteerTimeLog.list('-date', pageSize, page * pageSize);
      if (!logs || logs.length === 0) break;
      for (const log of logs) {
        if (log.volunteer_id && log.total_hours) {
          hoursMap[log.volunteer_id] = (hoursMap[log.volunteer_id] || 0) + log.total_hours;
        }
      }
      if (logs.length < pageSize) break;
      page++;
    }

    // Update each volunteer
    let updated = 0;
    for (const [volunteerId, totalHours] of Object.entries(hoursMap)) {
      await base44.asServiceRole.entities.Volunteer.update(volunteerId, { total_hours: Math.round(totalHours * 100) / 100 });
      updated++;
    }

    return Response.json({ success: true, updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});