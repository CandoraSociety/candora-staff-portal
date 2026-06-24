import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { report_id } = await req.json();
    if (!report_id) return Response.json({ error: 'report_id required' }, { status: 400 });

    const [report, sections, brandingList] = await Promise.all([
      base44.entities.AGRReport.get(report_id),
      base44.entities.AGRReportSection.filter({ report_id }, 'order_index'),
      base44.entities.AGRBranding.filter({ report_id }),
    ]);

    const branding = brandingList[0] || null;
    const pc = branding?.primary_color || '#1a2744';
    const ac = branding?.accent_color || '#2b2de8';

    // Build minimal HTML that triggers browser print
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${report.title}</title></head><body><script>window.location.href='/reporting/agr/${report_id}/print?autoPrint=true';<\/script></body></html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});