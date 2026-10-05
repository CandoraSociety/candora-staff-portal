import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Creates missing ATB account-setup chase records for EmpowerU participants.
// Triggered automatically (workflow) whenever an EmpowerURegistration becomes
// enrolled/completed, and callable with cohort_id to backfill a whole cohort
// (the Cohort Detail "Generate Missing" button). Idempotent: registrations that
// already have a setup record are skipped, existing records are never touched.
// Accepts registration_id or cohort_id.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* workflow/service-role call */ }

    const body = await req.json().catch(() => ({}));
    const registrationId = String(body.registration_id || '').trim();
    const cohortId = String(body.cohort_id || '').trim();
    if (!registrationId && !cohortId) {
      return Response.json({ error: 'registration_id or cohort_id is required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    let registrations = [];
    if (registrationId) {
      const reg = await svc.entities.EmpowerURegistration.get(registrationId);
      registrations = reg ? [reg] : [];
    } else {
      const page = await svc.entities.EmpowerURegistration.filter({ cohort_id: cohortId });
      registrations = Array.isArray(page) ? page : (page.items || []);
    }

    const active = registrations.filter(r =>
      r.participant_id && r.cohort_id &&
      !['withdrawn', 'declined', 'waitlisted'].includes(r.status));

    const created = [];
    let skipped = 0;
    for (const reg of active) {
      const existing = await svc.entities.EmpowerUAccountSetup.filter({
        participant_id: reg.participant_id,
        cohort_id: reg.cohort_id,
      });
      const existingItems = Array.isArray(existing) ? existing : (existing.items || []);
      if (existingItems.length > 0) { skipped++; continue; }

      const participant = await svc.entities.EmpowerUParticipant.get(reg.participant_id).catch(() => null);
      const cohort = await svc.entities.EmpowerUCohort.get(reg.cohort_id).catch(() => null);
      created.push(await svc.entities.EmpowerUAccountSetup.create({
        participant_id: reg.participant_id,
        participant_name: participant ? `${participant.first_name} ${participant.last_name}` : (reg.participant_name || ''),
        participant_email: participant?.email || '',
        participant_phone: participant?.phone || '',
        cohort_id: reg.cohort_id,
        cohort_name: cohort?.name || reg.cohort_name || '',
        status: 'not_started',
      }));
    }

    return Response.json({
      created: created.length,
      skipped,
      records: created.map(c => ({ id: c.id, participant_name: c.participant_name, cohort_name: c.cohort_name })),
    });
  } catch (error) {
    return Response.json({ error: String(error.message || error).slice(0, 500) }, { status: 500 });
  }
}