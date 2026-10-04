import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  getGraphToken, syncCohort, fileItemToBase64, getWorkbookRecord,
  formatWrittenDateRange, logSync,
} from '../../shared/empowerUTracker.ts';

// Downloads the actual cohort-specific official EmpowerU Excel workbook
// (.xlsx, never a substitute report). Before handing the file back it
// re-synchronizes every enrolled participant of the cohort so the download is
// current; if any rows failed to sync the response carries explicit warnings
// so an outdated workbook is never handed over silently.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const cohortId = String(body.cohort_id || '').trim();
    if (!cohortId) return Response.json({ error: 'cohort_id is required' }, { status: 400 });

    const token = await getGraphToken();
    const res = await syncCohort(base44, token, cohortId);
    const cohort = res.cohort;
    const record = res.record;

    const base64 = await fileItemToBase64(token, record.workbook_file_id);

    const warnings = res.errors.map((e) => e.error || 'Unknown sync error');
    if (res.errors.length) {
      await logSync(base44, cohort, 'retry', 'error', `Download-time resync had failures: ${warnings.join('; ')}`);
    }

    return Response.json({
      ok: true,
      file_name: record.workbook_file_name || `EmpowerU Tracker - ${cohort.name}.xlsx`,
      content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      base64,
      date_range: formatWrittenDateRange(cohort.start_date, cohort.end_date),
      last_synced_at: record.last_synced_at || null,
      warnings,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}