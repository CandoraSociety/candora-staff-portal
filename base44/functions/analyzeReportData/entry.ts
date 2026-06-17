import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { data_entry_id } = await req.json();
    if (!data_entry_id) return Response.json({ error: 'data_entry_id required' }, { status: 400 });

    const entry = await base44.asServiceRole.entities.AGRReportData.get(data_entry_id);
    if (!entry) return Response.json({ error: 'Data entry not found' }, { status: 404 });

    const rawData = entry.raw_data || '';
    const fileUrl = entry.source_file_url;

    const systemPrompt = `You are a data analyst. Analyze the provided data and produce:
1. A clear narrative summary (2-3 paragraphs, boardroom quality)
2. An appropriate chart configuration using Recharts format

Return your response as JSON.`;

    const schema = {
      type: "object",
      properties: {
        narrative: { type: "string", description: "Boardroom-quality narrative summary of the data" },
        chart_config: {
          type: "object",
          properties: {
            chart_type: { type: "string", enum: ["bar", "line", "pie", "area", "stacked_bar"] },
            title: { type: "string" },
            x_label: { type: "string" },
            y_label: { type: "string" },
            data: { type: "array", items: { type: "object", properties: { name: { type: "string" }, value: { type: "number" } } } }
          },
          required: ["chart_type", "title", "data"]
        }
      },
      required: ["narrative", "chart_config"]
    };

    const prompt = rawData
      ? `Analyze this data:\n\n${rawData}\n\nProvide narrative summary and chart configuration.`
      : `Analyze the file at the provided URL.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: systemPrompt + "\n\n" + prompt,
      model: "claude_sonnet_4_6",
      response_json_schema: schema,
      file_urls: fileUrl ? [fileUrl] : undefined
    });

    await base44.asServiceRole.entities.AGRReportData.update(data_entry_id, {
      ai_narrative: result.narrative,
      chart_config: JSON.stringify(result.chart_config),
      status: "analyzed"
    });

    return Response.json({ success: true, narrative: result.narrative, chart_config: result.chart_config });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});