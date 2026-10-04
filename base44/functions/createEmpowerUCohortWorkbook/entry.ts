import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  getGraphToken, ensureCohortWorkbook, refreshCohortDateRange,
  formatWrittenDateRange, logSync,
} from '../../shared/empowerUTracker.ts';

// Creates the cohort-specific official EmpowerU Excel tracker workbook from
// the protected master template (duplicate → set cohort date range → store in
// the EmpowerU Funder Reports SharePoint folder → link to the cohort id).
// Idempotent: if the cohort already has a workbook it is kept and only the
// date range is refreshed — a date change never creates a second workbook.
// A failure here never affects the saved cohort; staff retry from Funder Reports.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* workflow/service-role call */ }

    const body = await req.json().catch(() => ({}));
    const cohortId = String(body.cohort_id || '').trim();
    if (!cohortId) return Response.json({ error: 'cohort_id is required' }, { status: 400 });

    const cohort = await base44.asServiceRole.entities.EmpowerUCohort.get(cohortId);
    if (!cohort) return Response.json({ error: 'Cohort not found' }, { status: 404 });

    const token = await getGraphToken();
    const { record, created } = await ensureCohortWorkbook(base44, token, cohort);
    const dateRange = formatWrittenDateRange(cohort.start_date, cohort.end_date);

    let datesUpdated = false;
    if (!created) {
      datesUpdated = await refreshCohortDateRange(token, record.workbook_file_id, dateRange);
      if (datesUpdated || record.date_range !== dateRange || record.cohort_name !== cohort.name) {
        await base44.asServiceRole.entities.EmpowerUCohortWorkbook.update(record.id, {
          date_range: dateRange,
          cohort_name: cohort.name,
        });
      }
    }

    await logSync(
      base44,
      cohort,
      created ? 'create_workbook' : 'update_dates',
      'success',
      created ? 'Official workbook created from the master template' : (datesUpdated ? `Date range updated to "${dateRange}"` : 'Workbook verified — no changes needed')
    );

    return Response.json({
      ok: true,
      created,
      dates_updated: datesUpdated,
      workbook: {
        file_name: record.workbook_file_name,
        date_range: dateRange,
        status: 'ready',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}