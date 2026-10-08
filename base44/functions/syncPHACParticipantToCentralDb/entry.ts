import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { syncParticipantToCentralDb } from '../../shared/centralDbSync.ts';

// Entity-triggered sync: when a PHAC participant is created/updated, mirror a
// CONDENSED profile into the Candora Central Database (RCClient) and maintain
// a PHAC program-participation indicator (funder category
// 'phac_caregiver_capacity') reflecting registered / waitlisted / withdrawn.
// The central record is for the CHILD; the parent/guardian is carried as the
// contact and in the entry details. A staff-linked central file
// (linked_rc_client_id) always wins over auto-matching.
export default async function syncPHACParticipantToCentralDb(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* entity automation — service role */ }

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const participantId = payload?.participant_id || payload?.event?.entity_id || payload?.data?.id;
    if (!participantId) return Response.json({ error: 'No participant id provided.' }, { status: 400 });

    const p = await base44.asServiceRole.entities.PHACParticipant.get(participantId);
    if (!p || !p.id) return Response.json({ status: 'not_found' });

    const indicator = p.status === 'waitlisted'
      ? 'On the PHAC program waitlist.'
      : p.status === 'withdrawn'
        ? 'Withdrew from the PHAC program.'
        : 'Registered in the PHAC program.';

    const result = await syncParticipantToCentralDb(base44, {
      program: 'phac',
      linkedId: p.id,
      indicator,
      funderCategory: 'phac_caregiver_capacity',
      personal: {
        first_name: p.child_first_name,
        last_name: p.child_last_name,
        date_of_birth: p.child_date_of_birth,
        phone: p.parent_guardian_phone,
        email: p.parent_guardian_email,
      },
      details: p.parent_guardian_name ? { parent_guardian: p.parent_guardian_name } : null,
      linkedRcClientId: p.linked_rc_client_id || null,
    });
    return Response.json({ status: 'synced', ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}