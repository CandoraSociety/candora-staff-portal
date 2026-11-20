import { useEffect, useState } from "react";
import { Save, ShieldCheck, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FEATURES, TONES, allowedAutomation } from "@/lib/emailAssistant";

// Personal settings. Organizational policy is shown alongside and always wins.
export default function SettingsTab({ user, prefs, policy, savePrefs, messageCount, onClearSamples, clearing }) {
  const [form, setForm] = useState(prefs);
  const [saved, setSaved] = useState(false);

  useEffect(() => setForm(prefs), [prefs]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };
  const setFeature = (key, value) => {
    setForm((f) => ({ ...f, features: { ...f.features, [key]: value } }));
    setSaved(false);
  };

  const save = async () => {
    await savePrefs.mutateAsync({
      automation_level: form.automation_level,
      features: form.features,
      preferred_task_manager: form.preferred_task_manager,
      drafting_tone: form.drafting_tone,
      default_priority: form.default_priority,
      briefing_mode: form.briefing_mode,
      follow_up_reminder_days: Number(form.follow_up_reminder_days) || 3,
      notify_new_suggestions: form.notify_new_suggestions,
      exclusion_terms: form.exclusion_terms || "",
    });
    setSaved(true);
  };

  const policyAllowsProactive = allowedAutomation(policy) === "proactive";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Settings and preferences</h2>
        <p className="text-sm text-muted-foreground">
          These settings are yours alone. Your organization's policy sets the limits.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground">How much help you want</p>
          <p className="text-xs text-muted-foreground">
            Either way, nothing is ever added to a task list, calendar or shared record without your approval.
          </p>
        </div>
        <div className="space-y-2">
          <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer">
            <input
              type="radio"
              name="automation"
              className="mt-1"
              checked={form.automation_level === "manual"}
              onChange={() => set("automation_level", "manual")}
            />
            <span>
              <span className="block text-sm font-medium text-foreground">Manual assistance</span>
              <span className="block text-xs text-muted-foreground">
                The assistant only reads a conversation when you ask it to.
              </span>
            </span>
          </label>
          <label className={`flex items-start gap-3 rounded-lg border border-border p-3 ${policyAllowsProactive ? "cursor-pointer" : "opacity-60"}`}>
            <input
              type="radio"
              name="automation"
              className="mt-1"
              disabled={!policyAllowsProactive}
              checked={form.automation_level === "proactive"}
              onChange={() => policyAllowsProactive && set("automation_level", "proactive")}
            />
            <span>
              <span className="block text-sm font-medium text-foreground">Proactive assistance</span>
              <span className="block text-xs text-muted-foreground">
                Suggestions are prepared for you as correspondence arrives, for your review.
                {!policyAllowsProactive && " Not permitted by your organization's policy."}
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-medium text-foreground">Features</p>
        <div className="divide-y divide-border">
          {FEATURES.map((f) => {
            const blocked = policy?.features_allowed?.[f.key] === false || policy?.is_enabled === false;
            return (
              <div key={f.key} className="flex items-start justify-between gap-4 py-2.5">
                <div>
                  <p className="text-sm text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {blocked ? "Turned off by your organization's policy." : f.hint}
                  </p>
                </div>
                <Switch
                  checked={!blocked && form.features?.[f.key] !== false}
                  disabled={blocked}
                  onCheckedChange={(v) => setFeature(f.key, v)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-sm font-medium text-foreground">Tasks, drafts and reminders</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Where approved tasks go</Label>
            <Select value={form.preferred_task_manager} onValueChange={(v) => set("preferred_task_manager", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="organizer">My Candora task list</SelectItem>
                <SelectItem value="ms_todo" disabled>Microsoft To Do — not connected</SelectItem>
                <SelectItem value="ms_planner" disabled>Microsoft Planner — not connected</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Link2Off className="w-3 h-3" /> The Microsoft options need the Outlook/M365 connection.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Default drafting tone</Label>
            <Select value={form.drafting_tone} onValueChange={(v) => set("drafting_tone", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority when the email is unclear</Label>
            <Select value={form.default_priority} onValueChange={(v) => set("default_priority", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Daily briefing</Label>
            <Select value={form.briefing_mode} onValueChange={(v) => set("briefing_mode", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="on_open">Prepare when I open the assistant</SelectItem>
                <SelectItem value="on_request">Only when I ask</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reminder-days">Follow-up reminder after</Label>
            <Input
              id="reminder-days"
              type="number"
              min={1}
              value={form.follow_up_reminder_days}
              onChange={(e) => set("follow_up_reminder_days", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Days before an unanswered thread is suggested as a follow-up.</p>
          </div>
          <div className="flex items-start justify-between gap-3 sm:col-span-2 rounded-lg border border-border p-3">
            <div>
              <p className="text-sm text-foreground">Count new suggestions as unread</p>
              <p className="text-xs text-muted-foreground">Shows a badge on the assistant when something is waiting.</p>
            </div>
            <Switch
              checked={form.notify_new_suggestions !== false}
              onCheckedChange={(v) => set("notify_new_suggestions", v)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exclusions">Leave out of analysis</Label>
          <Textarea
            id="exclusions"
            rows={3}
            value={form.exclusion_terms || ""}
            onChange={(e) => set("exclusion_terms", e.target.value)}
            placeholder="One sender address or subject word per line"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={savePrefs.isPending}>
            <Save className="w-4 h-4" /> {savePrefs.isPending ? "Saving…" : "Save preferences"}
          </Button>
          {saved && <span className="text-xs text-success">Saved</span>}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-2">
        <p className="text-sm font-medium text-foreground inline-flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-success" /> Your correspondence stays yours
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Only you can see the email and suggestions in this assistant. Supervisors and administrators cannot read
          them, and the assistant cannot place anything in a shared record without you approving it. Analysis runs on
          the server; the assistant stores what it found rather than a full copy of your mailbox.
        </p>
        <p className="text-xs text-muted-foreground">
          Your organization keeps analyzed correspondence for {policy?.retention_days || 90} days.
          {policy?.monthly_analysis_limit
            ? ` Each person may run ${policy.monthly_analysis_limit} analyses a month.`
            : " There is no monthly analysis limit."}
        </p>
        {messageCount > 0 && (
          <Button variant="outline" size="sm" onClick={onClearSamples} disabled={clearing}>
            {clearing ? "Clearing…" : "Clear sample correspondence and suggestions"}
          </Button>
        )}
      </div>
    </div>
  );
}