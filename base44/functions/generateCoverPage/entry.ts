import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { report_id, type, reference_image_url, custom_prompt, logo_urls } = await req.json();
    if (!report_id || !type) return Response.json({ error: 'report_id and type required' }, { status: 400 });
    if (!['front', 'back'].includes(type)) return Response.json({ error: 'type must be front or back' }, { status: 400 });

    const report = await base44.asServiceRole.entities.AGRReport.get(report_id);
    if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });

    const brandingList = await base44.asServiceRole.entities.AGRBranding.filter({ report_id });
    const branding = brandingList[0] || {};
    const logos = (logo_urls && logo_urls.length > 0) ? logo_urls : (branding.logo_urls || []);

    const referenceUrls = [];
    if (reference_image_url) referenceUrls.push(reference_image_url);
    if (logos.length > 0) referenceUrls.push(logos[0]);

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
The organization's logo must be prominently featured on the cover.
Style: This must be a full-bleed cover design at 8.5×11 portrait proportions — not a photo of a printed page or a mockup. The image itself should BE the cover design, filling the entire frame edge-to-edge. Clean, modern non-profit annual report aesthetic. Elegant abstract patterns or photography conveying community impact and hope. The organization's logo should appear naturally integrated into the design. No heavy text, no mockup frames, no desk backgrounds, no shadows suggesting a physical object. Just the flat cover design filling the entire image.`;
    } else {
      prompt = custom_prompt || `Design a professional back cover for a non-profit annual report.
Organization: ${branding.legal_name || branding.common_name || ''}
${branding.address ? 'Address: ' + branding.address : ''}
${branding.website ? 'Website: ' + branding.website : ''}
Colors: ${branding.primary_color || '#1a2744'}, ${branding.secondary_color || '#c8952e'}
Style: This must be a full-bleed back cover design at 8.5×11 portrait proportions — not a photo of a printed page or a mockup. The image itself should BE the back cover, filling the entire frame edge-to-edge. Clean, minimal design with subtle branding elements. No mockup frames, no desk backgrounds, no shadows suggesting a physical object. Just the flat back cover filling the entire image.${branding.subsidiary_logos?.length ? ' Room for subsidiary/funder logos.' : ''}`;
    }

    const result = await base44.integrations.Core.GenerateImage({
      prompt,
      existing_image_urls: referenceUrls.length > 0 ? referenceUrls : undefined
    });

    const updateField = type === 'front' ? 'cover_image' : 'back_cover_image';
    await base44.asServiceRole.entities.AGRReport.update(report_id, { [updateField]: result.url });

    return Response.json({ url: result.url, type, prompt });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});