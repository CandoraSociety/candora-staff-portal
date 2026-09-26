import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Send, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { interpretCashFlowMessage, describeOperations } from "@/lib/cashFlow/assistant";
import { computeProjection, fmtMoney } from "@/lib/cashFlow/engine";

const TEXT_DIM = { color: "hsl(230,30%,60%)" };
const TEXT_MAIN = { color: "hsl(45,50%,92%)" };

const applyOps = (rec, { meta_changes, operations }) => {
  let assumptions = [...(rec.assumptions || [])];
  (operations || []).forEach((op) => {
    if (op.op === "add") {
      assumptions.push({ active: true, source: "ai", confidence: "estimate", ...op.assumption, id: `a${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}` });
    } else if (op.op === "update") {
      const i = assumptions.findIndex((a) => a.id === op.id);
      if (i >= 0) assumptions[i] = { ...assumptions[i], ...op.assumption };
    } else if (op.op === "remove") {
      assumptions = assumptions.filter((a) => a.id !== op.id);
    }
  });
  return {
    ...rec,
    assumptions,
    opening_balance: meta_changes?.opening_balance ?? rec.opening_balance,
    opening_date: meta_changes?.opening_date ?? rec.opening_date,
    end_date: meta_changes?.end_date ?? rec.end_date,
  };
};

// Executive Assistant cash-flow panel. Reads the Finance Portal's official
// Current Projection (the authoritative source), answers questions from the
// deterministic engine's numbers, and builds what-if scenarios in a local
// working copy — the Current Projection is never modified from here.
export default function EACashFlowPanel({ projection }) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);
  const [working, setWorking] = useState(null); // local scenario copy
  const [workingOps, setWorkingOps] = useState([]);

  if (!projection) {
    return <p className="text-xs px-4 py-3" style={TEXT_DIM}>No Current Cash Flow Projection yet — it can be created in the Finance Portal.</p>;
  }

  const base = working || projection;
  const proj = computeProjection(base);
  const official = computeProjection(projection);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setLog((l) => [...l, { role: "user", text: msg }]);
    setBusy(true);
    try {
      const history = log.slice(-4).map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n");
      const res = await interpretCashFlowMessage({ message: msg, projection: base, history });
      if (res.kind === "question") {
        setLog((l) => [...l, { role: "assistant", text: res.answer || "I don't have that in the projection." }]);
      } else if (res.kind === "clarify") {
        setLog((l) => [...l, { role: "assistant", text: res.clarification }]);
      } else {
        const after = applyOps(base, res);
        setWorking(after);
        setWorkingOps((prev) => [...prev, ...describeOperations(res.operations, base.assumptions)]);
        const a = computeProjection(after);
        let delta = "";
        if (official && a) {
          delta = `\n\nProjected ending cash: ${fmtMoney(official.totals.end)} → ${fmtMoney(a.totals.end)} (${a.totals.end - official.totals.end === 0 ? "no change" : (a.totals.end - official.totals.end > 0 ? "+" : "") + fmtMoney(a.totals.end - official.totals.end)})\nLowest point: ${a.low ? `${fmtMoney(a.low.balance)} on ${a.low.dateStr}` : "—"}`;
        }
        setLog((l) => [...l, { role: "assistant", text: `${res.interpretation || "Working scenario updated."}\n\nThis is a working scenario — the Current Projection is untouched.${delta}` }]);
      }
    } catch (err) {
      toast.error("Cash flow assistant failed", { description: err?.message });
    } finally { setBusy(false); }
  };

  const saveAsScenario = async () => {
    const name = prompt("Save this working scenario as:", "What-if scenario");
    if (!name?.trim()) return;
    try {
      await base44.entities.CashFlowProjection.create({
        name: name.trim(),
        kind: "scenario",
        parent_id: projection.id,
        opening_balance: working.opening_balance,
        opening_date: working.opening_date,
        end_date: working.end_date,
        assumptions: working.assumptions,
        notes: "Created from the Executive Assistant",
        created_by_name: user?.full_name,
        updated_by_name: user?.full_name,
      });
      toast.success("Saved as a scenario in the Finance Portal");
      setWorking(null);
      setWorkingOps([]);
      setLog([]);
    } catch (err) {
      toast.error("Could not save the scenario", { description: err?.message });
    }
  };

  const stat = (label, value, Icon) => (
    <div className="rounded-lg px-2.5 py-2" style={{ background: "hsl(230,55%,14%)", border: "1px solid hsl(230,45%,22%)" }}>
      <p className="text-[9px] uppercase tracking-wide flex items-center gap-1" style={TEXT_DIM}><Icon size={10} /> {label}</p>
      <p className="text-xs font-semibold mt-0.5 tabular-nums" style={TEXT_MAIN}>{value}</p>
    </div>
  );

  return (
    <div className="px-3 py-3 space-y-3" style={{ background: "hsl(230,65%,10%)" }}>
      {proj ? (
        <div className="grid grid-cols-2 gap-1.5">
          {stat("Ending Cash", fmtMoney(proj.totals.end), Wallet)}
          {stat("Lowest Point", proj.low ? `${fmtMoney(proj.low.balance)}` : "—", TrendingDown)}
          {stat("Through", base.end_date, TrendingUp)}
          {stat("Inflows / Outflows", `${fmtMoney(proj.totals.inflows)} / ${fmtMoney(proj.totals.outflows)}`, Wallet)}
        </div>
      ) : (
        <p className="text-xs" style={TEXT_DIM}>The projection needs an opening balance and dates — set them in the Finance Portal.</p>
      )}
      <Link to="/finance/cash-flow" className="block text-center text-xs py-1.5 rounded-lg" style={{ background: "hsl(45,92%,53%)", color: "hsl(230,70%,10%)", fontWeight: 600 }}>
        Open detailed projection →
      </Link>

      {working && (
        <div className="rounded-lg px-2.5 py-2" style={{ background: "hsl(45,92%,53%,0.12)", border: "1px solid hsl(45,92%,53%,0.4)" }}>
          <p className="text-[10px] font-semibold" style={{ color: "hsl(45,70%,75%)" }}>Working scenario ({workingOps.length} change{workingOps.length === 1 ? "" : "s"} vs Current Projection)</p>
          <ul className="text-[10px] mt-1 space-y-0.5 pl-3 list-disc" style={{ color: "hsl(45,60%,85%)" }}>
            {workingOps.slice(-5).map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        </div>
      )}

      {log.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto px-0.5">
          {log.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <p className={`text-[11px] leading-relaxed rounded-xl px-2.5 py-1.5 max-w-[88%] whitespace-pre-wrap ${m.role === "user" ? "" : ""}`} style={m.role === "user"
                ? { background: "hsl(45,92%,53%)", color: "hsl(230,70%,10%)" }
                : { background: "hsl(230,55%,16%)", ...TEXT_MAIN }}>
                {m.text}
              </p>
            </div>
          ))}
        </div>
      )}
      {busy && <p className="text-[11px]" style={TEXT_DIM}>Thinking…</p>}

      {working && (
        <div className="flex gap-1.5">
          <button onClick={saveAsScenario} className="flex-1 text-[11px] font-semibold py-1.5 rounded-lg" style={{ background: "hsl(45,92%,53%)", color: "hsl(230,70%,10%)" }}>Save as Scenario</button>
          <button onClick={() => { setWorking(null); setWorkingOps([]); setLog([{ role: "assistant", text: "Working scenario discarded — back to the Current Projection." }]); }} className="flex-1 text-[11px] py-1.5 rounded-lg" style={{ background: "hsl(230,55%,16%)", color: "hsl(230,30%,60%)" }}>Discard</button>
        </div>
      )}

      <div className="flex gap-1.5 items-end rounded-lg px-2 py-1.5" style={{ background: "hsl(230,55%,14%)", border: "1px solid hsl(230,45%,22%)" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder='Ask about cash flow, or try "What if revenue falls to $60,000?"'
          rows={1}
          className="flex-1 resize-none bg-transparent outline-none text-[11px]" style={{ ...TEXT_MAIN, maxHeight: 70 }}
          disabled={busy}
        />
        <button onClick={() => send()} disabled={!input.trim() || busy} className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "hsl(45,92%,53%)" }}>
          <Send size={11} style={{ color: "hsl(230,70%,10%)" }} />
        </button>
      </div>
    </div>
  );
}