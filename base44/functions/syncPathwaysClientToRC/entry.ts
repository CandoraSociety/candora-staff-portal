import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Entity-triggered sync: when a Client record is created or updated in the
// Pathways CM portal, mirror the personal details into the Resource Centre
// (RCClient) database and maintain a short "pathways_program_info" summary
// (program, start date, anticipated completion, career counsellor, service
// navigator). Resource-Centre-specific fields (case_status, assigned_worker,
// presenting_needs, notes, emergency contact, funder categories beyond
// "pathways") are left untouched on updates so RC staff keep ownership of them.
export default async function syncPathwaysClientToRC(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* entity automation — service role */ }

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const clientId = payload?.event?.entity_id || payload?.data?.id || payload?.client_id;
    if (!clientId) return Response.json({ error: 'No client id provided.' }, { status: 400 });

    const client = await base44.asServiceRole.entities.Client.get(clientId);
    if (!client || !client.id) return Response.json({ status: 'not_found' });

    const programLabel: Record<string, string> = {
      direct_to_employment: 'Direct to Employment (DEA)',
      pathways: 'Pathways',
      casual: 'Casual (Pathways)',
      external_referral: 'External referral (Pathways)',
      internal_referral: 'Internal referral (Pathways)',
      not_eligible: 'Assessed via Pathways (not eligible)',
    };
    const programText = programLabel[client.service_type] || 'Candora Pathways (CM portal)';

    const programInfo = [
      `Client in Candora Pathways (CM portal). Program: ${programText}.`,
      client.service_start_date ? `Start date: ${client.service_start_date}.` : null,
      client.completion_date ? `Anticipated completion: ${client.completion_date}.` : null,
      client.assigned_worker_name ? `Career Counsellor: ${client.assigned_worker_name}.` : null,
      client.assigned_service_navigator_name ? `Service Navigator: ${client.assigned_service_navigator_name}.` : null,
    ].filter(Boolean).join(' ');

    const personalFields = {
      first_name: client.first_name || '',
      last_name: client.last_name || '',
      date_of_birth: client.date_of_birth || null,
      phone: client.phone || null,
      email: client.email || null,
      address: client.address || null,
      city: client.city || null,
      postal_code: client.zip || null,
      pathways_client_id: client.id,
      pathways_program_info: programInfo,
    };

    // Find the linked RC record (if any) by the Pathways client id.
    const existing = await base44.asServiceRole.entities.RCClient.filter({ pathways_client_id: client.id });

    if (existing.length > 0) {
      const rc = existing[0];
      // Merge "pathways" into funder_categories without dropping existing categories.
      const mergedFunders = Array.from(new Set([...(rc.funder_categories || []), 'pathways']));
      await base44.asServiceRole.entities.RCClient.update(rc.id, {
        ...personalFields,
        funder_categories: mergedFunders,
      });
      return Response.json({ status: 'updated', rc_client_id: rc.id });
    }

    // No linked RC record yet — create one. Only set intake defaults on first
    // creation so subsequent Pathways updates never overwrite RC case progress.
    await base44.asServiceRole.entities.RCClient.create({
      ...personalFields,
      funder_categories: ['pathways'],
      case_status: 'intake',
      intake_date: client.intake_date || client.service_start_date || null,
      referral_source: client.referral_source === 'self' ? 'Self' : (client.referral_source ? client.referral_source : 'Pathways CM portal'),
    });
    return Response.json({ status: 'created' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}