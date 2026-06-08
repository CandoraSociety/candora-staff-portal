import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, data, old_data } = await req.json();
    
    if (!data || !old_data) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const client = data;
    const oldClient = old_data;
    
    const INTERNAL_PLACEMENT_EMAILS = {
      cleaning_arc: 'priscilla@candorasociety.com',
      food_services_onsite: 'priscilla@candorasociety.com',
      food_services_offsite: 'priscilla@candorasociety.com',
      reception: 'priscilla@candorasociety.com',
      childcare: 'priscilla@candorasociety.com',
    };

    const INTERNAL_REFERRAL_EMAILS = {
      ell: 'priscilla@candorasociety.com',
      empoweru: 'priscilla@candorasociety.com',
      digital_literacy: 'priscilla@candorasociety.com',
      family_programs: 'priscilla@candorasociety.com',
    };

    const EXTERNAL_REFERRAL_EMAILS = {
      christcity_lighthouse: 'priscilla@candorasociety.com',
    };

    const SERVICE_NAVIGATOR_EMAIL = 'Dawn.williston@candorasociety.com';

    const emailsToSend = [];

    // Check for internal placement changes
    if (client.internal_placement && client.internal_placement !== 'none' && 
        client.internal_placement !== oldClient.internal_placement) {
      const email = INTERNAL_PLACEMENT_EMAILS[client.internal_placement];
      if (email) {
        const subject = `Internal Placement Referral: ${client.first_name} ${client.last_name}`;
        let body = `Dear Team,\n\n`;
        body += `A new internal placement referral has been made.\n\n`;
        body += `Client: ${client.first_name} ${client.last_name}\n`;
        body += `Placement Type: ${client.internal_placement.replace(/_/g, ' ')}\n`;
        body += `Assigned Worker: ${client.assigned_worker_name || client.assigned_worker}\n\n`;
        body += `Please review and process this referral.\n\n`;
        body += `Thank you,\nCandora Pathways System`;
        
        emailsToSend.push({ to: email, subject, body });
      }
    }

    // Check for internal referrals
    if (client.internal_referrals && Array.isArray(client.internal_referrals)) {
      const newReferrals = client.internal_referrals.filter(r => 
        !oldClient.internal_referrals?.includes(r)
      );
      
      for (const referral of newReferrals) {
        const email = INTERNAL_REFERRAL_EMAILS[referral.toLowerCase().replace(/\s+/g, '_')];
        if (email) {
          const subject = `Internal Referral: ${client.first_name} ${client.last_name}`;
          let body = `Dear Team,\n\n`;
          body += `A new internal referral has been made.\n\n`;
          body += `Client: ${client.first_name} ${client.last_name}\n`;
          body += `Program: ${referral}\n`;
          body += `Assigned Worker: ${client.assigned_worker_name || client.assigned_worker}\n\n`;
          body += `Please review and process this referral.\n\n`;
          body += `Thank you,\nCandora Pathways System`;
          
          emailsToSend.push({ to: email, subject, body });
        }
      }
    }

    // Check for external referrals
    if (client.external_referrals && Array.isArray(client.external_referrals)) {
      const newReferrals = client.external_referrals.filter(r => 
        !oldClient.external_referrals?.includes(r)
      );
      
      for (const referral of newReferrals) {
        const email = EXTERNAL_REFERRAL_EMAILS[referral.toLowerCase().replace(/\s+/g, '_')];
        if (email) {
          const subject = `External Referral: ${client.first_name} ${client.last_name}`;
          let body = `Dear Team,\n\n`;
          body += `A new external referral has been made.\n\n`;
          body += `Client: ${client.first_name} ${client.last_name}\n`;
          body += `Organization: ${referral}\n`;
          body += `Assigned Worker: ${client.assigned_worker_name || client.assigned_worker}\n\n`;
          body += `Please review and process this referral.\n\n`;
          body += `Thank you,\nCandora Pathways System`;
          
          emailsToSend.push({ to: email, subject, body });
        }
      }
    }

    // Check for new barriers
    const barrierFields = ['barrier_1', 'barrier_2', 'barrier_3'];
    for (const field of barrierFields) {
      if (client[field] && client[field] !== oldClient[field]) {
        const subject = `Barrier Identified: ${client.first_name} ${client.last_name}`;
        let body = `Dear Service Navigator,\n\n`;
        body += `A new barrier has been identified for a client.\n\n`;
        body += `Client: ${client.first_name} ${client.last_name}\n`;
        body += `Barrier: ${client[field]}\n`;
        body += `Status: ${client[`${field}_status`] || 'unresolved'}\n`;
        body += `Assigned Worker: ${client.assigned_worker_name || client.assigned_worker}\n\n`;
        body += `Please review and provide support as needed.\n\n`;
        body += `Thank you,\nCandora Pathways System`;
        
        emailsToSend.push({ to: SERVICE_NAVIGATOR_EMAIL, subject, body });
      }
    }

    // Send all emails
    for (const email of emailsToSend) {
      await base44.integrations.Core.SendEmail(email);
    }

    return Response.json({ 
      success: true, 
      emails_sent: emailsToSend.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});