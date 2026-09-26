import { useState } from "react";
import { toast } from "sonner";
import { Check, Send, Sparkles, X } from "lucide-react";
import { interpretCashFlowMessage, describeOperations, describeMetaChanges } from "@/lib/cashFlow/assistant";

// Natural-language Cash Flow Assistant. The AI only interprets; every change
// is shown as a structured interpretation and applied ONLY after the user
// confirms. onApply({ meta_changes, operations }) performs the actual model
// update + deterministic recalculation.
export default function CashFlowAssistant({ projection, onApply, introNote }) {
  const [messages, setMessages] = useState(() => (introNote ? [{ role: "assistant", text: introNote }] : []));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null); // { interpretation, meta_changes, operations }

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setPending(null);
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setBusy(true);
    try {
      const history = messages.slice(-6).map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n");
      const res = await interpretCashFlowMessage({ message: msg, projection, history });
      if (res.kind === "clarify") {
        setMessages((m) => [...m, { role: "assistant", text: `I want to get this right: ${res.clarification || "could you clarify that?"}` }]);
      } else if (res.kind === "question") {
        setMessages((m) => [...m, { role: "assistant", text: res.answer || "I don't have that in the current projection." }]);
      } else if ((res.operations || []).length || Object.keys(res.meta_changes || {}).length) {
        setPending(res);
      } else {
        setMessages((m) => [...m, { role: "assistant", text: res.interpretation || "I didn't find any changes to make in that message." }]);
      }
    } catch (err) {
      toast.error("The assistant couldn't process that", { description: err?.message });
    } finally { setBusy(false); }
  };

  const confirm = async () => {
    const p = pending;
    setPending(null);
    try {
      await onApply({ meta_changes: p.meta_changes, operations: p.operations, interpretation: p.interpretation });
      setMessages((m) => [...m, { role: "assistant", text: `✓ Applied to the projection:\n\n${p.interpretation || "Changes saved."}` }]);
    } catch (err) {
      toast.error("Could not save the changes", { description: err?.message });
    }
  };

  const opLines = pending ? describeOperations(pending.operations, projection?.assumptions || []) : [];
  const metaLines = pending ? describeMetaChanges(pending.meta_changes) : [];

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col" style={{ minHeight: 420, maxHeight: 640 }}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary/10">
          <Sparkles size={15} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">Cash Flow Assistant</p>
          <p className="text-[11px] text-muted-foreground">Describe your situation or ask questions — nothing changes until you confirm.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
              {m.text}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex gap-1.5 justify-center py-1">
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}

        {pending && (
          <div className="border border-amber-300 bg-amber-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-amber-800">I interpreted your request as:</p>
            {pending.interpretation && <p className="text-sm text-amber-900 whitespace-pre-wrap">{pending.interpretation}</p>}
            {(opLines.length > 0 || metaLines.length > 0) && (
              <ul className="text-xs text-amber-900 space-y-1 list-disc pl-4">
                {metaLines.map((l, i) => <li key={`m${i}`}>{l}</li>)}
                {opLines.map((l, i) => <li key={`o${i}`}>{l}</li>)}
              </ul>
            )}
            <div className="flex gap-2">
              <button onClick={confirm} className="flex items-center gap-1.5 bg-amber-600 text-white rounded-lg px-3.5 py-2 text-sm font-medium hover:opacity-90"><Check size={14} /> Confirm & Recalculate</button>
              <button onClick={() => { setMessages((m) => [...m, { role: "assistant", text: "Discarded — the projection was not changed." }]); setPending(null); }} className="flex items-center gap-1.5 border border-amber-400 text-amber-800 rounded-lg px-3.5 py-2 text-sm hover:bg-amber-100"><X size={14} /> Discard</button>
            </div>
          </div>
        )}
        <div />
      </div>

      <div className="px-4 pb-4 pt-1">
        <div className="flex gap-2 items-end border border-input rounded-xl px-3 py-2 bg-background">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder='e.g. "Payroll is $39,000 biweekly. Rent is $17,000 on the 1st. Project through March."'
            rows={2}
            className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed"
            disabled={busy}
          />
          <button onClick={() => send()} disabled={!input.trim() || busy} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary text-primary-foreground disabled:opacity-40">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}