import React, { useState } from "react";
import { ClipboardPaste, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function BoardReportPasteFormatter({ reportTitle, reportMonth, onAddSections }) {
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const monthStr = reportMonth ? format(new Date(reportMonth), "MMMM yyyy") : "";

  const handleFormat = async () => {
    if (!text.trim()) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are preparing the monthly board report for the Candora Society of Edmonton.
Report title: ${reportTitle}
Report month: ${monthStr}

The user has pasted raw content below, which may range from just a couple of points to an entire report's worth of text. Clean it up and format it into report sections:
- If it is only a few points, produce ONE section: a fitting title, with the points as a bulleted list.
- If it is substantial, split it into logical sections (one per topic), each with a clear, professional title.
- Preserve ALL information and facts exactly — do not invent, add, or drop any details.
- Fix grammar, punctuation, and structure; use a professional board-report tone.
- Each section's content must be HTML using ONLY these tags: <p>, <ul>, <ol>, <li>, <strong>, <em>, <br>. No headings, tables, images, or any other tags.

PASTED CONTENT:
"""
${text}
"""`,
        response_json_schema: {
          type: "object",
          properties: {
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                },
                required: ["title", "content"],
              },
            },
          },
          required: ["sections"],
        },
      });

      const sections = (res?.sections || []).filter(
        (s) => ((s.title || "").trim() || (s.content || "").trim())
      );
      if (!sections.length) throw new Error("Nothing was formatted — try re-pasting the content.");
      onAddSections(sections);
      setText("");
    } catch (err) {
      setError(err?.message || "Formatting failed. Please try again.");
    }
    setProcessing(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardPaste className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Paste Content &amp; Format</h3>
        <span className="text-[10px] text-muted-foreground ml-1">A few points or a full report — cleaned up, structured, and added as branded sections</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Paste anything here — a couple of quick points, notes from programs, or an entire report's worth of text. It will be cleaned up, structured into sections, and formatted with the usual Candora board report branding.${monthStr ? `\n\nReporting month: ${monthStr}` : ""}`}
        className="w-full min-h-[140px] border border-input rounded-lg p-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        disabled={processing}
      />
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      <div className="flex items-center gap-3 mt-3">
        <Button size="sm" onClick={handleFormat} disabled={processing || !text.trim()} className="gap-1.5">
          {processing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Formatting…
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" /> Format &amp; Add to Report
            </>
          )}
        </Button>
        {processing && <p className="text-xs text-muted-foreground">Reading your content and structuring it into sections…</p>}
      </div>
    </div>
  );
}