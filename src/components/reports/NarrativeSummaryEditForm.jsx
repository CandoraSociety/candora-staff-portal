import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { NARRATIVE_CATEGORIES } from "@/components/pathways/MonthlyNarrativeReportTab";

// Inline editor for one narrative summary: correct the reporting month, the
// category and the text without deleting and re-adding the entry.
export default function NarrativeSummaryEditForm({ item, saving, onCancel, onSave }) {
  const [month, setMonth] = useState(item.report_month || "");
  const [category, setCategory] = useState(item.category || "client_issues_trends");
  const [summary, setSummary] = useState(item.summary || "");
  const [error, setError] = useState("");

  const submit = () => {
    if (!month) { setError("Pick a reporting month."); return; }
    if (!summary.trim()) { setError("The summary cannot be empty."); return; }
    setError("");
    onSave({ report_month: month, category, summary: summary.trim() });
  };

  return (
    <div className="space-y-2 pt-1">
      <div className="grid sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Reporting Month</Label>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {NARRATIVE_CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Textarea
        rows={4}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        className="text-sm"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button size="sm" onClick={submit} disabled={saving} className="gap-1.5">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}