import { useState } from "react";
import { Sparkles, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KIND_META, isSnoozed } from "@/lib/emailAssistant";
import InsightCard from "@/components/emailassistant/InsightCard";

const FILTERS = [
  { key: "all", label: "Everything" },
  { key: "task", label: "Tasks" },
  { key: "follow_up", label: "Follow-ups" },
  { key: "calendar", label: "Calendar" },
  { key: "knowledge", label: "Worth keeping" },
  { key: "decision", label: "Decisions" },
  { key: "question", label: "Questions" },
  { key: "commitment", label: "Commitments" },
];

export default function SuggestedActionsTab({ insights, messages, user, prefs, onChanged, onGoAnalyze }) {
  const [filter, setFilter] = useState("all");

  const pending = insights.filter(
    (i) => i.status === "suggested" && (!isSnoozed(i))
  );
  const rows = pending.filter((i) => filter === "all" || i.kind === filter);
  const counts = pending.reduce((acc, i) => ({ ...acc, [i.kind]: (acc[i.kind] || 0) + 1 }), {});

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Suggested actions</h2>
        <p className="text-sm text-muted-foreground">
          What the assistant noticed in your correspondence. Nothing happens until you approve it.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f.key === "all" ? pending.length : counts[f.key] || 0;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs rounded-full border px-3 py-1.5 transition-colors ${
                filter === f.key
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label} {count > 0 ? `(${count})` : ""}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Inbox className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">
            {pending.length === 0 ? "Nothing waiting for you" : "Nothing in this category"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {pending.length === 0
              ? "Analyze a conversation and the assistant's findings will appear here for you to review."
              : "Try another category, or analyze another conversation."}
          </p>
          {pending.length === 0 && onGoAnalyze && (
            <Button size="sm" className="mt-4" onClick={onGoAnalyze}>
              <Sparkles className="w-3.5 h-3.5" /> Analyze a conversation
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              messages={messages}
              user={user}
              prefs={prefs}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}