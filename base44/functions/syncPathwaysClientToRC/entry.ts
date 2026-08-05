import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { syncParticipantToCentralDb } from '../../shared/centralDbSync.ts';

// Entity-triggered sync: when a Client is created/updated in the Pathways CM
// portal, mirror a CONDENSED profile into the Candora Central Database
// (RCClient) and maintain a Pathways program-participation indicator.
// See base44/shared/centralDbSync.ts for matching/dedup behaviour.
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

    const fmt = (iso: string | null | undefined): string | null => {
      if (!iso) return null;
      const d = new Date(iso + 'T00:00:00');
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const endDate = fmt(client.completion_date) || fmt(client.closed_date);
    let indicator: string;
    switch (client.program_status) {
      case 'complete':
        indicator = `Completed Pathways program on ${endDate || 'completion'}.`;
        break;
      case 'incomplete':
        indicator = `Pathways program participation ended as incomplete on ${endDate || 'completion'}.`;
        break;
      case 'cancelled':
        indicator = `Pathways program participation was cancelled on ${endDate || 'closure'}.`;
        break;
      default:
        indicator = `Enrolled in the Pathways program. Anticipated completion: ${fmt(client.completion_date) || 'to be determined'}.`;
    }

    const result = await syncParticipantToCentralDb(base44, {
      program: 'pathways',
      linkedId: client.id,
      indicator,
      funderCategory: 'pathways',
      linkedRcClientId: client.linked_rc_client_id || null,
      personal: {
        first_name: client.first_name,
        last_name: client.last_name,
        date_of_birth: client.date_of_birth,
        phone: client.phone,
        email: client.email,
      },
    });
    return Response.json({ status: 'synced', ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}