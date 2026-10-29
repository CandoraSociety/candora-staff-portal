import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken } from '../../shared/crtWorkbook.ts';
import { syncOneClientIntoAllOpenWorkbooks } from '../../shared/crtSync.ts';

// Entity-triggered CRT sync: when a Client record is updated, re-sync that one
// client's row into every OPEN monthly workbook via a targeted single-row PATCH
// (race-safe vs concurrent edits to other clients). Skips clients not yet
// assigned to a program stream or without a start date, and skips closed/frozen
// months. The daily "CRT Auto-Create Monthly" run is the safety net that
// re-syncs everything once a day at 15:00 MT.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* entity automation — service role */ }

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const clientId = payload?.event?.entity_id || payload?.data?.id || payload?.client_id;
    if (!clientId) return Response.json({ error: 'No client id provided.' }, { status: 400 });

    const fetched = await base44.asServiceRole.entities.Client.get(clientId);
    if (!fetched || !fetched.id) return Response.json({ status: 'not_found', message: 'Client not found.' });

    // An older queued event must not restore values replaced by a newer
    // cross-reference push. Only merge payload fields from the current version.
    const payloadData = (payload?.data && typeof payload.data === 'object') ? payload.data : null;
    const payloadTime = Date.parse(payloadData?.updated_date || '');
    const fetchedTime = Date.parse(fetched.updated_date || '');
    const client = payloadData && Number.isFinite(payloadTime) && payloadTime >= fetchedTime
      ? { ...fetched, ...payloadData } : fetched;

    const accessToken = await getGraphToken();
    const result = await syncOneClientIntoAllOpenWorkbooks(base44, accessToken, client);
    return Response.json({
      status: 'success',
      client_id: clientId,
      client_name: `${client.first_name || ''} ${client.last_name || ''}`.trim(),
      ...result
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}