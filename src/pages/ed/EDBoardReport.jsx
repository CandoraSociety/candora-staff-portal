import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Plus, Trash2, FileText, Upload, CheckCircle2, X, Lightbulb, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useOrgSettings } from "@/lib/useOrgSettings";
import ActivitySuggestionsPanel from "@/components/shared/ActivitySuggestionsPanel";
import BoardReportSectionEditor from "@/components/ed/BoardReportSectionEditor";
import { generateBoardReportPdf } from "@/lib/generateBoardReportPdf";

const STATUS_BADGE = {
  draft: "bg-muted text-muted-foreground",
  completed: "bg-blue-100 text-blue-700",
  imported: "bg-emerald-100 text-emerald-700",
};

function toMonthInput(date) {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function EDBoardReport() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { orgName } = useOrgSettings();
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [reportForm, setReportForm] = useState({ title: "", report_month: "" });
  const [generating, setGenerating] = useState(false);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["ed-board-reports"],
    queryFn: () => base44.entities.EDBoardReport.list("-report_month"),
  });

  useEffect(() => {
    if (reports.length > 0 && !selectedReportId) setSelectedReportId(reports[0].id);
  }, [reports, selectedReportId]);

  const selectedReport = reports.find((r) => r.id === selectedReportId);

  const createReport = useMutation({
    mutationFn: (data) => base44.entities.EDBoardReport.create(data),
    onSuccess: (created) => {
      qc.invalidateQueries(["ed-board-reports"]);
      setSelectedReportId(created.id);
      setShowForm(false);
      setReportForm({ title: "", report_month: "" });
      toast({ title: "Report created" });
    },
  });

  const updateReport = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EDBoardReport.update(id, data),
    onSuccess: () => qc.invalidateQueries(["ed-board-reports"]),
  });

  const deleteReport = useMutation({
    mutationFn: (id) => base44.entities.EDBoardReport.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(["ed-board-reports"]);
      setSelectedReportId(null);
    },
  });

  const sortedSections = [...(selectedReport?.sections || [])].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );

  const addSection = (title = "", content = "") => {
    const sections = selectedReport.sections || [];
    updateReport.mutate({
      id: selectedReportId,
      data: {
        sections: [...sections, { id: `sec-${Date.now()}`, title, content, order_index: sections.length }],
      },
    });
  };

  const updateSection = (sectionId, updates) => {
    const sections = (selectedReport.sections || []).map((s) =>
      s.id === sectionId ? { ...s, ...updates } : s
    );
    updateReport.mutate({ id: selectedReportId, data: { sections } });
  };

  const deleteSection = (sectionId) => {
    const sections = (selectedReport.sections || []).filter((s) => s.id !== sectionId);
    updateReport.mutate({ id: selectedReportId, data: { sections } });
  };

  const moveSection = (index, direction) => {
    const sections = [...(selectedReport.sections || [])];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= sections.length) return;
    [sections[index], sections[swapIndex]] = [sections[swapIndex], sections[index]];
    updateReport.mutate({
      id: selectedReportId,
      data: { sections: sections.map((s, i) => ({ ...s, order_index: i })) },
    });
  };

  const handleAddSuggestion = (suggestion) => {
    addSection(suggestion.title, suggestion.description || "");
    toast({ title: "Added from suggestions", description: suggestion.title });
  };

  const handleCreateReport = (e) => {
    e.preventDefault();
    const monthDate = reportForm.report_month ? new Date(reportForm.report_month + "-01") : new Date();
    createReport.mutate({
      title: reportForm.title || `${format(monthDate, "MMMM yyyy")} Board Report`,
      report_month: monthDate.toISOString(),
      status: "draft",
      sections: [],
    });
  };

  const handleGenerateAndImport = async () => {
    setGenerating(true);
    try {
      const doc = generateBoardReportPdf(selectedReport, orgName);
      const pdfBlob = doc.output("blob");
      const monthStr = selectedReport.report_month ? format(new Date(selectedReport.report_month), "MMMM yyyy") : "";
      const fileName = `${selectedReport.title}${monthStr ? " - " + monthStr : ""}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Create a BoardDocument so the board can view it in the Board Portal
      const boardDoc = await base44.entities.BoardDocument.create({
        title: selectedReport.title,
        document_type: "ed_report",
        file_url,
        file_name: fileName,
        description: `Monthly Board Report${monthStr ? " — " + monthStr : ""}`,
        is_public_to_board: true,
        tags: ["monthly-report"],
      });

      // Mark the report as imported
      await base44.entities.EDBoardReport.update(selectedReportId, {
        pdf_url: file_url,
        imported_to_board: true,
        imported_date: new Date().toISOString(),
        board_document_id: boardDoc.id,
        status: "imported",
      });

      qc.invalidateQueries(["ed-board-reports"]);
      toast({ title: "Imported to Board Portal", description: "The board can now view this report in Board Documents." });
    } catch (err) {
      toast({ title: "Failed to generate report", description: err?.message || "Unknown error", variant: "destructive" });
    }
    setGenerating(false);
  };

  const handleDeleteReport = (id) => {
    if (confirm("Delete this report? This cannot be undone.")) {
      deleteReport.mutate(id);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="font-heading text-2xl font-bold">Monthly Board Report</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate monthly reports for the board with suggestions from your activity. Import completed PDFs directly to the Board Portal.
        </p>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar — Report list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Reports</h2>
            <Button
              size="sm"
              onClick={() => { setReportForm({ title: "", report_month: toMonthInput(new Date()) }); setShowForm(!showForm); }}
              className="gap-1.5 h-7 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </Button>
          </div>

          {showForm && (
            <form onSubmit={handleCreateReport} className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New Report</span>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Month</label>
                <input
                  type="month"
                  required
                  value={reportForm.report_month}
                  onChange={(e) => {
                    const monthDate = e.target.value ? new Date(e.target.value + "-01") : new Date();
                    setReportForm({ report_month: e.target.value, title: `${format(monthDate, "MMMM yyyy")} Board Report` });
                  }}
                  className="w-full border border-input rounded-lg px-2 py-1.5 text-sm bg-background h-8"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Title</label>
                <Input
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="June 2026 Board Report"
                />
              </div>
              <Button type="submit" size="sm" className="w-full" disabled={createReport.isPending}>
                {createReport.isPending ? "Creating..." : "Create Report"}
              </Button>
            </form>
          )}

          <div className="space-y-1.5">
            {isLoading && <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>}
            {reports.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No reports yet. Click "New" to create one.</p>
              </div>
            )}
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedReportId(r.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors group",
                  selectedReportId === r.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    {r.report_month && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(r.report_month), "MMM yyyy")}
                      </p>
                    )}
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium mt-1 inline-block", STATUS_BADGE[r.status] || STATUS_BADGE.draft)}>
                      {r.status}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteReport(r.id); }}
                    className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main — Report editor */}
        <div>
          {!selectedReport ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Select a report from the left to edit, or create a new one.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Report header */}
              <div className="bg-card border border-border rounded-xl p-5">
                <input
                  value={selectedReport.title}
                  onChange={(e) => updateReport.mutate({ id: selectedReportId, data: { title: e.target.value } })}
                  className="text-lg font-heading font-semibold w-full bg-transparent border-none outline-none focus:bg-muted/30 rounded px-1 -mx-1"
                />
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <input
                    type="month"
                    value={toMonthInput(selectedReport.report_month)}
                    onChange={(e) => {
                      const monthDate = e.target.value ? new Date(e.target.value + "-01") : new Date();
                      updateReport.mutate({ id: selectedReportId, data: { report_month: monthDate.toISOString() } });
                    }}
                    className="text-xs border border-input rounded px-1.5 py-0.5 bg-background"
                  />
                  <span className={cn("text-xs px-2 py-1 rounded font-medium", STATUS_BADGE[selectedReport.status] || STATUS_BADGE.draft)}>
                    {selectedReport.status}
                  </span>
                  {selectedReport.imported_to_board && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Imported to Board Portal
                    </span>
                  )}
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-3">
                {sortedSections.map((section, idx) => (
                  <BoardReportSectionEditor
                    key={section.id}
                    section={section}
                    index={idx}
                    total={sortedSections.length}
                    onUpdate={updateSection}
                    onDelete={deleteSection}
                    onMove={moveSection}
                  />
                ))}
                {sortedSections.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                    <p className="text-sm">No sections yet. Add one below or use suggestions from your activity.</p>
                  </div>
                )}
              </div>

              {/* Add section */}
              <Button variant="outline" size="sm" onClick={() => addSection("", "")} className="gap-1.5 w-full">
                <Plus className="w-4 h-4" /> Add Section
              </Button>

              {/* Activity Suggestions */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">My Activity Suggestions</h3>
                  <span className="text-[10px] text-muted-foreground ml-1">From your notes, tasks, projects & priorities</span>
                </div>
                <ActivitySuggestionsPanel onAddSuggestion={handleAddSuggestion} />
              </div>

              {/* Generate & Import */}
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <Button
                  onClick={handleGenerateAndImport}
                  disabled={generating || sortedSections.length === 0}
                  className="gap-2"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Generating & Importing...
                    </>
                  ) : selectedReport.imported_to_board ? (
                    <>
                      <Upload className="w-4 h-4" /> Re-import to Board Portal
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Generate PDF & Import to Board Portal
                    </>
                  )}
                </Button>
                {selectedReport.imported_to_board && selectedReport.imported_date && (
                  <p className="text-xs text-muted-foreground">
                    Last imported {format(new Date(selectedReport.imported_date), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}