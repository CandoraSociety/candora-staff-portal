import { useState } from "react";
import { Send, MessageSquare, Info, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { formatWhen, logAction } from "@/lib/emailAssistant";
import SourceMessagesDialog from "@/components/emailassistant/SourceMessagesDialog";

const STARTERS = [
  "What emails require my attention?",
  "What commitments have I made this week?",
  "What am I waiting for other people to finish?",
  "What deadlines have been mentioned in my emails?",
  "Which emails contain outstanding requests?",
  "What decisions were made in this conversation?",
];

// Plain-language questions about the employee's own correspondence. The answer
// comes back with the messages it relied on, and admits when something is not
// visible rather than inventing it.
export default function ChatTab({ user, messages }) {
  const [history, setHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sourceIds, setSourceIds] = useState([]);

  const ask = async (text) => {
    const q = (text || question).trim();
    if (!q || busy) return;
    setError("");
    setQuestion("");
    setHistory((h) => [...h, { role: "user", text: q }]);
    setBusy(true);
    try {
      const res = await base44.functions.invoke("emailAssistantChat", { question: q });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      setHistory((h) => [
        ...h,
        { role: "assistant", text: data.answer, references: data.references || [], limitation: data.limitation },
      ]);
      await logAction(user, "chat", "Question answered from the employee's own correspondence");
    } catch (e) {
      setError(e.message || "The assistant could not answer just now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Ask about your email</h2>
        <p className="text-sm text-muted-foreground">
          Questions are answered only from your own correspondence. Nothing is shared with anyone else.
        </p>
      </div>

      {history.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="text-xs rounded-full border border-border px-3 py-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {history.map((entry, i) => (
          <div
            key={i}
            className={`rounded-xl p-4 ${entry.role === "user" ? "bg-muted ml-auto max-w-[85%]" : "border border-border bg-card"}`}
          >
            {entry.role === "assistant" && (
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-highlight" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Assistant</span>
              </div>
            )}
            <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{entry.text}</p>
            {entry.limitation && (
              <p className="text-xs text-warning mt-2 inline-flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {entry.limitation}
              </p>
            )}
            {(entry.references || []).length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">From these emails</p>
                {entry.references.map((r) => (
                  <button
                    key={r.message_id}
                    onClick={() => setSourceIds([r.message_id])}
                    className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left hover:bg-muted transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-foreground truncate">{r.subject}</span>
                    <span className="text-[11px] text-muted-foreground ml-auto flex-shrink-0">{formatWhen(r.date)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && <p className="text-sm text-muted-foreground">Reading your correspondence…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder={messages.length ? "Ask about your email…" : "No correspondence available yet"}
          disabled={!messages.length || busy}
        />
        <Button onClick={() => ask()} disabled={busy || !question.trim() || !messages.length}>
          <Send className="w-4 h-4" /> Ask
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Answers are drawn only from correspondence available to you, and the assistant says so when something is not
        there. It never sends email or opens a calendar.
      </p>

      <SourceMessagesDialog
        insight={{ source_message_ids: sourceIds }}
        messages={messages}
        open={sourceIds.length > 0}
        onOpenChange={(v) => !v && setSourceIds([])}
      />
    </div>
  );
}