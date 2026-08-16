import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Loader2, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { NARRATIVE_CATEGORIES } from "@/components/pathways/MonthlyNarrativeReportTab";

export default function StaffMonthlyReports() {
  const queryClient = useQueryClient();
  const [filterWorker, setFilterWorker] = useState("all");

  // Inline "Add Narrative Summary" form state
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [category, setCategory] = useState("client_issues_trends");
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['all-clients'],
    queryFn: () => base44.entities.Client.list("-created_date", 1000),
  });

  const { data: narrativeSummaries = [], refetch: refetchSummaries, isLoading } = useQuery({
    queryKey: ['narrative-summaries'],
    queryFn: () => base44.entities.NarrativeSummary.list("-submitted_date", 500),
  });

  const [pushingMonth, setPushingMonth] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleSubmit = async () => {
    if (!reportMonth) { toast.error("Select a reporting month."); return; }
    if (!category) { toast.error("Select a category."); return; }
    if (!summary.trim()) { toast.error("Enter a summary."); return; }
    if (!user?.email) { toast.error("Could not determine your account."); return; }
    setSubmitting(true);
    try {
      await base44.entities.NarrativeSummary.create({
        report_month: reportMonth,
        category,
        summary: summary.trim(),
        submitted_by: user.email,
        submitted_by_name: user.full_name || "",
        submitted_date: new Date().toISOString().split("T")[0],
        include_in_crt: false,
      });
      toast.success("Narrative summary added.");
      setSummary("");
      await refetchSummaries();
    } catch (e) {
      toast.error("Failed to add: " + (e.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleIncludeInCrt = async (item) => {
    try {
      await base44.entities.NarrativeSummary.update(item.id, { include_in_crt: !item.include_in_crt });
      await refetchSummaries();
    } catch (e) {
      toast.error("Failed to update: " + (e.message || "Unknown error"));
    }
  };

  const handleDelete = async (item) => {
    setDeletingId(item.id);
    const wasFlagged = !!item.include_in_crt;
    try {
      await base44.entities.NarrativeSummary.delete(item.id);
      await refetchSummaries();
      if (wasFlagged) {
        // Reconcile the CRT Narrative Report for this month: rewrites only the
        // remaining flagged summaries, clearing the deleted one (and clearing
        // the whole sheet if none remain).
        try {
          await base44.functions.invoke('syncNarrativeSummariesToCrt', {
            reportMonth: item.report_month,
            clearIfEmpty: true,
          });
          toast.success("Summary removed and CRT updated.");
        } catch (syncErr) {
          toast.error("Removed from app, but CRT sync failed: " + (syncErr.message || "Unknown error"));
        }
      } else {
        toast.success("Summary removed.");
      }
    } catch (e) {
      toast.error("Failed to delete: " + (e.message || "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  };

  const pushMonthToCrt = async (month) => {
    setPushingMonth(month);
    try {
      const res = await base44.functions.invoke('syncNarrativeSummariesToCrt', { reportMonth: month });
      const data = res.data;
      if (data.status === 'success') {
        toast.success(`Pushed ${data.checkedCount} narrative summary(ies) to ${data.workbook}.`);
      } else if (data.status === 'not_found') {
        toast.error(data.message);
      } else {
        toast.error(data.error || data.message || "Push failed");
      }
    } catch (e) {
      toast.error("Push failed: " + (e.message || "Unknown error"));
    } finally {
      setPushingMonth(null);
    }
  };

  const categoryLabel = (key) => NARRATIVE_CATEGORIES.find(c => c.value === key)?.label || key;
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthLabel = (ym) => {
    const [y, m] = String(ym || '').split('-');
    const idx = parseInt(m, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx > 11) return ym;
    return `${MONTH_NAMES[idx]} ${y}`;
  };

  const groupedSummaries = useMemo(() => {
    let s = narrativeSummaries;
    if (filterWorker !== "all") {
      s = s.filter(x => x.submitted_by_name === filterWorker);
    }
    const groups = {};
    s.forEach(x => {
      if (!groups[x.report_month]) groups[x.report_month] = [];
      groups[x.report_month].push(x);
    });
    return groups;
  }, [narrativeSummaries, filterWorker]);

  const workers = useMemo(() => {
    const unique = new Set(clients.map(c => c.assigned_worker_name).filter(Boolean));
    return Array.from(unique).sort();
  }, [clients]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Narrative Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Narrative Summary
          </CardTitle>
          <CardDescription>
            Add a narrative summary for a reporting month and category. Check the box next to a summary to include it when pushing to that month's CRT Narrative Report sheet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Reporting Month</Label>
              <Input
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                max={new Date().toISOString().slice(0, 7)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NARRATIVE_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Summary</Label>
            <Textarea
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter the narrative summary for this category and month..."
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {submitting ? "Adding..." : "Add Summary"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Narrative Summaries list */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Narrative Summaries</h3>
        <Select value={filterWorker} onValueChange={setFilterWorker}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            {workers.map(w => (
              <SelectItem key={w} value={w}>{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {Object.keys(groupedSummaries).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Narrative Summaries</h3>
            <p className="text-muted-foreground">Add a summary using the form above.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedSummaries)
          .sort((a, b) => new Date(b[0] + "-01") - new Date(a[0] + "-01"))
          .map(([month, items]) => {
            const checkedCount = items.filter(i => i.include_in_crt).length;
            return (
              <Card key={month}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-base">{monthLabel(month)}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{items.length} summary{items.length !== 1 ? "ies" : ""}</Badge>
                      <Badge variant={checkedCount > 0 ? "default" : "secondary"}>
                        {checkedCount} selected
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pushMonthToCrt(month)}
                        disabled={pushingMonth === month || checkedCount === 0}
                        className="gap-1.5"
                      >
                        {pushingMonth === month
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Upload className="w-3.5 h-3.5" />}
                        {pushingMonth === month ? "Pushing..." : "Push to CRT"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="border rounded-lg p-3 flex gap-3">
                      <input
                        type="checkbox"
                        checked={!!item.include_in_crt}
                        onChange={() => toggleIncludeInCrt(item)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 accent-[#2b2de8] cursor-pointer shrink-0"
                        title="Include in CRT Narrative Report sheet for this month"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold" style={{ color: "hsl(231,64%,28%)" }}>
                            {categoryLabel(item.category)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {item.submitted_by_name} · {item.submitted_date}
                            </span>
                            <button
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                              title="Delete summary"
                            >
                              {deletingId === item.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.summary}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })
      )}
    </div>
  );
}