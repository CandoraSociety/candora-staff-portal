import { useMemo, useState } from "react";
import { Sparkles, Copy, Check, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { TONES, logAction } from "@/lib/emailAssistant";

// Writes an editable draft. It never sends: the employee copies the text into
// whatever they use to send mail.
export default function DraftComposer({ user, messages, prefs, open, onOpenChange, initialThread }) {
  const [mode, setMode] = useState("reply");
  const [thread, setThread] = useState(initialThread || "");
  const [intent, setIntent] = useState("");
  const [draftText, setDraftText] = useState("");
  const [tone, setTone] = useState(prefs?.drafting_tone || "warm_professional");
  const [length, setLength] = useState("normal");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const conversations = useMemo(() => {
    const map = new Map();
    messages.forEach((m) => {
      const key = m.thread_id || m.id;
      if (!map.has(key)) map.set(key, { id: key, subject: m.thread_subject || m.subject || "Conversation" });
    });
    return Array.from(map.values());
  }, [messages]);

  const sourceMessage = () => {
    const rows = messages.filter((m) => (m.thread_id || m.id) === thread);
    if (!rows.length) return undefined;
    return rows.sort((a, b) => String(b.received_at).localeCompare(String(a.received_at)))[0];
  };

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const message = mode === "new" ? undefined : sourceMessage();
      const res = await base44.functions.invoke("emailAssistantDraft", {
        mode,
        message_id: message?.id,
        intent,
        draft_text: draftText,
        tone,
        length,
      });
      if (res.data?.error) throw new Error(res.data.error);
      setResult(res.data);
      await logAction(user, "draft", `Draft written (${mode})`);
    } catch (e) {
      setError(e.message || "The draft could not be written just now.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(`${result.subject ? `${result.subject}\n\n` : ""}${result.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Draft an email</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>What kind of draft</Label>
              <Select value={mode} onValueChange={(v) => { setMode(v); setResult(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reply">Reply to a conversation</SelectItem>
                  <SelectItem value="new">A new message</SelectItem>
                  <SelectItem value="follow_up">A follow-up nudge</SelectItem>
                  <SelectItem value="rewrite">Rewrite my own draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {mode !== "new" && mode !== "rewrite" && (
              <div className="space-y-1.5">
                <Label>Conversation</Label>
                <Select value={thread} onValueChange={setThread}>
                  <SelectTrigger><SelectValue placeholder="Choose a conversation" /></SelectTrigger>
                  <SelectContent>
                    {conversations.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="draft-intent">What do you want to say?</Label>
            <Textarea
              id="draft-intent"
              rows={3}
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g. Confirm the report will arrive Thursday and ask which format they need."
            />
          </div>

          {mode === "rewrite" && (
            <div className="space-y-1.5">
              <Label htmlFor="draft-text">Your draft</Label>
              <Textarea id="draft-text" rows={5} value={draftText} onChange={(e) => setDraftText(e.target.value)} />
            </div>
          )}

          <Button onClick={generate} disabled={busy}>
            <Sparkles className="w-4 h-4" /> {busy ? "Writing…" : "Write the draft"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {result && (
            <div className="space-y-2 rounded-xl border border-border p-4">
              <div className="space-y-1.5">
                <Label htmlFor="draft-subject">Subject</Label>
                <Input
                  id="draft-subject"
                  value={result.subject || ""}
                  onChange={(e) => setResult({ ...result, subject: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="draft-body">Message</Label>
                <Textarea
                  id="draft-body"
                  rows={10}
                  value={result.body || ""}
                  onChange={(e) => setResult({ ...result, body: e.target.value })}
                />
              </div>
              {result.notes && (
                <p className="text-xs text-warning inline-flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {result.notes}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={copy}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy draft"}
                </Button>
                <span className="text-xs text-muted-foreground">Nothing is sent from Candora 360.</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}