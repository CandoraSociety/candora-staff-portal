import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { section_title, section_content, category, report_context, brand_colors } = await req.json();
    if (!section_title) return Response.json({ error: 'section_title required' }, { status: 400 });

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

    const prompt = `${categoryPrompts[category] || categoryPrompts.infographic}.
${colorHint}.
Topic: ${section_title}${section_content ? '\nContext: ' + section_content.slice(0, 200) : ''}
${report_context ? '\nReport context: ' + report_context : ''}
Generate a clean, publication-quality visual suitable for inclusion in an annual report.`;

    const result = await base44.integrations.Core.GenerateImage({ prompt });

    return Response.json({ url: result.url, prompt });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});