import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { report_id, type, reference_image_url, custom_prompt, logo_urls, subsidiary_logo_urls, funder_logo_urls, front_cover_url } = await req.json();
    if (!report_id || !type) return Response.json({ error: 'report_id and type required' }, { status: 400 });
    if (!['front', 'inside_front', 'inside_back', 'back'].includes(type)) return Response.json({ error: 'type must be front, inside_front, inside_back, or back' }, { status: 400 });

    const report = await base44.asServiceRole.entities.AGRReport.get(report_id);
    if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });

    const brandingList = await base44.asServiceRole.entities.AGRBranding.filter({ report_id });
    const branding = brandingList[0] || {};
    const logos = (logo_urls && logo_urls.length > 0) ? logo_urls : (branding.logo_urls || []);

    const referenceUrls = [];
    if (reference_image_url) referenceUrls.push(reference_image_url);
    if ((type === 'inside_front' || type === 'inside_back') && front_cover_url) referenceUrls.push(front_cover_url);
    // Push all logos as visual reference — AI can use them to match brand style
    if (logos.length > 0) referenceUrls.push(...logos.slice(0, 2));
    if (subsidiary_logo_urls?.length) referenceUrls.push(...subsidiary_logo_urls.slice(0, 2));
    if (funder_logo_urls?.length) referenceUrls.push(...funder_logo_urls.slice(0, 2));

    const NO_MOCKUP = 'CRITICAL INSTRUCTION: Generate a flat graphic design, not a photograph of a physical object. NO 3D perspective, NO shadows underneath, NO desk/table/wall backgrounds, NO curled page corners, NO book spines, NO mockup frames. The entire output must be the cover design itself — just the artwork, edge to edge.';

    const primaryColor = branding.primary_color || '#1a2744';
    const secondaryColor = branding.secondary_color || '#c8952e';
    const accentColor = branding.accent_color || '#2b2de8';
    const colorPalette = `Primary: ${primaryColor} — use as the dominant background / large-area color. Secondary: ${secondaryColor} — use as an accent/highlight. Accent: ${accentColor} — use sparingly for fine details and contrast.`;

    const addl = custom_prompt ? '\n\nADDITIONAL INSTRUCTIONS (these take priority): ' + custom_prompt : '';

    const prompts = {
      front: `${NO_MOCKUP}

Create a non-profit annual report front cover as a flat 2D graphic design using the organization's exact brand identity:

BRAND COLOR PALETTE (use ONLY these colors for the entire design):
${colorPalette}

• Organization: ${branding.common_name || report.title}
• Title: ${report.title}
• Year: ${report.year}
${branding.tagline ? '• Tagline: ' + branding.tagline : ''}

The brand logo is provided as a reference image — reproduce it faithfully and prominently in the design. The subsidiary/funder reference images show additional brand assets to match style.

Style: Modern non-profit annual report cover. Elegant abstract patterns or gradients using the EXACT brand colors above. Portrait orientation. The design should be a clean 2D composition that fills the entire canvas — use the Primary color for the dominant background, the Secondary color for highlights/flourishes, and the Accent color for fine details. The brand logo should be the focal point, with title and year as supporting text.${addl}`,

      inside_front: `${NO_MOCKUP}

Create a subtle inside front cover for a non-profit annual report as a flat 2D graphic design using the organization's exact brand identity:

BRAND COLOR PALETTE (use ONLY these colors for the entire design):
${colorPalette}

• Organization (exact name, do not alter): ${branding.common_name || report.title}

The brand logo is provided as a reference image — use it subtly, perhaps small in a corner.

CRITICAL: This should be noticeably simpler and quieter than the front cover. Carry forward the color palette and general mood, but use minimal, understated imagery — do NOT replicate the front cover's visual motifs. Think of it as a quiet transition page.

Style: Minimal, elegant inside cover. Use the Primary color as a very faint wash or subtle gradient. Mostly empty negative space. Small logo in bottom corner. Clean, quiet, understated. Portrait orientation.${addl}`,

      inside_back: `${NO_MOCKUP}

Create a subtle inside back cover for a non-profit annual report as a flat 2D graphic design using the organization's exact brand identity:

BRAND COLOR PALETTE (use ONLY these colors for the entire design):
${colorPalette}

• Organization (exact name, do not alter): ${branding.common_name || report.title}

The brand logo is provided as a reference image — use it subtly, perhaps small in a corner.

CRITICAL: This should be noticeably simpler and quieter than the front cover. Carry forward the color palette and general mood, but use minimal, understated imagery — do NOT replicate the front cover's visual motifs.

Style: Minimal, elegant inside back cover. Use the Primary color as a very faint wash or subtle pattern. Mostly empty negative space. Small logo in bottom corner. Clean, quiet, understated. Portrait orientation.${addl}`,

      back: `${NO_MOCKUP}

Create a non-profit annual report back cover as a flat 2D graphic design using the organization's exact brand identity:

BRAND COLOR PALETTE (use ONLY these colors for the entire design):
${colorPalette}

${branding.legal_name ? '• Organization name — COPY THIS TEXT CHARACTER BY CHARACTER, do not alter a single letter: "' + branding.legal_name + '"' : branding.common_name ? '• Organization name — COPY THIS TEXT CHARACTER BY CHARACTER, do not alter a single letter: "' + branding.common_name + '"' : ''}
${branding.address ? '• Address — COPY THIS TEXT CHARACTER BY CHARACTER, every comma and space exactly: "' + branding.address + '"' : (branding.address_line1 ? '• Address — COPY THIS TEXT CHARACTER BY CHARACTER, every comma and space exactly: "' + [branding.address_line1, branding.address_line2, branding.address_city, branding.address_province, branding.address_postal_code, branding.address_country].filter(Boolean).join(', ') + '"' : '')}
${branding.website ? '• Website — COPY THIS TEXT CHARACTER BY CHARACTER: "' + branding.website + '"' : ''}

ABSOLUTE TOP PRIORITY — SPELLING: The text on the back cover is the #1 most important element. You must copy every address and name character-by-character from the quoted strings above. Double-check each letter before finalizing. If you misspell "Edmonton" or any other word, the entire generation is a failure. Take your time — accuracy over speed.

CRITICAL: This must be significantly simpler and less busy than the front cover. The back cover should feel like a quiet closing statement — use the Primary color as a subtle wash or gradient background, with the Secondary and Accent colors used sparingly for small accents. No complex imagery, no busy patterns. Think: the back of a book, not a second front page.

Style: Minimal, clean back cover. Portrait orientation. Use the Primary color as background, with the organization name and contact info displayed cleanly in a small, readable font.${branding.subsidiary_logos?.length || branding.funder_logos?.length ? ' Leave room for funder/subsidiary logos at the bottom.' : ''}${addl}`
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