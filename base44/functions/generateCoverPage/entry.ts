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

    const NO_MOCKUP = 'CRITICAL INSTRUCTION: Generate a flat graphic design, not a photograph of a physical object. NO 3D perspective, NO shadows underneath, NO desk/table/wall backgrounds, NO curled page corners, NO book spines, NO mockup frames. The entire output must be the cover design itself — just the artwork, edge to edge.';

    let prompt;
    if (type === 'front') {
      prompt = custom_prompt || `${NO_MOCKUP}

Create a non-profit annual report front cover as a flat 2D graphic design:
• Organization: ${branding.common_name || report.title}
• Title: ${report.title}
• Year: ${report.year}
${branding.tagline ? '• Tagline: ' + branding.tagline : ''}
• Colors: ${branding.primary_color || '#1a2744'} and ${branding.secondary_color || '#c8952e'}
• Include the organization logo prominently in the design

Style: Modern non-profit annual report cover. Elegant abstract patterns, gradients, or photography conveying community impact, growth, and hope. Portrait orientation. The design should be a clean 2D composition that fills the entire canvas — abstract background with the logo as focal point, title and year as accents.`;
    } else {
      prompt = custom_prompt || `${NO_MOCKUP}

Create a non-profit annual report back cover as a flat 2D graphic design:
• Organization: ${branding.legal_name || branding.common_name || ''}
${branding.address ? '• Address: ' + branding.address : ''}
${branding.website ? '• Website: ' + branding.website : ''}
• Colors: ${branding.primary_color || '#1a2744'} and ${branding.secondary_color || '#c8952e'}

Style: Minimal, clean back cover design. Portrait orientation. Simple abstract background or subtle brand pattern. Light text for contact/address information if included.${branding.subsidiary_logos?.length ? ' Include space for funder/subsidiary logos at the bottom.' : ''}`;
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