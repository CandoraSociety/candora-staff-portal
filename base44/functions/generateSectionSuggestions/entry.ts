import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { section_title, section_content, report_context, checklist_hints } = await req.json();
    if (!section_title) return Response.json({ error: 'section_title required' }, { status: 400 });

    const prompt = `You are helping write a non-profit Annual General Report. For the section titled "${section_title}", generate 5-7 specific writing suggestions.

${report_context ? 'Report context: ' + report_context + '\n' : ''}
${section_content ? 'Current content:\n' + section_content + '\n' : 'No content written yet.\n'}
${checklist_hints ? 'Prior AGR analysis suggests including:\n' + JSON.stringify(checklist_hints) + '\n' : ''}

Each suggestion should be actionable, specific, and help elevate the writing quality. Format as a numbered list of 5-7 items. Each item should be one sentence.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_sonnet_4_6"
    });

    const raw = typeof result === 'string' ? result : result?.text || '';

    // Parse suggestions from the response (handle markdown code blocks)
    let cleaned = raw.replace(/```[\s\S]*?```/g, '').trim();
    const suggestions = cleaned
      .split(/\n/)
      .filter(line => /^\d+[\.\)]\s/.test(line.trim()))
      .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(Boolean);

    return Response.json({ suggestions: suggestions.length >= 3 ? suggestions : cleaned.split('\n').filter(Boolean) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});