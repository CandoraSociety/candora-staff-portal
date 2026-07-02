import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all scheduled appointments where reminder hasn't been sent yet
    const appointments = await base44.asServiceRole.entities.RCAppointment.filter({
      status: 'scheduled',
      reminder_sent: false
    });

    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    let remindersSent = 0;

    for (const appt of appointments) {
      const apptDate = new Date(appt.appointment_date);

      // Only send reminders for appointments within the next 24 hours
      if (apptDate > now && apptDate <= twentyFourHoursFromNow) {
        if (appt.client_email) {
          try {
            const dateStr = apptDate.toLocaleString('en-CA', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZone: 'America/Edmonton'
            });

            await base44.asServiceRole.integrations.Core.SendEmail({
              to: appt.client_email,
              subject: 'Appointment Reminder - Candora Resource Centre',
              body: `Hello ${appt.client_name},\n\nThis is a reminder for your upcoming appointment with the Candora Resource Centre.\n\nDate: ${dateStr}\n${appt.location_detail ? 'Location: ' + appt.location_detail + '\n' : ''}${appt.purpose ? 'Purpose: ' + appt.purpose + '\n' : ''}\nIf you need to reschedule or cancel, please contact us as soon as possible.\n\nThank you,\nCandora Resource Centre`
            });
            remindersSent++;
          } catch (emailErr) {
            console.error(`Failed to send reminder to ${appt.client_email}:`, emailErr.message);
          }
        }

        // Mark reminder as sent regardless of email success to avoid retrying indefinitely
        await base44.asServiceRole.entities.RCAppointment.update(appt.id, {
          reminder_sent: true,
          reminder_sent_date: new Date().toISOString()
        });
      }
    }

    return Response.json({
      success: true,
      checked: appointments.length,
      reminders_sent: remindersSent
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});