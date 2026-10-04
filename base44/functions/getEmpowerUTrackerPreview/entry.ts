import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  getGraphToken, getWorkbookRecord, getTrackerSheet, listWorksheetNames,
  readSheet, findTrackerHeaderRow, findDateRangeCell, formatWrittenDateRange,
} from '../../shared/empowerUTracker.ts';

// Read-only viewer data for the Funder Reports tab: returns the actual current
// contents of the cohort's official Excel workbook (tracker sheet + the other
// worksheets, e.g. the Binder List) so staff can inspect it in the portal.
// This is a viewer only — participant changes continue through the portal's
// existing participant-progress functionality.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const cohortId = String(body.cohort_id || '').trim();
    if (!cohortId) return Response.json({ error: 'cohort_id is required' }, { status: 400 });

    const cohort = await base44.asServiceRole.entities.EmpowerUCohort.get(cohortId);
    if (!cohort) return Response.json({ error: 'Cohort not found' }, { status: 404 });

    const record = await getWorkbookRecord(base44, cohortId);
    if (!record || !record.workbook_file_id) {
      return Response.json({ exists: false, cohort_name: cohort.name });
    }

    const token = await getGraphToken();
    const tracker = await getTrackerSheet(token, record.workbook_file_id);
    const sheet = tracker.sheet;
    const headerIdx = findTrackerHeaderRow(sheet.values);
    const headers = (sheet.values[headerIdx] || []).map((h) => (h === null || h === undefined ? '' : h));

    const rows = [];
    for (let r = headerIdx + 1; r < sheet.values.length; r++) {
      const row = sheet.values[r] || [];
      if (!row.some((v) => v !== null && v !== undefined && String(v).trim() !== '')) continue;
      rows.push({
        row_number: sheet.startRow + r,
        values: row.map((v) => (v === null || v === undefined ? '' : v)),
      });
    }

    const rangeCell = findDateRangeCell(sheet.values);
    let title = '';
    for (let r = 0; r < headerIdx && !title; r++) {
      for (const v of sheet.values[r] || []) {
        if (typeof v === 'string' && v.trim().length > 3 && !isDateRangeString(v)) { title = v.trim(); break; }
      }
    }

    const otherSheets = [];
    const names = await listWorksheetNames(token, record.workbook_file_id);
    for (const n of names) {
      if (n === tracker.name) continue;
      const s = await readSheet(token, record.workbook_file_id, n);
      const sRows = [];
      for (let r = 0; r < s.values.length; r++) {
        const row = s.values[r] || [];
        if (!row.some((v) => v !== null && v !== undefined && String(v).trim() !== '')) continue;
        sRows.push({
          row_number: s.startRow + r,
          values: row.map((v) => (v === null || v === undefined ? '' : v)),
        });
      }
      otherSheets.push({ name: n, rows: sRows });
    }

    return Response.json({
      exists: true,
      cohort_name: cohort.name,
      cohort_dates: formatWrittenDateRange(cohort.start_date, cohort.end_date),
      workbook: {
        file_name: record.workbook_file_name,
        status: record.status,
        participant_count: record.participant_count || 0,
        last_synced_at: record.last_synced_at || null,
        last_sync_error: record.last_sync_error || '',
      },
      tracker_sheet: {
        name: tracker.name,
        title,
        date_range: rangeCell ? rangeCell.value : '',
        headers,
        rows,
      },
      other_sheets: otherSheets,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}