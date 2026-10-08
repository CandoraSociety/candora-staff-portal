import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { syncParticipantToCentralDb } from '../../shared/centralDbSync.ts';

// Entity-triggered sync: when a Digital Literacy participant is created or
// updated, mirror a CONDENSED profile into the Candora Central Database
// (RCClient) and maintain a Digital Literacy participation indicator
// reflecting the participant's current status (including waitlisted).
// A staff-linked central file (linked_rc_client_id) always wins over
// auto-matching. See base44/shared/centralDbSync.ts for matching rules.
export default async function syncDigiLitParticipantToCentralDb(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* entity automation — service role */ }

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const participantId = payload?.participant_id || payload?.event?.entity_id || payload?.data?.id;
    if (!participantId) return Response.json({ error: 'No participant id provided.' }, { status: 400 });

    const p = await base44.asServiceRole.entities.DigiLitParticipant.get(participantId);
    if (!p || !p.id) return Response.json({ status: 'not_found' });

    const indicator = p.status === 'waitlisted'
      ? 'On the Digital Literacy program waitlist.'
      : p.status === 'started'
        ? 'Active in the Digital Literacy program.'
        : p.status === 'completed'
          ? 'Completed the Digital Literacy program.'
          : p.status === 'withdrawn'
            ? 'Withdrew from the Digital Literacy program.'
            : 'Registered in the Digital Literacy program.';

    const result = await syncParticipantToCentralDb(base44, {
      program: 'digilit',
      linkedId: p.id,
      indicator,
      personal: {
        first_name: p.first_name,
        last_name: p.last_name,
        phone: p.phone,
        email: p.email,
      },
      linkedRcClientId: p.linked_rc_client_id || null,
    });
    return Response.json({ status: 'synced', ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}