import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Category keys mirror the StaffMonthlyReport fields and populate the CRT
// Narrative Report sheet's Category column (C).
export const NARRATIVE_CATEGORIES = [
  { value: "trends", label: "Trends Observed" },
  { value: "marketing_activities", label: "Marketing & Outreach Activities" },
  { value: "success_stories", label: "Success Stories" },
  { value: "employer_engagements", label: "Employer Engagements" },
  { value: "challenges", label: "Challenges" },
  { value: "goals_next_month", label: "Goals for Next Month" },
  { value: "additional_notes", label: "Additional Notes" },
];

export default function MonthlyNarrativeReportTab({ currentUser }) {
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [category, setCategory] = useState("trends");
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recent, setRecent] = useState([]);

  const loadRecent = async () => {
    try {
      const mine = await base44.entities.NarrativeSummary.list("-submitted_date", 20);
      setRecent((mine || []).filter(r => r.submitted_by === currentUser?.email));
    } catch { setRecent([]); }
  };

  useEffect(() => { if (currentUser?.email) loadRecent(); }, [currentUser?.email]);

  const handleSubmit = async () => {
    if (!reportMonth) { toast.error("Select a reporting month."); return; }
    if (!category) { toast.error("Select a category."); return; }
    if (!summary.trim()) { toast.error("Enter a summary."); return; }
    if (!currentUser?.email) { toast.error("Could not determine your account."); return; }
    setSubmitting(true);
    try {
      await base44.entities.NarrativeSummary.create({
        report_month: reportMonth,
        category,
        summary: summary.trim(),
        submitted_by: currentUser.email,
        submitted_by_name: currentUser.full_name || "",
        submitted_date: new Date().toISOString().split("T")[0],
        include_in_crt: false,
      });
      toast.success("Narrative summary submitted. It will appear in the Staff Monthly Reports tab.");
      setSummary("");
      await loadRecent();
    } catch (e) {
      toast.error("Failed to submit: " + (e.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  const categoryLabel = (key) => NARRATIVE_CATEGORIES.find(c => c.value === key)?.label || key;
  const monthLabel = (ym) => {
    try { return new Date(ym + "-01").toLocaleDateString("en-CA", { year: "numeric", month: "long" }); } catch { return ym; }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" /> Monthly Narrative Report
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Submit a narrative summary for a reporting month and category. Submissions appear in the Reports → Staff Monthly Reports tab, where they can be selected to populate the CRT Narrative Report sheet.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Reporting Month</Label>
              <input
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
              rows={6}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter the narrative summary for this category and month..."
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {submitting ? "Submitting..." : "Submit Summary"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.map(r => (
              <div key={r.id} className="border rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium" style={{ color: "hsl(231,64%,28%)" }}>
                    {monthLabel(r.report_month)} · {categoryLabel(r.category)}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.submitted_date}</span>
                </div>
                <p className="text-muted-foreground line-clamp-2">{r.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}