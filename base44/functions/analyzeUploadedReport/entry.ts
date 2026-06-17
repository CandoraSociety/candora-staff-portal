import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    const schema = {
      type: "object",
      properties: {
        summary: { type: "string", description: "Executive summary of the report contents" },
        layout_template: {
          type: "array",
          items: {
            type: "object",
            properties: {
              section_name: { type: "string" },
              layout_type: { type: "string", enum: ["text_only", "image_left", "image_right", "image_full", "two_column"] },
              description: { type: "string" }
            }
          }
        },
        visual_style: {
          type: "object",
          properties: {
            primary_colors: { type: "array", items: { type: "string" } },
            fonts_detected: { type: "array", items: { type: "string" } },
            tone: { type: "string", enum: ["formal", "conversational", "inspirational", "data_driven", "minimal"] },
            notable_elements: { type: "array", items: { type: "string" } }
          }
        },
        content_checklist: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item: { type: "string" },
              section: { type: "string" },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              notes: { type: "string" }
            }
          }
        }
      },
      required: ["summary", "layout_template", "visual_style", "content_checklist"]
    };

    const prompt = `Analyze this uploaded report document. Extract:
- The overall structure and layout of the document (sections, their layouts). IMPORTANT: do NOT include "Table of Contents" as a section — skip it entirely. Only include actual content sections (e.g. Executive Summary, Programs, Financials, etc.).
- Visual style (colors, fonts, tone)
- A content checklist of what should be included in each section

Be thorough and detailed.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: "gemini_3_1_pro",
      response_json_schema: schema,
      file_urls: [file_url],
      add_context_from_internet: false
    });

    const created = await base44.asServiceRole.entities.AGRAnalysisResult.create({
      source_file_url: file_url,
      layout_template: JSON.stringify(result.layout_template),
      visual_style: JSON.stringify(result.visual_style),
      content_checklist: JSON.stringify(result.content_checklist),
      raw_analysis: JSON.stringify(result)
    });

    return Response.json({ id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});