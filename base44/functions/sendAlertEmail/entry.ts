import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();
    
    if (event.type !== 'update' || !data) {
      return Response.json({ success: true, message: 'No action needed' });
    }
    
    const changed_fields = [];
    if (data.internal_placement !== old_data?.internal_placement) changed_fields.push('internal_placement');
    if (JSON.stringify(data.internal_referrals) !== JSON.stringify(old_data?.internal_referrals)) changed_fields.push('internal_referrals');
    if (JSON.stringify(data.external_referrals) !== JSON.stringify(old_data?.external_referrals)) changed_fields.push('external_referrals');
    if (data.barrier_1 !== old_data?.barrier_1 || data.barrier_2 !== old_data?.barrier_2 || data.barrier_3 !== old_data?.barrier_3) {
      changed_fields.push('barriers');
    }
    
    if (changed_fields.length === 0) {
      return Response.json({ success: true, message: 'No relevant changes' });
    }
    
    // Email mappings
    const INTERNAL_PLACEMENT_EMAILS = {
      cleaning_arc: "priscilla@candorasociety.com",
      food_services_onsite: "priscilla@candorasociety.com",
      food_services_offsite: "priscilla@candorasociety.com",
      reception: "priscilla@candorasociety.com",
      childcare: "priscilla@candorasociety.com"
    };
    
    const INTERNAL_REFERRAL_EMAIL = "priscilla@candorasociety.com";
    const EXTERNAL_REFERRAL_EMAIL = "priscilla@candorasociety.com";
    const SERVICE_NAVIGATOR_EMAIL = "Dawn.williston@candorasociety.com";
    
    const alerts = [];
    
    // Internal placement alert
    if (data.internal_placement && data.internal_placement !== 'none' && data.internal_placement !== old_data?.internal_placement) {
      const email = INTERNAL_PLACEMENT_EMAILS[data.internal_placement] || INTERNAL_PLACEMENT_EMAILS.cleaning_arc;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `New Internal Placement: ${data.internal_placement.replace(/_/g, ' ')}`,
        body: `
A new internal placement has been assigned:

Client: ${data.first_name} ${data.last_name}
Placement: ${data.internal_placement.replace(/_/g, ' ')}
Assigned Worker: ${data.assigned_worker_name || data.assigned_worker}

Please review and prepare for the placement.
        `.trim()
      });
      alerts.push({ type: 'internal_placement', email });
    }
    
    // Internal referrals alert
    if (data.internal_referrals?.length > 0 && JSON.stringify(data.internal_referrals) !== JSON.stringify(old_data?.internal_referrals)) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: INTERNAL_REFERRAL_EMAIL,
        subject: `New Internal Referral: ${data.first_name} ${data.last_name}`,
        body: `
A new internal referral has been made:

Client: ${data.first_name} ${data.last_name}
Referrals: ${data.internal_referrals.join(', ')}
Assigned Worker: ${data.assigned_worker_name || data.assigned_worker}

Please follow up on these referrals.
        `.trim()
      });
      alerts.push({ type: 'internal_referral', email: INTERNAL_REFERRAL_EMAIL });
    }
    
    // External referrals alert
    if (data.external_referrals?.length > 0 && JSON.stringify(data.external_referrals) !== JSON.stringify(old_data?.external_referrals)) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: EXTERNAL_REFERRAL_EMAIL,
        subject: `New External Referral: ${data.first_name} ${data.last_name}`,
        body: `
A new external referral has been made:

Client: ${data.first_name} ${data.last_name}
Referrals: ${data.external_referrals.join(', ')}
Assigned Worker: ${data.assigned_worker_name || data.assigned_worker}

Please coordinate with external agencies.
        `.trim()
      });
      alerts.push({ type: 'external_referral', email: EXTERNAL_REFERRAL_EMAIL });
    }
    
    // Barrier alerts to Service Navigator
    const barriers = [];
    if (data.barrier_1 && data.barrier_1 !== old_data?.barrier_1) barriers.push(data.barrier_1);
    if (data.barrier_2 && data.barrier_2 !== old_data?.barrier_2) barriers.push(data.barrier_2);
    if (data.barrier_3 && data.barrier_3 !== old_data?.barrier_3) barriers.push(data.barrier_3);
    
    if (barriers.length > 0) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: SERVICE_NAVIGATOR_EMAIL,
        subject: `New Barrier(s) Identified: ${data.first_name} ${data.last_name}`,
        body: `
New barrier(s) have been identified:

Client: ${data.first_name} ${data.last_name}
Barriers: ${barriers.join(', ')}
Assigned Worker: ${data.assigned_worker_name || data.assigned_worker}

Please review and provide support as needed.
        `.trim()
      });
      alerts.push({ type: 'barrier', email: SERVICE_NAVIGATOR_EMAIL });
    }
    
    return Response.json({ success: true, alerts_sent: alerts.length, alerts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});