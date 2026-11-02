import { useEffect, useRef, useState } from "react";
import { Send, X, Loader2, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { withTimes, stripComputed } from "@/lib/training/planTimeline";

const SUGGESTIONS = [
  "Shorten the welcome block to 15 minutes",
  "Push the hard start to 10:30",
  "Add a 10-minute stretch break in the morning",
  "Move the practice block to right after lunch",
  "Finish by 4:00",
];

// Comment-style refinement for one agenda: describe the tweak, only the tweak is
// applied. Every other block keeps its title, minutes, cue and activities, and
// the change lands in the editor unsaved so it can be reviewed and saved.
export default function PlanRefineChat({ open, plan, onApply, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  if (!open) return null;

  const send = async (text) => {
    const instruction = (text ?? input).trim();
    if (!instruction || busy) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: instruction }]);
    setBusy(true);
    try {
      const timed = withTimes(plan).blocks.map(b => ({
        time: b.time,
        type: b.type,
        title: b.title,
        minutes: b.minutes,
        module_key: b.module_key || "",
        why: b.why || "",
        cue: b.cue || "",
        activities: b.activities || [],
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are editing ONE existing training-day agenda for Candora, a community services non-profit. The facilitator is giving you a small correction, not a request to redesign the day.

THE AGENDA AS IT STANDS (each block shows its calculated time):
${JSON.stringify({
          title: plan.title,
          start_time: plan.start_time,
          summary: plan.summary,
          outcomes: plan.outcomes,
          setup: plan.setup,
          blocks: timed,
          follow_up: plan.follow_up,
        }, null, 1)}

THE FACILITATOR'S INSTRUCTION: "${instruction}"

Rules, in priority order:
1. Apply ONLY what the instruction asks. Change the minimum number of blocks needed to satisfy it.
2. Every block you are not changing must come back with identical title, type, minutes, module_key, why, cue and activities. Do not rewrite, tidy, re-order or "improve" anything that was not asked about.
3. Keep the same instruction's ripple effects honest — if a block gets shorter or longer, the later blocks simply start earlier or later; do not invent filler to fill a gap unless asked.
4. Never invent a module that is not in the agenda already, unless the instruction names a new topic.
5. Return the COMPLETE blocks array, in order, using only: type ("session" | "admin" | "break"), title, minutes (whole number), module_key ("" when the block teaches no module), why, cue, activities (array of strings).
6. In "reply", say in one short sentence what you changed (and the new end time if it moved). No preamble, no bullet lists.

If the instruction asks for something that would need new content from scratch, still make the smallest sensible edit and say what you did in "reply".`,
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string" },
            blocks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["session", "admin", "break"] },
                  title: { type: "string" },
                  minutes: { type: "number" },
                  module_key: { type: "string" },
                  why: { type: "string" },
                  cue: { type: "string" },
                  activities: { type: "array", items: { type: "string" } },
                },
                required: ["type", "title", "minutes"],
              },
            },
            summary: { type: "string" },
            outcomes: { type: "array", items: { type: "string" } },
            setup: { type: "array", items: { type: "string" } },
            start_time: { type: "string" },
          },
          required: ["reply", "blocks"],
        },
      });

      const patch = { blocks: stripComputed(result.blocks || []) };
      if (result.start_time && /^\d{2}:\d{2}$/.test(result.start_time)) patch.start_time = result.start_time;
      if (result.summary && result.summary.trim() && instruction.match(/summary|summarise|summarize|describe/i)) {
        patch.summary = result.summary;
      }
      onApply(patch);
      setMessages(m => [...m, { role: "assistant", text: result.reply || "Updated." }]);
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", text: "That change didn't come back cleanly. Try saying it more specifically — for example which block and how many minutes." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-[85] w-full sm:w-[380px] max-h-[80vh] sm:max-h-[70vh] flex flex-col bg-card border sm:rounded-2xl shadow-2xl print:hidden">
      <div className="flex items-start justify-between gap-2 px-4 py-3 border-b" style={{ background: "hsl(45, 92%, 53%, 0.14)" }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: "hsl(38, 80%, 38%)" }}>
            <MessageSquare className="w-3.5 h-3.5" /> Refine
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Ask for a tweak — only that changes.</p>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground px-1">
              Comment on the agenda the way you would on paper. Everything you don't mention stays exactly as it is.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-2 py-1 rounded-full border hover:bg-accent text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <p
              className={`text-sm rounded-2xl px-3 py-2 max-w-[85%] ${
                m.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-muted text-foreground"
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}

        {busy && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Working on that…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t p-2.5 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Make the practice block 20 minutes longer…"
          className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm max-h-24 focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
        <button
          onClick={() => send()}
          disabled={busy || !input.trim()}
          className="p-2 rounded-xl disabled:opacity-40"
          style={{ background: "hsl(45, 92%, 53%)", color: "hsl(230, 70%, 10%)" }}
          title="Apply this change"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}