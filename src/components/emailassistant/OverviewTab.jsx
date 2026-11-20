import { useMemo, useState } from "react";
import {
  Sparkles, Inbox, ListChecks, Clock, FileText, MessageSquare, PenLine, Sun,
  PlugZap, ArrowRight, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KIND_META, formatWhen, isOverdue, isSnoozed } from "@/lib/emailAssistant";

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[11px] uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <p className="font-display text-2xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

export default function OverviewTab({
  messages, insights, prefs, onAnalyze, analyzing, analysisError, onNavigate, onDraft, onSeed, seeding,
}) {
  const [thread, setThread] = useState("recent");

  const conversations = useMemo(() => {
    const map = new Map();
    messages.forEach((m) => {
      const key = m.thread_id || m.id;
      if (!map.has(key)) map.set(key, { id: key, subject: m.thread_subject || m.subject || "Conversation" });
    });
    return Array.from(map.values());
  }, [messages]);

  const pending = insights.filter((i) => i.status === "suggested" && !isSnoozed(i));
  const tasks = insights.filter((i) => i.kind === "task" && i.status === "approved");
  const followUps = insights.filter(
    (i) => ["follow_up", "commitment"].includes(i.kind) && ["approved", "suggested"].includes(i.status)
  );
  const summaries = insights.filter((i) => i.kind === "summary");

  const analyze = () => {
    const ids = thread === "recent" ? [] : messages.filter((m) => (m.thread_id || m.id) === thread).map((m) => m.id);
    onAnalyze(ids);
  };

  const quickActions = [
    { key: "summaries", label: "Summarize a conversation", icon: FileText },
    { key: "chat", label: "Ask a question", icon: MessageSquare },
    { key: "briefing", label: "Daily briefing", icon: Sun },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="To review" value={pending.length} icon={Inbox} />
        <Stat label="In your tasks" value={tasks.length} icon={ListChecks} />
        <Stat label="Follow-ups" value={followUps.length} icon={Clock} />
        <Stat label="Summaries" value={summaries.length} icon={FileText} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <PlugZap className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Email connection</p>
          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Not connected
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Real correspondence will arrive here once the Microsoft 365 / Outlook connection is in place. Until then the
          assistant can be tried with clearly labelled sample email — everything it finds from samples is marked
          "Sample", so it is never mistaken for real analysis.
        </p>
        {messages.length === 0 && (
          <Button size="sm" variant="outline" onClick={onSeed} disabled={seeding}>
            <Plus className="w-3.5 h-3.5" /> {seeding ? "Adding…" : "Load a sample conversation"}
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">Analyze a conversation</p>
          <p className="text-xs text-muted-foreground">
            The assistant reads the thread and suggests tasks, dates, decisions and follow-ups. You review everything.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={thread} onValueChange={setThread}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">My recent correspondence</SelectItem>
              {conversations.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={analyze} disabled={analyzing || messages.length === 0}>
            <Sparkles className="w-4 h-4" /> {analyzing ? "Reading…" : "Analyze"}
          </Button>
        </div>
        {analysisError && <p className="text-sm text-destructive">{analysisError}</p>}
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground">There is nothing to analyze yet.</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-foreground">Waiting for your review</h2>
          {pending.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => onNavigate("suggested")}>
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-6 text-center">
            Nothing waiting. Analyze a conversation and anything the assistant finds will appear here.
          </p>
        ) : (
          <div className="space-y-2">
            {pending.slice(0, 4).map((insight) => {
              const meta = KIND_META[insight.kind] || KIND_META.task;
              return (
                <button
                  key={insight.id}
                  onClick={() => onNavigate("suggested")}
                  className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3 text-left hover:bg-muted/40 transition-colors"
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${meta.tone} flex-shrink-0`}>
                    {meta.label}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-foreground truncate">{insight.title}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {insight.source_subject}
                      {insight.due_date ? ` · ${formatWhen(insight.due_date)}${isOverdue(insight.due_date) ? " (overdue)" : ""}` : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={onDraft}
          className="rounded-xl border border-border bg-card p-4 text-left hover:bg-muted/40 transition-colors"
        >
          <PenLine className="w-4 h-4 text-highlight" />
          <p className="text-sm font-medium text-foreground mt-2">Draft an email</p>
          <p className="text-xs text-muted-foreground">Replies, new messages, rewrites — always editable.</p>
        </button>
        {quickActions.map((action) => (
          <button
            key={action.key}
            onClick={() => onNavigate(action.key)}
            className="rounded-xl border border-border bg-card p-4 text-left hover:bg-muted/40 transition-colors"
          >
            <action.icon className="w-4 h-4 text-highlight" />
            <p className="text-sm font-medium text-foreground mt-2">{action.label}</p>
            <p className="text-xs text-muted-foreground">
              {action.key === "summaries" && "A readable brief, linked to the emails."}
              {action.key === "chat" && "Ask about your own correspondence."}
              {action.key === "briefing" && "What deserves attention today."}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}