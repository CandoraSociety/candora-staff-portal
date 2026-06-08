import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { volunteer_id, volunteer_name, volunteer_email, weekly_schedule, blocked_dates } = await req.json();

    // Create or update availability record
    const existing = await base44.entities.VolunteerAvailability.filter({ volunteer_id });
    
    if (existing.length > 0) {
      await base44.entities.VolunteerAvailability.update(existing[0].id, {
        weekly_schedule,
        blocked_dates,
        last_updated: new Date().toISOString(),
        notification_sent: false,
      });
    } else {
      await base44.entities.VolunteerAvailability.create({
        volunteer_id,
        volunteer_name,
        volunteer_email,
        weekly_schedule,
        blocked_dates,
        last_updated: new Date().toISOString(),
        notification_sent: false,
      });
    }

    // Notify coordinator
    await base44.functions.invoke('notifyCoordinator', {
      type: 'availability_update',
      volunteerName: volunteer_name,
      volunteerEmail: volunteer_email,
      details: 'Volunteer updated their availability',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});