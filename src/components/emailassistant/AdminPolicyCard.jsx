import { useEffect, useState } from "react";
import { Save, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

// The organization-wide controls for the assistant. Administrators set limits
// here; they never gain sight of anyone's email or suggestions.
export default function AdminPolicyCard({ user, policy }) {
  const [form, setForm] = useState(policy);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => setForm(policy), [policy]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        is_enabled: form.is_enabled !== false,
        allowed_automation: form.allowed_automation === "manual" ? "manual" : "proactive",
        monthly_analysis_limit: Number(form.monthly_analysis_limit) || 0,
        retention_days: Number(form.retention_days) || 90,
        notes: form.notes || "",
        updated_by_name: user?.full_name || user?.email || "",
      };
      const existing = await base44.entities.EmailAssistantPolicy.list({ limit: 1 });
      const record = existing.items?.[0];
      if (record) await base44.entities.EmailAssistantPolicy.update(record.id, payload);
      else await base44.entities.EmailAssistantPolicy.create(payload);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground inline-flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-primary" /> Organizational controls
        </p>
        <p className="text-xs text-muted-foreground">
          Visible to administrators only. These limits apply to everyone and override personal settings. You cannot see
          anyone's email or suggestions from here.
        </p>
      </div>

      <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
        <div>
          <p className="text-sm text-foreground">Assistant available to staff</p>
          <p className="text-xs text-muted-foreground">Turn off to disable the assistant across the organization.</p>
        </div>
        <Switch checked={form.is_enabled !== false} onCheckedChange={(v) => set("is_enabled", v)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Highest assistance level allowed</Label>
          <Select value={form.allowed_automation} onValueChange={(v) => set("allowed_automation", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual only</SelectItem>
              <SelectItem value="proactive">Proactive suggestions allowed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="analysis-limit">Analyses per person per month</Label>
          <Input
            id="analysis-limit"
            type="number"
            min={0}
            value={form.monthly_analysis_limit || 0}
            onChange={(e) => set("monthly_analysis_limit", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Zero means no limit.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="retention">Keep analyzed correspondence for (days)</Label>
          <Input
            id="retention"
            type="number"
            min={7}
            value={form.retention_days || 90}
            onChange={(e) => set("retention_days", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="policy-notes">Policy note for administrators</Label>
        <Textarea
          id="policy-notes"
          rows={2}
          value={form.notes || ""}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="e.g. Client-related correspondence must not be copied into shared records."
        />
      </div>

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save organization settings"}
        </Button>
        {saved && <span className="text-xs text-success">Saved</span>}
      </div>
    </div>
  );
}