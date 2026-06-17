import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { report_id, type, reference_image_url, custom_prompt } = await req.json();
    if (!report_id || !type) return Response.json({ error: 'report_id and type required' }, { status: 400 });
    if (!['front', 'back'].includes(type)) return Response.json({ error: 'type must be front or back' }, { status: 400 });

    const report = await base44.asServiceRole.entities.AGRReport.get(report_id);
    if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });

    const brandingList = await base44.asServiceRole.entities.AGRBranding.filter({ report_id });
    const branding = brandingList[0] || {};

    let prompt;
    if (type === 'front') {
      prompt = custom_prompt || `Design a professional, elegant front cover for a non-profit annual report.
Organization: ${branding.common_name || report.title}
Report Title: ${report.title}
Year: ${report.year}
${report.description ? 'Subtitle: ' + report.description : ''}
${branding.tagline ? 'Tagline: ' + branding.tagline : ''}
Primary color: ${branding.primary_color || '#1a2744'}
Secondary color: ${branding.secondary_color || '#c8952e'}
Style: Clean, modern, professional non-profit annual report cover. No text overlay needed — use elegant abstract patterns or photography that conveys community impact and hope.`;
    } else {
      prompt = custom_prompt || `Design a professional back cover for a non-profit annual report.
Organization: ${branding.legal_name || branding.common_name || ''}
${branding.address ? 'Address: ' + branding.address : ''}
${branding.website ? 'Website: ' + branding.website : ''}
Colors: ${branding.primary_color || '#1a2744'}, ${branding.secondary_color || '#c8952e'}
Style: Clean, minimal back cover design. Subtle branding elements only. No heavy text — the content will be overlaid separately.${branding.subsidiary_logos?.length ? ' Room for subsidiary/funder logos.' : ''}`;
    }

    const result = await base44.integrations.Core.GenerateImage({
      prompt,
      existing_image_urls: reference_image_url ? [reference_image_url] : undefined
    });

    const updateField = type === 'front' ? 'cover_image' : 'back_cover_image';
    await base44.asServiceRole.entities.AGRReport.update(report_id, { [updateField]: result.url });

    return Response.json({ url: result.url, type, prompt });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});