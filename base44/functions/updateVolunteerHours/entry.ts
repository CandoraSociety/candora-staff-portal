import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This is called by automations, so use service role
    const payload = await req.json();
    const { volunteer_id } = payload;

    if (!volunteer_id) {
      return Response.json({ error: 'volunteer_id required' }, { status: 400 });
    }

    // Get all time logs for this volunteer
    const timeLogs = await base44.asServiceRole.entities.VolunteerTimeLog.filter({ volunteer_id });
    
    // Sum total hours
    const totalHours = timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
    
    // Update volunteer record
    await base44.asServiceRole.entities.Volunteer.update(volunteer_id, { 
      total_hours: Math.round(totalHours * 100) / 100 
    });

    return Response.json({ success: true, total_hours: totalHours });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});