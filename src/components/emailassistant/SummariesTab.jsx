import { useMemo, useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatWhen } from "@/lib/emailAssistant";
import SourceMessagesDialog from "@/components/emailassistant/SourceMessagesDialog";

// Conversation summaries the employee asked for, each still tied to the
// messages it was drawn from.
export default function SummariesTab({ insights, messages, summarizing, onSummarize }) {
  const [thread, setThread] = useState("recent");
  const [sourceFor, setSourceFor] = useState(null);

  const conversations = useMemo(() => {
    const map = new Map();
    messages.forEach((m) => {
      const key = m.thread_id || m.id;
      if (!map.has(key)) {
        map.set(key, { id: key, subject: m.thread_subject || m.subject || "Conversation", count: 0, last: m.received_at });
      }
      const row = map.get(key);
      row.count += 1;
      if (String(m.received_at || "") > String(row.last || "")) row.last = m.received_at;
    });
    return Array.from(map.values()).sort((a, b) => String(b.last).localeCompare(String(a.last)));
  }, [messages]);

  const summaries = insights
    .filter((i) => i.kind === "summary" && i.status !== "dismissed")
    .sort((a, b) => String(b.created_date).localeCompare(String(a.created_date)));

  const summarize = () => {
    const ids = thread === "recent" ? [] : messages.filter((m) => (m.thread_id || m.id) === thread).map((m) => m.id);
    onSummarize(ids);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Email summaries</h2>
        <p className="text-sm text-muted-foreground">
          A readable brief of a conversation, keeping what is confirmed apart from what the assistant merely read into it.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">Summarize a conversation</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={thread} onValueChange={setThread}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">My recent correspondence</SelectItem>
              {conversations.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.subject} ({c.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={summarize} disabled={summarizing || messages.length === 0}>
            <Sparkles className="w-4 h-4" /> {summarizing ? "Reading…" : "Summarize"}
          </Button>
        </div>
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground">There is no correspondence to summarize yet.</p>
        )}
      </div>

      {summaries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No summaries yet</p>
          <p className="text-xs text-muted-foreground mt-1">Choose a conversation above and the summary will be kept here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {summaries.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-sm text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground">{formatWhen(s.created_date)}</p>
              </div>
              {s.is_demo && (
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-warning/15 text-warning">
                  Sample correspondence
                </span>
              )}
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{s.detail}</p>
              <Button size="sm" variant="ghost" onClick={() => setSourceFor(s)}>
                Open the original emails
              </Button>
            </div>
          ))}
        </div>
      )}

      <SourceMessagesDialog
        insight={sourceFor}
        messages={messages}
        open={!!sourceFor}
        onOpenChange={(v) => !v && setSourceFor(null)}
      />
    </div>
  );
}