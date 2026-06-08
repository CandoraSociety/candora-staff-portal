import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { base44 } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Service role - check all clients
    const clients = await base44.asServiceRole.entities.Client.list('-followup_90day_date', 1000);
    
    const today = new Date();
    const alerts = [];
    
    for (const client of clients) {
      if (!client.followup_90day_date || client.status === 'closed') continue;
      
      const followupDate = new Date(client.followup_90day_date);
      const daysUntil = Math.ceil((followupDate - today) / (1000 * 60 * 60 * 24));
      
      // Send alert at 7, 3, and 0 days
      if (daysUntil === 7 || daysUntil === 3 || daysUntil === 0) {
        const workerEmail = client.assigned_worker;
        if (!workerEmail) continue;
        
        const subject = `90-Day Follow-up Due ${daysUntil === 0 ? 'TODAY' : `in ${daysUntil} days`}`;
        const body = `
Dear ${client.assigned_worker_name || 'Counsellor'},

This is a reminder that a 90-day follow-up is due for:

Client: ${client.first_name} ${client.last_name}
Follow-up Date: ${client.followup_90day_date}
Days Until Due: ${daysUntil}

Please complete the follow-up assessment in the client's profile.

Thank you,
Pathways CM System
        `.trim();
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: workerEmail,
          subject,
          body
        });
        
        alerts.push({ client: client.first_name + ' ' + client.last_name, days: daysUntil, email: workerEmail });
      }
    }
    
    return Response.json({ success: true, alerts_sent: alerts.length, alerts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});