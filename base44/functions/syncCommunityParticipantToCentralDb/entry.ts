import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { syncParticipantToCentralDb } from '../../shared/centralDbSync.ts';

// Entity-triggered sync: when a Community Programs participant (or one of
// their program registrations) is created/updated, mirror a CONDENSED profile
// into the Candora Central Database (RCClient) and maintain a Community
// participation indicator listing each program and whether they're waitlisted.
// A staff-linked central file (linked_rc_client_id) always wins over
// auto-matching. See base44/shared/centralDbSync.ts for matching rules.
export default async function syncCommunityParticipantToCentralDb(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* entity automation — service role */ }

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const participantId = payload?.participant_id || payload?.event?.entity_id || payload?.data?.id;
    if (!participantId) return Response.json({ error: 'No participant id provided.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const p = await svc.CommunityParticipant.get(participantId);
    if (!p || !p.id) return Response.json({ status: 'not_found' });

    const regs = await svc.CommunityRegistration.filter({ participant_id: p.id });
    const label = (r: any) => `${r.program_name || 'program'}${r.status && r.status !== 'registered' ? ` (${r.status})` : ''}`;
    const indicator = regs.length
      ? `Community programs: ${regs.map(label).join(', ')}.`
      : 'Registered in Community programs.';

    const result = await syncParticipantToCentralDb(base44, {
      program: 'community',
      linkedId: p.id,
      indicator,
      personal: {
        first_name: p.first_name,
        last_name: p.last_name,
        date_of_birth: p.date_of_birth,
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