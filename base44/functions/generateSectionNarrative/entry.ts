import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { section_title, section_content, hints, report_context } = await req.json();
    if (!section_title) return Response.json({ error: 'section_title required' }, { status: 400 });

    const prompt = `You are writing a section for a non-profit organization's Annual General Report. Write boardroom-quality narrative for the section titled "${section_title}".

${report_context ? 'Report context: ' + report_context + '\n' : ''}
${section_content ? 'Current draft content:\n' + section_content + '\n' : ''}
${hints ? 'Writing hints from AGR analysis:\n' + JSON.stringify(hints) + '\n' : ''}

Guidelines:
- Professional, warm, inspiring tone appropriate for a non-profit annual report
- 3-5 paragraphs, approximately 300-500 words
- Include specific data points and impact metrics where referenced
- Highlight community impact and organizational achievements
- Use clear, accessible language — avoid jargon unless explained
- End with a forward-looking statement

Return ONLY the narrative text, no JSON wrapper.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_sonnet_4_6"
    });

    const narrative = typeof result === 'string' ? result : result?.text || result?.narrative || '';

    return Response.json({ narrative });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});