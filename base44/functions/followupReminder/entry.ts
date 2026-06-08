import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import moment from 'npm:moment-timezone';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = moment().tz('America/Edmonton');
    const clients = await base44.entities.Client.filter({});
    
    const reminders = [];

    for (const client of clients) {
      if (!client.followup_90day_date || client.status === 'closed') continue;
      
      const followupDate = moment(client.followup_90day_date);
      const daysUntilDue = followupDate.diff(today, 'days');
      
      if (daysUntilDue === 7 || daysUntilDue === 3 || daysUntilDue === 0) {
        const workerEmail = client.assigned_worker;
        if (!workerEmail) continue;
        
        const subject = `Follow-up Due: ${client.first_name} ${client.last_name}`;
        let body = `Dear ${client.assigned_worker_name || 'Counsellor'},\n\n`;
        body += `This is a reminder that a 90-day follow-up is due for ${client.first_name} ${client.last_name}.\n\n`;
        body += `Follow-up Date: ${followupDate.format('MMMM D, YYYY')}\n`;
        body += `Days Until Due: ${daysUntilDue}\n\n`;
        
        if (daysUntilDue === 0) {
          body += `**This follow-up is due TODAY.**\n\n`;
        } else if (daysUntilDue === 3) {
          body += `**This follow-up is due in 3 days.**\n\n`;
        } else if (daysUntilDue === 7) {
          body += `**This follow-up is due in 7 days.**\n\n`;
        }
        
        body += `Please complete the follow-up assessment and update the client's employment status.\n\n`;
        body += `Thank you,\nCandora Pathways System`;
        
        await base44.integrations.Core.SendEmail({
          to: workerEmail,
          subject: subject,
          body: body,
        });
        
        reminders.push({
          client_id: client.id,
          client_name: `${client.first_name} ${client.last_name}`,
          worker_email: workerEmail,
          days_until_due: daysUntilDue,
        });
      }
    }

    return Response.json({ 
      success: true, 
      reminders_sent: reminders.length,
      reminders: reminders 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});