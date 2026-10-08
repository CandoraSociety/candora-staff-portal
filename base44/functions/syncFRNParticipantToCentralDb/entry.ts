import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { syncParticipantToCentralDb } from '../../shared/centralDbSync.ts';

// Entity-triggered sync: when an FRN participant (or their FRN registration)
// is created/updated, mirror a CONDENSED profile into the Candora Central
// Database (RCClient) and maintain an FRN program-participation indicator
// (funder category 'frn') that reflects registered vs waitlisted.
// A staff-linked central file (linked_rc_client_id) always wins over
// auto-matching. See base44/shared/centralDbSync.ts for matching rules.
export default async function syncFRNParticipantToCentralDb(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* entity automation — service role */ }

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const svc = base44.asServiceRole.entities;

    let p: any = null;
    if (payload?.registration_id) {
      // Triggered by the FRN registration record — find the participant by name.
      const reg = await svc.ProgramRegistration.get(payload.registration_id);
      if (!reg?.participant_first_name) return Response.json({ status: 'not_found' });
      const matches = await svc.FRNParticipant.filter({ first_name: reg.participant_first_name, last_name: reg.participant_last_name });
      p = matches.sort((a: any, b: any) => (b.created_date || '').localeCompare(a.created_date || ''))[0];
    } else {
      const participantId = payload?.participant_id || payload?.event?.entity_id || payload?.data?.id;
      if (!participantId) return Response.json({ error: 'No participant id provided.' }, { status: 400 });
      p = await svc.FRNParticipant.get(participantId);
    }
    if (!p || !p.id) return Response.json({ status: 'not_found' });

    const regs = await svc.ProgramRegistration.filter({ program_portal: 'frn', participant_first_name: p.first_name, participant_last_name: p.last_name });
    const reg = regs.sort((a: any, b: any) => (b.created_date || '').localeCompare(a.created_date || ''))[0];
    const programName = reg?.program_name && reg.program_name !== 'FRN Program' ? ` (${reg.program_name})` : '';
    const indicator = reg?.status === 'waitlisted'
      ? `On the FRN program waitlist${programName}.`
      : `Registered in the FRN (Family Resource Network) program${programName}.`;

    const result = await syncParticipantToCentralDb(base44, {
      program: 'frn',
      linkedId: p.id,
      indicator,
      funderCategory: 'frn',
      personal: {
        first_name: p.first_name,
        last_name: p.last_name,
        date_of_birth: p.date_of_birth,
        phone: p.phone || p.guardian_phone,
        email: p.email,
      },
      linkedRcClientId: p.linked_rc_client_id || null,
    });
    return Response.json({ status: 'synced', ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}