import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { report_id, type, reference_image_url, custom_prompt, logo_urls, front_cover_url } = await req.json();
    if (!report_id || !type) return Response.json({ error: 'report_id and type required' }, { status: 400 });
    if (!['front', 'inside_front', 'inside_back', 'back'].includes(type)) return Response.json({ error: 'type must be front, inside_front, inside_back, or back' }, { status: 400 });

    const report = await base44.asServiceRole.entities.AGRReport.get(report_id);
    if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });

    const brandingList = await base44.asServiceRole.entities.AGRBranding.filter({ report_id });
    const branding = brandingList[0] || {};
    const logos = (logo_urls && logo_urls.length > 0) ? logo_urls : (branding.logo_urls || []);

    const referenceUrls = [];
    if (reference_image_url) referenceUrls.push(reference_image_url);
    // Inside covers get front cover as style reference for a connected feel
    if ((type === 'inside_front' || type === 'inside_back') && front_cover_url) referenceUrls.push(front_cover_url);
    if (logos.length > 0) referenceUrls.push(logos[0]);

    const NO_MOCKUP = 'CRITICAL INSTRUCTION: Generate a flat graphic design, not a photograph of a physical object. NO 3D perspective, NO shadows underneath, NO desk/table/wall backgrounds, NO curled page corners, NO book spines, NO mockup frames. The entire output must be the cover design itself — just the artwork, edge to edge.';

    const colors = `${branding.primary_color || '#1a2744'} and ${branding.secondary_color || '#c8952e'}`;

    const addl = custom_prompt ? '\n\nADDITIONAL INSTRUCTIONS (these take priority): ' + custom_prompt : '';

    const prompts = {
      front: `${NO_MOCKUP}

Create a non-profit annual report front cover as a flat 2D graphic design:
• Organization: ${branding.common_name || report.title}
• Title: ${report.title}
• Year: ${report.year}
${branding.tagline ? '• Tagline: ' + branding.tagline : ''}
• Colors: ${colors}
• Include the organization logo prominently in the design

Style: Modern non-profit annual report cover. Elegant abstract patterns, gradients, or photography conveying community impact, growth, and hope. Portrait orientation. The design should be a clean 2D composition that fills the entire canvas — abstract background with the logo as focal point, title and year as accents.${addl}`,

      inside_front: `${NO_MOCKUP}

Create a subtle inside front cover for a non-profit annual report as a flat 2D graphic design:
• Organization (exact name, do not alter): ${branding.common_name || report.title}
• Colors: ${colors}

CRITICAL: This should be noticeably simpler and quieter than the front cover. Carry forward the color palette and general mood, but use minimal, understated imagery — do NOT replicate the front cover's visual motifs. Think of it as a quiet transition page.

Style: Minimal, elegant inside cover. Subtle brand color wash or very faint gradient. Mostly empty negative space with perhaps a small logo at the bottom or corner. Clean, quiet, understated. Portrait orientation.${addl}`,

      inside_back: `${NO_MOCKUP}

Create a subtle inside back cover for a non-profit annual report as a flat 2D graphic design:
• Organization (exact name, do not alter): ${branding.common_name || report.title}
• Colors: ${colors}

CRITICAL: This should be noticeably simpler and quieter than the front cover. Carry forward the color palette and general mood, but use minimal, understated imagery — do NOT replicate the front cover's visual motifs.

Style: Minimal, elegant inside back cover. Subtle brand color wash or very faint pattern. Mostly empty negative space. Clean, quiet, understated. Portrait orientation.${addl}`,

      back: `${NO_MOCKUP}

Create a non-profit annual report back cover as a flat 2D graphic design.
${branding.legal_name ? '• Legal name (USE THIS EXACT TEXT — never alter, misspell, or paraphrase): ' + branding.legal_name : branding.common_name ? '• Organization (USE THIS EXACT TEXT): ' + branding.common_name : ''}
${branding.address ? '• Address (USE THIS EXACT TEXT — never alter, misspell, or paraphrase): ' + branding.address : ''}
${branding.website ? '• Website (USE THIS EXACT TEXT — never alter, misspell, or paraphrase): ' + branding.website : ''}
• Colors: ${colors}

CRITICAL: This must be significantly simpler and less busy than the front cover. The back cover should feel like a quiet closing statement — carry forward ONLY the color palette and general mood from the front, but use the simplest version of that theme. No complex imagery, no busy patterns. Think: the back of a book, not a second front page.
${branding.address || branding.website ? 'Any address or website text shown on the design MUST match the exact spelling provided above. Do NOT generate or guess any text — only use the exact text strings given.' : ''}

Style: Minimal, clean back cover. Portrait orientation. Simple abstract background or subtle brand color wash.${branding.subsidiary_logos?.length ? ' Leave room for funder/subsidiary logos at the bottom.' : ''}${addl}`
    };

    const result = await base44.integrations.Core.GenerateImage({
      prompt: prompts[type],
      existing_image_urls: referenceUrls.length > 0 ? referenceUrls : undefined
    });

    const fieldMap = {
      front: 'cover_image',
      inside_front: 'inside_front_cover_image',
      inside_back: 'inside_back_cover_image',
      back: 'back_cover_image'
    };
    const updateField = fieldMap[type];
    await base44.asServiceRole.entities.AGRReport.update(report_id, { [updateField]: result.url });

    return Response.json({ url: result.url, type, prompt: prompts[type] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});