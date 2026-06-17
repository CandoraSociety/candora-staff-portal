import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { report_id, type, reference_image_url, custom_prompt, front_cover_url } = await req.json();
    if (!report_id || !type) return Response.json({ error: 'report_id and type required' }, { status: 400 });
    if (!['front', 'inside_front', 'inside_back', 'back'].includes(type)) return Response.json({ error: 'type must be front, inside_front, inside_back, or back' }, { status: 400 });

    const report = await base44.asServiceRole.entities.AGRReport.get(report_id);
    if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });

    const brandingList = await base44.asServiceRole.entities.AGRBranding.filter({ report_id });
    const branding = brandingList[0] || {};

    // Build reference images for style only — NEVER include logos.
    // AI cannot faithfully reproduce logos; the real logo is overlaid in HTML on the front/back covers.
    // Only use: the current cover image (for regeneration) and front cover (for thematic consistency).
    const referenceUrls = [];
    if (reference_image_url) referenceUrls.push(reference_image_url);
    if ((type === 'inside_front' || type === 'inside_back' || type === 'back') && front_cover_url) {
      referenceUrls.push(front_cover_url);
    }

    const primaryColor = branding.primary_color || '#1a2744';
    const secondaryColor = branding.secondary_color || '#c8952e';
    const accentColor = branding.accent_color || '#2b2de8';

    const FULL_BLEED = [
      'CRITICAL: This image is an 8.5×11 inch full-bleed cover page.',
      'The design MUST fill every pixel from edge to edge — NO white borders, NO margins, NO empty space at edges.',
      'Extend all backgrounds, gradients, and patterns all the way to every edge of the canvas.',
      'NO mockup style — NO 3D perspective, NO shadows underneath, NO desk/table/wall, NO curled corners, NO book spines.',
      'Generate a flat 2D graphic that IS the cover itself.',
    ].join(' ');

    const colorPalette = [
      `Primary color: ${primaryColor} — use as the dominant background color.`,
      `Secondary color: ${secondaryColor} — use for highlights and accents.`,
      `Accent color: ${accentColor} — use sparingly for fine details.`,
      'Use ONLY these three colors plus their tints/shades. NO other colors.',
    ].join(' ');

    const NO_TEXT = [
      'DO NOT include any text, letters, words, numbers, or characters of any kind.',
      'DO NOT include the organization name, report title, year, tagline, or any other text.',
      'Text will be overlaid separately in HTML with perfect accuracy.',
      'If you include any text it will conflict with the HTML overlay and look broken.',
    ].join(' ');

    const NO_LOGO = [
      'DO NOT include a logo, icon, emblem, or symbol of any kind.',
      'The real logo will be overlaid in HTML with pixel-perfect accuracy.',
      'Any logo you generate will look distorted or wrong compared to the real one and ruin the cover.',
    ].join(' ');

    const addl = custom_prompt ? '\n\nADDITIONAL INSTRUCTIONS (these take priority): ' + custom_prompt : '';

    const prompts = {
      front: `${FULL_BLEED}

Create a non-profit annual report front cover BACKGROUND as a flat 2D graphic design.

${colorPalette}

${NO_TEXT}

${NO_LOGO}

Design: A striking, professional background for an annual report front cover. Use elegant abstract gradients, flowing geometric patterns, or sophisticated color fields. The Primary color should dominate as the main background. Use the Secondary color for sweeping curves, diagonal bands, or organic shapes that create visual movement. Use the Accent color for very subtle dot patterns, thin lines, or tiny highlights.

This should look like a polished, modern non-profit annual report cover — but it is ONLY the background layer. It must stand on its own as a beautiful design while leaving the center area relatively unobstructed for the logo and title overlay (which will be added separately in HTML). Portrait orientation.${addl}`,

      inside_front: `${FULL_BLEED}

Create a subtle inside front cover BACKGROUND for a non-profit annual report as a flat 2D graphic design.

${colorPalette}

${NO_TEXT}

${NO_LOGO}

Design: Minimal and understated. Use a very faint wash of the Primary color — almost white with just a hint of the brand. Maybe a gentle gradient that transitions from the Primary tint at one edge to nearly transparent. The Secondary color can appear as a single thin decorative line or a very subtle geometric detail in one corner. Mostly empty negative space.

This is a quiet transitional page inside the report — it should feel calm, elegant, and understated. The front cover style reference is provided so you can match the overall mood, but keep this dramatically simpler.${addl}`,

      inside_back: `${FULL_BLEED}

Create a subtle inside back cover BACKGROUND for a non-profit annual report as a flat 2D graphic design.

${colorPalette}

${NO_TEXT}

${NO_LOGO}

Design: Minimal and understated. Use a very faint wash of the Primary color — almost white with just a hint of the brand. Maybe a gentle gradient that transitions from the Primary tint at one edge to nearly transparent. The Secondary color can appear as a single thin decorative line or a very subtle geometric detail in one corner. Mostly empty negative space.

This is a quiet transitional page inside the report — it should feel calm, elegant, and understated. The front cover style reference is provided so you can match the overall mood, but keep this dramatically simpler.${addl}`,

      back: `${FULL_BLEED}

Create a non-profit annual report back cover as a flat 2D graphic design.

${colorPalette}

Include the organization's legal name, full address, and website as clean, legible text on the cover.

Design: A simple closing page. Use the Primary color as a very subtle wash or gentle gradient. The Secondary and Accent colors may appear as elegant decorative lines or accents. The organization's full contact details should be prominently displayed in a clean layout.

The front cover image is provided as a style reference — match the color mood and overall aesthetic, but keep this dramatically simpler. This is the closing page — it should feel like a quiet, elegant sign-off.${addl}`
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