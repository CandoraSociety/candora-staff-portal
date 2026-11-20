import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Sun, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { activeInsights, formatWhen, logAction } from "@/lib/emailAssistant";

// A short, prioritised briefing built from the employee's own open suggestions
// and personal tasks — nothing from anyone else's email.
export default function BriefingTab({ user, prefs, insights }) {
  const [briefing, setBriefing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState(null);

  const { data: organizer } = useQuery({
    queryKey: ["organizer", user?.email],
    queryFn: () =>
      base44.entities.PersonalOrganizer
        .filter({ user_email: user.email }, { limit: 1 })
        .then((page) => page.items?.[0] || null),
    enabled: !!user?.email,
  });

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const open = activeInsights(insights)
        .filter((i) => ["suggested", "approved"].includes(i.status))
        .slice(0, 25)
        .map((i) => ({
          kind: i.kind,
          title: i.title,
          due_date: i.due_date || "",
          status: i.status,
          from: i.source_subject || "",
        }));
      const tasks = (organizer?.tasks || [])
        .filter((t) => !t.done)
        .slice(0, 15)
        .map((t) => ({ text: t.text, priority: t.priority_level || "", notes: t.notes || "" }));

      const res = await base44.functions.invoke("emailAssistantAnalyze", {
        action: "briefing",
        digest: { date: new Date().toISOString().slice(0, 10), suggestions: open, personal_tasks: tasks },
      });
      if (res.data?.error) throw new Error(res.data.error);
      setBriefing(res.data.briefing);
      setGeneratedAt(new Date().toISOString());
      await logAction(user, "briefing", "Daily briefing prepared from the employee's own suggestions and tasks");
    } catch (e) {
      setError(e.message || "The briefing could not be prepared just now.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (prefs?.briefing_mode === "on_open" && !briefing && !busy && insights !== undefined) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs?.briefing_mode]);

  if (prefs?.briefing_mode === "off") {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm font-medium text-foreground">The daily briefing is switched off</p>
        <p className="text-xs text-muted-foreground mt-1">
          You can turn it back on in Settings and preferences.
        </p>
      </div>
    );
  }

  const List = ({ items, render }) =>
    items?.length ? (
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-foreground leading-relaxed">
            {render(item)}
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Daily briefing</h2>
          <p className="text-sm text-muted-foreground">
            What deserves your attention today, based on your own email suggestions and tasks.
          </p>
        </div>
        <Button variant="outline" onClick={generate} disabled={busy}>
          <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /> {busy ? "Preparing…" : "Refresh"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!briefing && !busy && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Sun className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No briefing yet today</p>
          <p className="text-xs text-muted-foreground mt-1">Press Refresh and the assistant will prepare one.</p>
        </div>
      )}

      {briefing && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          <div>
            <p className="font-display text-xl font-bold text-foreground leading-snug">{briefing.headline}</p>
            {generatedAt && <p className="text-xs text-muted-foreground mt-1">Prepared {formatWhen(generatedAt)}</p>}
          </div>

          {briefing.priorities?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Today's priorities</p>
              <List
                items={briefing.priorities}
                render={(p) => (
                  <span>
                    <span className="font-medium">{p.text}</span>
                    {p.why ? <span className="text-muted-foreground"> — {p.why}</span> : null}
                  </span>
                )}
              />
            </div>
          )}

          {briefing.upcoming?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Coming up</p>
              <List
                items={briefing.upcoming}
                render={(u) => (
                  <span>
                    <span className="font-medium">{u.what}</span>
                    {u.when ? <span className="text-muted-foreground"> — {u.when}</span> : null}
                  </span>
                )}
              />
            </div>
          )}

          {briefing.overlooked?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Easy to overlook</p>
              <List
                items={briefing.overlooked}
                render={(o) => (
                  <span>
                    <span className="font-medium">{o.text}</span>
                    {o.why ? <span className="text-muted-foreground"> — {o.why}</span> : null}
                  </span>
                )}
              />
            </div>
          )}

          {briefing.quiet_note && (
            <p className="text-sm text-muted-foreground border-t border-border pt-3">{briefing.quiet_note}</p>
          )}

          <p className="text-xs text-muted-foreground inline-flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Written from your own suggestions and task list. Check the original email before acting on anything
            important.
          </p>
        </div>
      )}
    </div>
  );
}