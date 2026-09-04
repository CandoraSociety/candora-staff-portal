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

// Push the narrative summaries a staff member has flagged (include_in_crt=true)
// for a given reporting month into the matching monthly CRT workbook's
// Narrative Report sheet — Category (col C) + Summary (col D), rows 10+.
//
// Payload:
//   { reportMonth: "YYYY-MM" }  → required
//
// The matching workbook is CRT_<Month>_<Year>.xlsx in the _DEPT_Pathways
// SharePoint folder. Closed (frozen) workbooks are NOT skipped here — the
// manager may legitimately populate a closed month's narrative at reporting
// time. The sheet's Reporting Period dates (A/B) are re-asserted to the
// workbook month so rows are correctly dated regardless of prior state.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* service-role */ }

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }

    const reportMonth = payload?.reportMonth;
    if (!reportMonth || !/^\d{4}-\d{2}$/.test(reportMonth)) {
      return Response.json({ error: 'reportMonth (YYYY-MM) is required.' }, { status: 400 });
    }
    const [yearStr, monthStr] = reportMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;
    const workbookName = `CRT_${MONTHS[monthIdx]}_${year}.xlsx`;

    const accessToken = await getGraphToken();
    const files = await listCrtFiles(accessToken);
    const workbook = files.find(f => f.name.toLowerCase() === workbookName.toLowerCase());
    if (!workbook) {
      return Response.json({
        status: 'not_found',
        message: `No CRT workbook named "${workbookName}" found in SharePoint for ${reportMonth}.`,
      });
    }

    // Fetch the checked narrative summaries for this month.
    const summaries = await base44.asServiceRole.entities.NarrativeSummary.filter({
      report_month: reportMonth,
      include_in_crt: true,
    });

    // Sort by category order, then by submitted_date for a stable layout.
    summaries.sort((a: any, b: any) => {
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
        message: `No narrative summaries are checked for ${reportMonth}. Select at least one summary to push to the CRT.`,
      });
    }

    // Map category keys → human-readable labels for the Category column.
    const mapped = summaries.map((s: any) => ({
      category: CATEGORY_LABELS[s.category] || s.category,
      summary: s.summary || '',
    }));

    // When clearIfEmpty is true (called after a summary is deleted), an empty
    // mapped set clears the sheet's data rows so removed summaries disappear
    // from the CRT Narrative Report, including when none remain.
    const result = await writeNarrativeSummariesIntoWorkbook(accessToken, workbook, mapped);

    return Response.json({
      status: 'success',
      reportMonth,
      workbook: workbook.name,
      checkedCount: summaries.length,
      cleared: summaries.length === 0,
      result,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}