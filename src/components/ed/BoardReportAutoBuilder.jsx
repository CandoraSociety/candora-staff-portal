import React, { useState } from "react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, RefreshCw, AlertTriangle, Wand2, Plus } from "lucide-react";

// Auto-builds draft board report sections from real organization-wide data:
// 1) gathers the month's metrics from every portal (backend function)
// 2) drafts board-ready sections from those numbers (LLM)
// 3) lets the user review, pick, and add them to the report.

const RESPONSE_SCHEMA = {
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
};

function monthLabel(monthIso) {
  const ym = monthIso ? monthIso.slice(0, 7) : format(new Date(), "yyyy-MM");
  return format(new Date(ym + "-01"), "MMMM yyyy");
}

export default function BoardReportAutoBuilder({ reportMonth, onAddSections }) {
  const [stage, setStage] = useState("idle"); // idle | working | review | error
  const [workingLabel, setWorkingLabel] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [selected, setSelected] = useState({});
  const [error, setError] = useState(null);

  const build = async () => {
    const label = monthLabel(reportMonth);
    setStage("working");
    setWorkingLabel(`Gathering ${label} data from every portal…`);
    setError(null);
    try {
      const res = await base44.functions.invoke("getBoardReportMetrics", {
        month: reportMonth ? reportMonth.slice(0, 7) : null,
      });
      const metrics = res.data;

      setWorkingLabel(`Drafting sections from ${label} data…`);
      const llm = await base44.integrations.Core.InvokeLLM({
        prompt:
          `You are drafting the monthly board report for the Candora Society, a community nonprofit in Edmonton.\n` +
          `Reporting month: ${label}.\n\n` +
          `Below is real, organization-wide activity data gathered automatically from every program portal ` +
          `(clients, programs, sessions, registrations, staff, volunteers, finance, fundraising, events):\n\n` +
          `${JSON.stringify(metrics?.metrics || {}, null, 2)}\n\n` +
          `Write the draft sections of this board report. Requirements:\n` +
          `- 5 to 8 sections with clear board-appropriate titles (e.g. "Executive Summary", "Pathways Employment Program", ` +
          `"Resource Centre", "Programs & Community Impact", "People — Staff & Volunteers", "Fundraising & Finance", "Upcoming Events & Activities").\n` +
          `- Use ONLY the numbers provided. Never invent or estimate figures. If a metric is 0 or missing, describe activity ` +
          `qualitatively without fabricating specifics, or merge that topic into a related section.\n` +
          `- Tone: concise, factual, professional. Board members are non-operations readers.\n` +
          `- Each section content is 2 to 5 short paragraphs of plain text (no markdown, no bullet symbols).\n` +
          `- Round money to whole dollars in prose.`,
        response_json_schema: RESPONSE_SCHEMA,
      });

      const payload = llm?.sections ? llm : llm?.data || {};
      const secs = (payload.sections || []).filter(s => s.title && s.content);
      if (!secs.length) throw new Error("The draft came back empty — please try again.");
      setDrafts(secs);
      setSelected(Object.fromEntries(secs.map((_, i) => [i, true])));
      setStage("review");
    } catch (err) {
      setError(err?.message || "Something went wrong");
      setStage("error");
    }
  };

  const selectedSections = drafts.filter((_, i) => selected[i]);
  const selectedCount = selectedSections.length;

  const handleAdd = () => {
    onAddSections(selectedSections);
    setStage("idle");
    setDrafts([]);
    setSelected({});
  };

  if (stage === "idle") {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Pulls real numbers for <span className="font-medium text-foreground">{monthLabel(reportMonth)}</span> — client activity,
          sessions held, registrations, staff & volunteers, reimbursements paid, donations and upcoming events — then drafts
          board-ready sections you can review, edit and include.
        </p>
        <Button onClick={build} className="gap-2">
          <Wand2 className="w-4 h-4" /> Auto-Build Draft Sections
        </Button>
      </div>
    );
  }

  if (stage === "working") {
    return (
      <div className="flex items-center justify-center py-6 gap-3">
        <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground">{workingLabel}</span>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 text-destructive">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={build} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Try Again
        </Button>
      </div>
    );
  }

  // stage === 'review'
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {drafts.length} sections drafted — uncheck any you don't want, then add them to the report and edit freely.
        </p>
        <button onClick={build} className="text-[11px] text-primary hover:underline flex items-center gap-1 shrink-0">
          <RefreshCw className="w-3 h-3" /> Redraft
        </button>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {drafts.map((sec, i) => (
          <div
            key={i}
            className={"p-3 rounded-lg border transition " + (selected[i] ? "border-primary/40 bg-primary/5" : "border-border bg-card opacity-60")}
          >
            <div className="flex items-start gap-2.5">
              <Checkbox
                checked={!!selected[i]}
                onCheckedChange={(v) => setSelected(prev => ({ ...prev, [i]: !!v }))}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary" /> {sec.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                  {sec.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={handleAdd} disabled={selectedCount === 0} className="gap-2 w-full">
        <Plus className="w-4 h-4" /> Add {selectedCount} Section{selectedCount === 1 ? "" : "s"} to Report
      </Button>
    </div>
  );
}