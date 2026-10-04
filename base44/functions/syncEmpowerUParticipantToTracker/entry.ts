import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  getGraphToken, syncCohort, getWorkbookRecord, logSync, asArray,
} from '../../shared/empowerUTracker.ts';

// Keeps a cohort's official Excel tracker in step with the portal. Triggered
// automatically (workflow) when an EmpowerURegistration or EmpowerUParticipant
// changes, and manually via Funder Reports (Retry Sync / a cohort refresh).
// Participant information is already saved in the portal by the time this
// runs — a sync failure is recorded on the workbook record and logged, never
// rolled back. Accepts registration_id, participant_id, or cohort_id.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* workflow/service-role call */ }

    const body = await req.json().catch(() => ({}));
    const registrationId = String(body.registration_id || '').trim();
    const participantId = String(body.participant_id || '').trim();
    const cohortId = String(body.cohort_id || '').trim();
    if (!registrationId && !participantId && !cohortId) {
      return Response.json({ error: 'registration_id, participant_id, or cohort_id is required' }, { status: 400 });
    }

    // Resolve which cohorts are affected
    let cohortIds = [];
    if (cohortId) {
      cohortIds = [cohortId];
    } else if (registrationId) {
      const reg = await base44.asServiceRole.entities.EmpowerURegistration.get(registrationId);
      cohortIds = reg && reg.cohort_id ? [reg.cohort_id] : [];
    } else {
      const page = await base44.asServiceRole.entities.EmpowerURegistration.filter({ participant_id: participantId });
      cohortIds = [...new Set(asArray(page).map((r) => r.cohort_id).filter(Boolean))];
    }

    const token = await getGraphToken();
    const results = [];
    for (const cid of cohortIds) {
      try {
        const res = await syncCohort(base44, token, cid);
        results.push({ cohort_id: cid, cohort_name: res.cohort.name, status: 'success', details: res.results });
      } catch (e) {
        const msg = String(e.message || e).slice(0, 300);
        results.push({ cohort_id: cid, status: 'error', error: msg });
        try {
          const cohort = await base44.asServiceRole.entities.EmpowerUCohort.get(cid);
          const record = await getWorkbookRecord(base44, cid);
          if (record) {
            await base44.asServiceRole.entities.EmpowerUCohortWorkbook.update(record.id, {
              status: 'error',
              last_sync_result: 'error',
              last_sync_error: msg,
            });
          }
          if (cohort) await logSync(base44, cohort, 'sync_participants', 'error', msg);
        } catch { /* already recorded */ }
      }
    }

    return Response.json({ ok: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}