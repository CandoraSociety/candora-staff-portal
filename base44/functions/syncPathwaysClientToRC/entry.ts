import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Entity-triggered sync: when a Client is created/updated in the Pathways CM
// portal, mirror a CONDENSED profile into the Resource Centre (RCClient)
// database and maintain a Pathways program-participation indicator.
//
// Personal details synced (new records only): first/last name, DOB, phone, email.
// Program indicator (pathways_program_info) is always re-derived from the
// Pathways program_status + dates, e.g.:
//   - in progress : "Enrolled in the Pathways program. Anticipated completion: <date>."
//   - complete    : "Completed Pathways program on <date>."
//   - incomplete  : "Pathways program participation ended as incomplete on <date>."
//   - cancelled   : "Pathways program participation was cancelled on <date>."
//
// Matching (avoid duplicates / honour existing RC files):
//   1. RC record already linked (pathways_client_id)  -> update indicator only.
//   2. Existing RC record with matching email         -> link it (indicator only).
//   3. Existing RC record with matching name + DOB    -> link it (indicator only).
//   4. No prior RC file                               -> create condensed record.
// When linking an existing RC record we never overwrite its personal details
// or RC-specific fields; we only add the Pathways link + indicator.
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

    // Derive the program-participation indicator.
    let indicator: string;
    const endDate = fmt(client.completion_date) || fmt(client.closed_date);
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
      default: // in_progress or unset
        indicator = `Enrolled in the Pathways program. Anticipated completion: ${fmt(client.completion_date) || 'to be determined'}.`;
    }

    const rc = base44.asServiceRole.entities.RCClient;

    // 1. Already linked?
    let linked = (await rc.filter({ pathways_client_id: client.id }))[0];

    // 2. Match by email (case-insensitive) against existing RC files.
    if (!linked && client.email) {
      const byEmail = await rc.filter({ email: client.email });
      linked = byEmail.find((c: any) =>
        (c.email || '').toLowerCase() === (client.email || '').toLowerCase()
      );
    }

    // 3. Match by first + last name + date of birth.
    if (!linked && client.first_name && client.last_name) {
      const byName = await rc.filter({ first_name: client.first_name, last_name: client.last_name });
      if (client.date_of_birth) {
        linked = byName.find((c: any) => c.date_of_birth === client.date_of_birth);
      } else if (byName.length === 1) {
        linked = byName[0];
      }
    }

    if (linked) {
      const mergedFunders = Array.from(new Set([...(linked.funder_categories || []), 'pathways']));
      await rc.update(linked.id, {
        pathways_client_id: client.id,
        pathways_program_info: indicator,
        funder_categories: mergedFunders,
      });
      return Response.json({ status: 'linked', rc_client_id: linked.id });
    }

    // 4. No prior RC file — create a condensed record.
    await rc.create({
      first_name: client.first_name || '',
      last_name: client.last_name || '',
      date_of_birth: client.date_of_birth || null,
      phone: client.phone || null,
      email: client.email || null,
      pathways_client_id: client.id,
      pathways_program_info: indicator,
      funder_categories: ['pathways'],
      intake_date: client.intake_date || client.service_start_date || null,
    });
    return Response.json({ status: 'created' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}