import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const records = await base44.asServiceRole.entities.PersonalOrganizer.list('-updated_date', 200);

    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    let remindersSent = 0;
    let missedMarked = 0;

    for (const record of records) {
      if (!record.weekly_plan || record.weekly_plan.length === 0) continue;
      if (!record.user_email) continue;

      let modified = false;
      const updatedPlan = record.weekly_plan.map(item => {
        if (item.done) return item;

        const scheduledDate = item.scheduled_date ? new Date(item.scheduled_date + (item.time ? 'T' + item.time + ':00' : 'T23:59:59')) : null;
        if (!scheduledDate) return item;

        // Mark missed: past date/time, not done, not on hold
        if (scheduledDate < now && item.status !== 'on_hold' && item.status !== 'missed') {
          modified = true;
          missedMarked++;
          return { ...item, status: 'missed' };
        }

        // Send reminder: within next 24h, not done, reminder not sent
        if (scheduledDate > now && scheduledDate <= twentyFourHoursFromNow && !item.reminder_sent && item.status !== 'on_hold') {
          try {
            const dateStr = scheduledDate.toLocaleString('en-CA', {
              weekday: 'long', month: 'long', day: 'numeric',
              hour: 'numeric', minute: '2-digit', timeZone: 'America/Edmonton'
            });
            base44.asServiceRole.integrations.Core.SendEmail({
              to: record.user_email,
              subject: 'Weekly Planner Reminder — ' + item.text,
              body: `Hi,\n\nThis is a reminder from your Weekly Planner:\n\n"${item.text}"\n\nScheduled: ${dateStr}${item.notes ? '\nNotes: ' + item.notes : ''}\n\nStay on top of it!\n\nCandora Staff Portal`
            });
            remindersSent++;
          } catch (emailErr) {
            console.error('Failed to send reminder:', emailErr.message);
          }
          modified = true;
          return { ...item, reminder_sent: true };
        }

        return item;
      });

      if (modified) {
        try {
          await base44.asServiceRole.entities.PersonalOrganizer.update(record.id, { weekly_plan: updatedPlan });
        } catch (updateErr) {
          console.error('Failed to update record:', updateErr.message);
        }
      }
    }

    return Response.json({
      success: true,
      records_checked: records.length,
      reminders_sent: remindersSent,
      missed_marked: missedMarked
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});