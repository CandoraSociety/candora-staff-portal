import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGraphToken, listCrtFiles } from '../../shared/crtWorkbook.ts';
import { writeNarrativeSummariesIntoWorkbook } from '../../shared/narrativeReport.ts';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const CATEGORY_LABELS: Record<string, string> = {
  client_issues_trends: 'Client Issues / Trends',
  communication_collaboration_scss: 'Communication / Collaboration with SCSS',
  employer_engagement_activities: 'Employer Engagement Activities',
  labour_market_observations: 'Labour Market Observations',
  program_marketing_activities: 'Program Marketing Activities',
  program_delivery_activities: 'Program Delivery Activities',
  risk_management_strategies: 'Risk Management Strategies',
  staffing_updates: 'Staffing Updates',
  other: 'Other',
};

const CATEGORY_ORDER = ['client_issues_trends','communication_collaboration_scss','employer_engagement_activities','labour_market_observations','program_marketing_activities','program_delivery_activities','risk_management_strategies','staffing_updates','other'];

// Excel serial for the first / last day of a YYYY-MM month (same epoch maths as
// the shared crtDatePatch helper, kept local so this function stays self-contained).
function monthSerials(ym: string): { start: number; end: number } | null {
  const m = String(ym || '').match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  const start = Math.round((Date.UTC(year, month, 1) - Date.UTC(1899, 11, 30)) / 86400000);
  const end = Math.round((Date.UTC(year, month + 1, 0) - Date.UTC(1899, 11, 30)) / 86400000);
  return { start, end };
}

// Push the narrative summaries staff have flagged (include_in_crt=true) into a
// monthly CRT workbook's Narrative Report sheet — Category (col C) + Summary
// (col D), rows 10+.
//
// Payload:
//   { crtMonth: "YYYY-MM" }  → the CRT workbook to write into (required)
//   { reportMonth: "YYYY-MM" } → accepted as an alias for crtMonth
//   { clearIfEmpty: true }     → allowed to clear the sheet when nothing is checked
//
// A summary goes into the workbook named by its own crt_month (falling back to
// its report_month), so July's summaries can be filed in August's CRT while
// August's summaries go into the same workbook. Each row keeps the Reporting
// Period dates of the month the summary belongs to, so a July row in August's
// CRT still reads as July.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(error => error.status === 401 ? null : Promise.reject(error));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }

    const crtMonth = payload?.crtMonth || payload?.reportMonth;
    if (!crtMonth || !/^\d{4}-\d{2}$/.test(crtMonth)) {
      return Response.json({ error: 'crtMonth (YYYY-MM) is required.' }, { status: 400 });
    }
    const [yearStr, monthStr] = crtMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;
    const workbookName = `CRT_${MONTHS[monthIdx]}_${year}.xlsx`;

    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);
    const workbook = files.find(f => f.name.toLowerCase() === workbookName.toLowerCase());
    if (!workbook) {
      return Response.json({
        status: 'not_found',
        message: `No CRT workbook named "${workbookName}" found in SharePoint for ${crtMonth}.`,
      });
    }

    // Every checked summary, then keep the ones aimed at this CRT month. A
    // summary with no crt_month belongs to its own report_month's workbook.
    const allChecked = await base44.asServiceRole.entities.NarrativeSummary.filter({
      include_in_crt: true,
    });
    const summaries = (allChecked || []).filter(
      (s: any) => (s.crt_month || s.report_month) === crtMonth
    );

    // Source month first (July's rows above August's), then the order staff set
    // with the arrows, then category / submitted date for anything unordered.
    summaries.sort((a: any, b: any) => {
      const ma = String(a.report_month || '');
      const mb = String(b.report_month || '');
      if (ma !== mb) return ma < mb ? -1 : 1;
      const oa = typeof a.display_order === 'number' ? a.display_order : Number.MAX_SAFE_INTEGER;
      const ob = typeof b.display_order === 'number' ? b.display_order : Number.MAX_SAFE_INTEGER;
      if (oa !== ob) return oa - ob;
      const ca = CATEGORY_ORDER.indexOf(a.category);
      const cb = CATEGORY_ORDER.indexOf(b.category);
      const caRank = ca === -1 ? 99 : ca;
      const cbRank = cb === -1 ? 99 : cb;
      if (caRank !== cbRank) return caRank - cbRank;
      return new Date(a.submitted_date || 0).getTime() - new Date(b.submitted_date || 0).getTime();
    });

    const clearIfEmpty = payload?.clearIfEmpty === true;
    if (summaries.length === 0 && !clearIfEmpty) {
      return Response.json({
        status: 'no_selection',
        message: `No narrative summaries are checked for ${crtMonth}. Select at least one summary to push to the CRT.`,
      });
    }

    // Map each summary to a sheet row, dated to its own reporting month.
    const mapped = summaries.map((s: any) => {
      const serials = monthSerials(s.report_month) || monthSerials(crtMonth);
      return {
        category: CATEGORY_LABELS[s.category] || s.category,
        summary: s.summary || '',
        startSerial: serials?.start,
        endSerial: serials?.end,
      };
    });

    // When clearIfEmpty is true (called after a summary is deleted), an empty
    // mapped set clears the sheet's data rows so removed summaries disappear
    // from the CRT Narrative Report, including when none remain.
    const result = await writeNarrativeSummariesIntoWorkbook(accessToken, workbook, mapped);
    if (result.status !== 'success') {
      return Response.json({ status: 'error', error: result.error || result.message || 'Narrative workbook update failed.', result }, { status: 502 });
    }

    return Response.json({
      status: 'success',
      crtMonth,
      workbook: workbook.name,
      checkedCount: summaries.length,
      cleared: summaries.length === 0,
      result,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}