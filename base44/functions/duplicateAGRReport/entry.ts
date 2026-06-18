import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { report_id } = await req.json();
    if (!report_id) return Response.json({ error: 'report_id is required' }, { status: 400 });

    const sr = base44.asServiceRole;

    // Fetch original report
    const original = await sr.entities.AGRReport.get(report_id);
    if (!original) return Response.json({ error: 'Report not found' }, { status: 404 });

    // Clone report — omit system fields
    const { id, created_date, updated_date, created_by_id, ...reportFields } = original;
    const newReport = await sr.entities.AGRReport.create({
      ...reportFields,
      title: (original.title || 'Untitled') + ' (Copy)',
      status: 'draft',
    });

    // Clone sections
    const sections = await sr.entities.AGRReportSection.filter({ report_id });
    if (sections.length > 0) {
      const sectionBulk = sections.map(s => {
        const { id: sid, created_date: sc, updated_date: su, created_by_id: sb, ...sf } = s;
        return { ...sf, report_id: newReport.id };
      });
      await sr.entities.AGRReportSection.bulkCreate(sectionBulk);
    }

    // Clone branding
    const brandingList = await sr.entities.AGRBranding.filter({ report_id });
    if (brandingList.length > 0) {
      const brandingBulk = brandingList.map(b => {
        const { id: bid, created_date: bc, updated_date: bu, created_by_id: bb, ...bf } = b;
        return { ...bf, report_id: newReport.id };
      });
      await sr.entities.AGRBranding.bulkCreate(brandingBulk);
    }

    // Clone data entries
    const dataEntries = await sr.entities.AGRReportData.filter({ report_id });
    if (dataEntries.length > 0) {
      const dataBulk = dataEntries.map(d => {
        const { id: did, created_date: dc, updated_date: du, created_by_id: db, ...df } = d;
        return { ...df, report_id: newReport.id };
      });
      await sr.entities.AGRReportData.bulkCreate(dataBulk);
    }

    // Clone analysis result
    const analysisList = await sr.entities.AGRAnalysisResult.filter({ report_id });
    if (analysisList.length > 0) {
      const analysisBulk = analysisList.map(a => {
        const { id: aid, created_date: ac, updated_date: au, created_by_id: ab, ...af } = a;
        return { ...af, report_id: newReport.id };
      });
      await sr.entities.AGRAnalysisResult.bulkCreate(analysisBulk);
    }

    return Response.json({ id: newReport.id, title: newReport.title });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});