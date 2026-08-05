import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { syncParticipantToCentralDb } from '../../shared/centralDbSync.ts';

// Entity-triggered sync: when an EmpowerU participant is created/updated,
// mirror a CONDENSED profile into the Candora Central Database (RCClient)
// and maintain an EmpowerU program-participation indicator.
// See base44/shared/centralDbSync.ts for matching/dedup behaviour.
export default async function syncEmpowerUParticipantToCentralDb(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* entity automation — service role */ }

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const participantId = payload?.event?.entity_id || payload?.data?.id || payload?.participant_id;
    if (!participantId) return Response.json({ error: 'No participant id provided.' }, { status: 400 });

    const p = await base44.asServiceRole.entities.EmpowerUParticipant.get(participantId);
    if (!p || !p.id) return Response.json({ status: 'not_found' });

    const result = await syncParticipantToCentralDb(base44, {
      program: 'empoweru',
      linkedId: p.id,
      indicator: 'Registered in the EmpowerU program.',
      personal: {
        first_name: p.first_name,
        last_name: p.last_name,
        date_of_birth: p.date_of_birth,
        phone: p.phone,
        email: p.email,
      },
    });
    return Response.json({ status: 'synced', ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}