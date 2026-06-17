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
    // Inside covers + back cover get front cover as a style reference for thematic consistency
    if ((type === 'inside_front' || type === 'inside_back' || type === 'back') && front_cover_url) referenceUrls.push(front_cover_url);
    // Brand logos for front + inside covers only — back cover is text-only, no logo
    if (type !== 'back' && logos.length > 0) referenceUrls.push(...logos.slice(0, 2));
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

Create a non-profit annual report back cover as a flat 2D graphic design. The front cover image is provided as a style reference — match its color mood and overall aesthetic, but keep this much simpler.

BRAND COLOR PALETTE (use ONLY these colors for the entire design):
${colorPalette}

ABSOLUTELY NO LOGO: Do not include the organization logo on the back cover. This page is text-only — no logo fragments, no logo shapes, nothing from the logo at all.

CRITICAL — TEXT TO RENDER EXACTLY (copy character-by-character, verify each letter):
${branding.legal_name ? '• Organization: "' + branding.legal_name + '"' : branding.common_name ? '• Organization: "' + branding.common_name + '"' : ''}
${branding.address ? '• Address: "' + branding.address + '"' : (branding.address_line1 ? '• Address: "' + [branding.address_line1, branding.address_line2, branding.address_city, branding.address_province, branding.address_postal_code, branding.address_country].filter(Boolean).join(', ') + '"' : '')}
${branding.website ? '• Website: "' + branding.website + '"' : ''}

SPELLING CHECKLIST — before finalizing, verify EVERY character:
☐ "Edmonton" is E-d-m-o-n-t-o-n (not Edmondon, Edmenton, Edmunton, or any other variation)
☐ "Candora" is C-a-n-d-o-r-a
☐ Every comma, period, and space in the address matches exactly
☐ The website URL has correct slashes, dots, and no extra characters

This is a text-on-background design. Render the organization name in a clean readable font centered on the page, with the address and website below it in smaller text. Use the Primary color as a subtle wash or gradient background. The Secondary and Accent colors may appear as thin decorative lines or very small accents. Nothing else — no abstract shapes, no patterns, no imagery. Think of it as a simple closing page with just the essential contact details.${branding.subsidiary_logos?.length || branding.funder_logos?.length ? ' Leave room at the very bottom for small funder/subsidiary logos.' : ''}${addl}`
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