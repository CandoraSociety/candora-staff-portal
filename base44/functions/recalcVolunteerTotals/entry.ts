import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import moment from 'npm:moment@2.30.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Use service role to access all data
    const volunteers = await base44.asServiceRole.entities.Volunteer.list();
    const timeLogs = await base44.asServiceRole.entities.VolunteerTimeLog.filter({ status: 'completed' });

    // Create a map of volunteer totals
    const totals = new Map();
    volunteers.forEach(v => totals.set(v.id, 0));

    // Sum up completed hours per volunteer
    timeLogs.forEach(log => {
      if (log.volunteer_id && log.total_hours) {
        const current = totals.get(log.volunteer_id) || 0;
        totals.set(log.volunteer_id, current + log.total_hours);
      }
    });

    // Update each volunteer's total_hours
    const updates = [];
    for (const [volunteerId, total] of totals.entries()) {
      updates.push(
        base44.asServiceRole.entities.Volunteer.update(volunteerId, { total_hours: total })
      );
    }

    await Promise.all(updates);

    return Response.json({ 
      success: true, 
      message: `Recalculated totals for ${volunteers.length} volunteers` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});