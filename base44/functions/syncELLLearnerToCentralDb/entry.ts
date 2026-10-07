import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { syncParticipantToCentralDb } from '../../shared/centralDbSync.ts';

// Entity-triggered sync: when an ELL learner is created/updated, mirror a
// CONDENSED profile into the Candora Central Database (RCClient) and maintain
// an ELL program-participation indicator. When staff linked an existing
// central file at intake (linked_rc_client_id), that record is updated
// instead of auto-matching; otherwise a new central file is created.
// See base44/shared/centralDbSync.ts for matching/dedup behaviour.
export default async function syncELLLearnerToCentralDb(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* entity automation — service role */ }

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const learnerId = payload?.event?.entity_id || payload?.data?.id || payload?.learner_id;
    if (!learnerId) return Response.json({ error: 'No learner id provided.' }, { status: 400 });

    const l = await base44.asServiceRole.entities.ELLLearner.get(learnerId);
    if (!l || !l.id) return Response.json({ status: 'not_found' });

    const indicator = l.enrollment_status === 'waitlisted'
      ? 'On the ELL program waitlist.'
      : `Registered in the ELL program${l.assigned_class_name ? ` (${l.assigned_class_name})` : ''}.`;

    const result = await syncParticipantToCentralDb(base44, {
      program: 'ell',
      linkedId: l.id,
      indicator,
      personal: {
        first_name: l.first_name,
        last_name: l.last_name,
        date_of_birth: l.date_of_birth,
        phone: l.phone,
        email: l.email,
      },
      linkedRcClientId: l.linked_rc_client_id || null,
    });
    return Response.json({ status: 'synced', ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}