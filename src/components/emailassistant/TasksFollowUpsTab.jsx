import { useState } from "react";
import { Clock, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWhen, isSnoozed, isOverdue } from "@/lib/emailAssistant";
import { reopenInsight } from "@/lib/emailAssistantActions";
import InsightCard from "@/components/emailassistant/InsightCard";

const TRACKED = ["task", "follow_up", "commitment", "question"];

function Section({ title, hint, children }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-display text-base font-bold text-foreground">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

// The employee's own list of responsibilities and things they are waiting on.
export default function TasksFollowUpsTab({ insights, messages, user, prefs, onChanged }) {
  const [busyId, setBusyId] = useState(null);
  const tracked = insights.filter((i) => TRACKED.includes(i.kind));

  const suggested = tracked.filter((i) => i.status === "suggested" && !isSnoozed(i));
  const open = tracked.filter((i) => i.status === "approved" && i.status !== "done");
  const overdue = open.filter((i) => isOverdue(i.due_date));
  const waiting = tracked.filter((i) => i.status === "snoozed" && isSnoozed(i));
  const done = tracked.filter((i) => i.status === "done").slice(0, 8);

  const reopen = async (insight) => {
    setBusyId(insight.id);
    try {
      await reopenInsight(insight);
      await onChanged?.();
    } finally {
      setBusyId(null);
    }
  };

  const card = (insight) => (
    <InsightCard
      key={insight.id}
      insight={insight}
      messages={messages}
      user={user}
      prefs={prefs}
      onChanged={onChanged}
    />
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Tasks and follow-ups</h2>
        <p className="text-sm text-muted-foreground">
          What you have taken on, and what you are waiting for other people to come back on.
        </p>
      </div>

      {suggested.length > 0 && (
        <Section title="Waiting for your review" hint="These came from your correspondence and have not been added anywhere yet.">
          <div className="space-y-3">{suggested.map(card)}</div>
        </Section>
      )}

      {overdue.length > 0 && (
        <Section title="Past their date" hint="Dates the correspondence implied, now behind you.">
          <div className="space-y-3">{overdue.map(card)}</div>
        </Section>
      )}

      <Section title="In your list" hint="Accepted items. Tasks also appear in your personal task list on the dashboard.">
        {open.filter((i) => !isOverdue(i.due_date)).length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-6 text-center">
            Nothing active yet. Approve a suggestion and it will appear here.
          </p>
        ) : (
          <div className="space-y-3">{open.filter((i) => !isOverdue(i.due_date)).map(card)}</div>
        )}
      </Section>

      {waiting.length > 0 && (
        <Section title="Snoozed" hint="Hidden until the date you chose.">
          <div className="space-y-2">
            {waiting.map((insight) => (
              <div key={insight.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{insight.title}</p>
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> Back on {formatWhen(insight.snooze_until)}
                  </p>
                </div>
                <Button size="sm" variant="outline" disabled={busyId === insight.id} onClick={() => reopen(insight)}>
                  <RotateCcw className="w-3.5 h-3.5" /> Bring back
                </Button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {done.length > 0 && (
        <Section title="Recently completed">
          <div className="space-y-2">
            {done.map((insight) => (
              <div key={insight.id} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                <p className="text-sm text-muted-foreground truncate">{insight.title}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}