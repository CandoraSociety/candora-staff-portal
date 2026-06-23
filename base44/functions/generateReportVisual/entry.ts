import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { section_title, section_content, category, report_context, brand_colors, custom_description, aspect_ratio } = await req.json();

    const categoryPrompts = {
      graph: `professional data visualization chart, clean modern style, corporate non-profit branding`,
      chart: `clean bar or pie chart illustration, modern infographic style, professional`,
      comparison: `side-by-side comparison graphic, clear data storytelling, professional infographic`,
      visual_aide: `supporting visual illustration, modern clean style, non-profit theme`,
      infographic: `detailed infographic, modern layout, professional non-profit style`,
      timeline: `horizontal timeline graphic, milestones marked, clean corporate style`,
      diagram: `organizational or process diagram, clean modern layout, professional`
    };

    const colorHint = brand_colors
      ? `Use these brand colors: ${brand_colors}`
      : 'Use professional navy and gold tones';

    const aspectHints = {
      landscape: 'landscape orientation, 16:9 aspect ratio, wide horizontal layout',
      square: 'square 1:1 aspect ratio, balanced composition',
      portrait: 'portrait orientation, 3:4 aspect ratio, tall vertical layout',
      wide: 'wide panoramic banner, 2:1 aspect ratio, extra wide horizontal strip'
    };

    const parts = [
      categoryPrompts[category] || categoryPrompts.infographic,
      colorHint,
      aspect_ratio && aspectHints[aspect_ratio] ? aspectHints[aspect_ratio] : '',
      section_title ? `Topic: ${section_title}` : '',
      section_content ? `Context: ${section_content.slice(0, 300)}` : '',
      custom_description ? `Specific request: ${custom_description}` : '',
      report_context ? `Report context: ${report_context}` : '',
      'Generate a clean, publication-quality visual suitable for inclusion in an annual report.'
    ].filter(Boolean);

    const prompt = parts.join('.\n');

    const result = await base44.integrations.Core.GenerateImage({ prompt });

    return Response.json({ url: result.url, prompt });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});