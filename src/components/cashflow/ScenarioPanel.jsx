import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ArrowUpCircle, Copy, Eye, GitCompare, History, Trash2, X } from "lucide-react";
import { computeProjection, diffAssumptions, fmtMoney, chartSeries } from "@/lib/cashFlow/engine";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const btn = "flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-muted transition";
const CHART_COLORS = ["hsl(230,75%,25%)", "hsl(0,72%,51%)", "hsl(152,55%,35%)"];

const statsOf = (rec) => {
  const proj = computeProjection(rec);
  if (!proj) return null;
  return { end: proj.totals.end, low: proj.low, inflows: proj.totals.inflows, outflows: proj.totals.outflows, net: proj.totals.net };
};

const summaryDelta = (base, next) => {
  const b = statsOf(base), n = statsOf(next);
  if (!b || !n) return null;
  return {
    end: { from: b.end, to: n.end, diff: n.end - b.end },
    low: { from: b.low?.balance, to: n.low?.balance },
    lowDate: { from: b.low?.dateStr, to: n.low?.dateStr },
    inflows: { from: b.inflows, to: n.inflows },
    outflows: { from: b.outflows, to: n.outflows },
    net: { from: b.net, to: n.net },
  };
};

// Scenario management: independent copies of the Current Projection with a
// parent reference, difference display, comparison, promote (with the previous
// Current Projection preserved in version history) and archive restore.
export default function ScenarioPanel({ current, scenarios, archived, onRefresh, onView }) {
  const { user } = useAuth();
  const [diffFor, setDiffFor] = useState(null);   // scenario being diffed / promoted
  const [promoting, setPromoting] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [busy, setBusy] = useState(false);

  const parentOf = (scen) => (scen.parent_id ? [current, ...scenarios, ...archived].find((r) => r.id === scen.parent_id) : current);

  const createFromCurrent = async () => {
    if (!current) { toast.error("Create the Current Projection first."); return; }
    const name = prompt("Scenario name (e.g. Conservative Revenue, Funding Delay):");
    if (!name?.trim()) return;
    setBusy(true);
    try {
      await base44.entities.CashFlowProjection.create({
        name: name.trim(),
        kind: "scenario",
        parent_id: current.id,
        opening_balance: current.opening_balance,
        opening_date: current.opening_date,
        end_date: current.end_date,
        notes: `Scenario based on "${current.name}"`,
        assumptions: JSON.parse(JSON.stringify(current.assumptions || [])),
        change_log: [{ date: format(new Date(), "yyyy-MM-dd"), by_name: user?.full_name, summary: `Scenario created from "${current.name}"` }],
        created_by_name: user?.full_name,
        updated_by_name: user?.full_name,
      });
      toast.success(`Scenario "${name.trim()}" created from the Current Projection`);
      onRefresh();
    } catch (err) {
      toast.error("Could not create the scenario", { description: err?.message });
    } finally { setBusy(false); }
  };

  const promote = async (scen) => {
    if (!confirm(`Make "${scen.name}" the Current Cash Flow Projection? The existing Current Projection will be preserved in version history.`)) return;
    setBusy(true);
    try {
      await base44.entities.CashFlowProjection.update(current.id, {
        kind: "archived",
        name: `${current.name} (archived ${format(new Date(), "MMM d yyyy")})`,
        updated_by_name: user?.full_name,
      });
      await base44.entities.CashFlowProjection.update(scen.id, {
        kind: "current",
        updated_by_name: user?.full_name,
        change_log: [...(scen.change_log || []), { date: format(new Date(), "yyyy-MM-dd"), by_name: user?.full_name, summary: "Promoted to Current Cash Flow Projection" }],
      });
      toast.success(`"${scen.name}" is now the Current Cash Flow Projection`);
      setDiffFor(null);
      onRefresh();
    } catch (err) {
      toast.error("Could not promote the scenario", { description: err?.message });
    } finally { setBusy(false); }
  };

  const restoreArchived = async (rec) => {
    const name = prompt("Restored scenario name:", `${rec.name.replace(/ \(archived.*\)$/, "")} — restored`);
    if (!name?.trim()) return;
    setBusy(true);
    try {
      await base44.entities.CashFlowProjection.create({
        name: name.trim(),
        kind: "scenario",
        parent_id: current?.id || null,
        opening_balance: rec.opening_balance,
        opening_date: rec.opening_date,
        end_date: rec.end_date,
        notes: rec.notes,
        assumptions: JSON.parse(JSON.stringify(rec.assumptions || [])),
        created_by_name: user?.full_name,
        updated_by_name: user?.full_name,
      });
      toast.success("Restored as a new scenario");
      onRefresh();
    } catch (err) {
      toast.error("Could not restore", { description: err?.message });
    } finally { setBusy(false); }
  };

  const deleteScenario = async (scen) => {
    if (!confirm(`Delete the scenario "${scen.name}"?`)) return;
    await base44.entities.CashFlowProjection.delete(scen.id);
    setCompareIds((ids) => ids.filter((id) => id !== scen.id));
    onRefresh();
  };

  const toggleCompare = (id) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= 3 ? ids : [...ids, id]));

  const compareData = useMemo(() => {
    const picked = scenarios.filter((s) => compareIds.includes(s.id));
    if (picked.length < 2) return null;
    const seriesList = picked.map((s) => ({ name: s.name, points: chartSeries(computeProjection(s), "monthly").map((p) => ({ label: p.label, balance: p.balance })) }));
    const labels = [];
    seriesList.forEach((s) => s.points.forEach((p) => { if (!labels.includes(p.label)) labels.push(p.label); }));
    const rows = labels.map((label) => {
      const row = { label };
      seriesList.forEach((s) => { const p = s.points.find((x) => x.label === label); row[s.name] = p ? p.balance : null; });
      return row;
    });
    return { names: seriesList.map((s) => s.name), rows, picked };
  }, [compareIds, scenarios]);

  const DiffDialog = () => {
    if (!diffFor) return null;
    const parent = parentOf(diffFor);
    const diff = parent ? diffAssumptions(parent.assumptions, diffFor.assumptions) : { added: [], removed: [], changed: [] };
    const delta = parent ? summaryDelta(parent, diffFor) : null;
    return (
      <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4 overflow-auto" onClick={() => { setDiffFor(null); setPromoting(false); }}>
        <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-full overflow-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
            <div>
              <h3 className="font-semibold">{promoting ? "Promote to Current Projection" : "Differences from parent projection"}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{diffFor.name}{parent ? ` vs "${parent.name}"` : ""}</p>
            </div>
            <button onClick={() => { setDiffFor(null); setPromoting(false); }} className="p-1.5 text-muted-foreground hover:text-foreground rounded"><X size={16} /></button>
          </div>
          <div className="p-5 space-y-4">
            {promoting && (
              <div className="border border-amber-300 bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
                Promoting will <strong>replace the Current Cash Flow Projection</strong> ("{current?.name}"). The existing projection is preserved in version history.
              </div>
            )}
            {delta && (
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: "Projected ending cash", from: delta.end.from, to: delta.end.to, diff: delta.end.diff },
                  { label: "Lowest projected balance", from: delta.low.from, to: delta.low.to, extra: `on ${delta.lowDate.to}` },
                  { label: "Total inflows", from: delta.inflows.from, to: delta.inflows.to },
                  { label: "Total outflows", from: delta.outflows.from, to: delta.outflows.to },
                ].map((row) => (
                  <div key={row.label} className="border border-border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className="text-sm mt-1">{fmtMoney(row.from)} → <span className="font-semibold">{fmtMoney(row.to)}</span></p>
                    {row.diff !== undefined && <p className={`text-xs mt-0.5 ${row.diff < 0 ? "text-red-600" : "text-green-700"}`}>{row.diff === 0 ? "no change" : `${row.diff > 0 ? "+" : ""}${fmtMoney(row.diff)}`}</p>}
                    {row.extra && <p className="text-xs text-muted-foreground mt-0.5">{row.extra}</p>}
                  </div>
                ))}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Changed assumptions</p>
              <ul className="text-sm space-y-1.5">
                {diff.changed.map((c) => (
                  <li key={c.id} className="text-sm">• <strong>{c.name}</strong> — {Object.entries(c.fields).map(([f, [o, n]]) => `${f.replace(/_/g, " ")}: ${o ?? "—"} → ${n ?? "—"}`).join("; ")}</li>
                ))}
                {diff.added.map((a) => <li key={a.id} className="text-sm">• <strong>{a.name}</strong> — added ({a.category}, {fmtMoney(a.amount)})</li>)}
                {diff.removed.map((a) => <li key={a.id} className="text-sm">• <strong>{a.name}</strong> — removed</li>)}
                {!diff.changed.length && !diff.added.length && !diff.removed.length && <li className="text-sm text-muted-foreground">No assumption differences from the parent projection.</li>}
              </ul>
            </div>
            <div className="flex gap-3">
              {promoting ? (
                <>
                  <button onClick={() => { setDiffFor(null); setPromoting(false); }} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Cancel</button>
                  <button onClick={() => promote(diffFor)} disabled={busy} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60">{busy ? "Promoting..." : "Promote to Current"}</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setDiffFor(null); setPromoting(false); }} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Close</button>
                  <button onClick={() => setPromoting(true)} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90">Promote…</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const rowStats = (rec) => {
    const s = statsOf(rec);
    return s ? (
      <span className="text-xs text-muted-foreground">
        ends {fmtMoney(s.end)} · low {s.low ? fmtMoney(s.low.balance) : "—"}{s.low ? ` (${s.low.dateStr})` : ""}
      </span>
    ) : <span className="text-xs text-amber-600">needs opening balance/dates</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading text-lg font-semibold">Scenarios</h2>
        <button onClick={createFromCurrent} disabled={busy || !current} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
          <Copy size={15} /> Create Scenario from Current Projection
        </button>
      </div>
      <p className="text-xs text-muted-foreground -mt-3">Changes to a scenario never alter the Current Projection. Select two or three scenarios to compare them.</p>

      <div className="space-y-2">
        {scenarios.map((scen) => (
          <div key={scen.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-medium flex items-center gap-2 flex-wrap">
                  {scen.name}
                  <input type="checkbox" checked={compareIds.includes(scen.id)} onChange={() => toggleCompare(scen.id)} className="w-3.5 h-3.5" title="Select to compare" />
                </p>
                <div className="mt-1">{rowStats(scen)}</div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => onView(scen.id)} className={btn}><Eye size={14} /> View</button>
                <button onClick={() => setDiffFor(scen)} className={btn}><GitCompare size={14} /> vs Parent</button>
                <button onClick={() => { setDiffFor(scen); setPromoting(true); }} className={btn} title="Make this the Current Projection"><ArrowUpCircle size={14} /> Promote</button>
                <button onClick={() => deleteScenario(scen)} className="p-1.5 text-muted-foreground hover:text-destructive rounded"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {scenarios.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No scenarios yet — create one from the Current Projection to explore alternatives.</p>}
      </div>

      {compareData && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Scenario Comparison</h3>
            <button onClick={() => setCompareIds([])} className="text-xs text-muted-foreground hover:text-foreground underline">clear</button>
          </div>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse min-w-[480px]">
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2 px-2">Scenario</th><th className="py-2 px-2 text-right">Ending Cash</th><th className="py-2 px-2 text-right">Lowest Balance</th><th className="py-2 px-2 text-right">Lowest On</th><th className="py-2 px-2 text-right">Total Inflows</th><th className="py-2 px-2 text-right">Total Outflows</th><th className="py-2 px-2 text-right">Net Movement</th></tr></thead>
              <tbody>
                {compareData.picked.map((s) => {
                  const st = statsOf(s);
                  return (
                    <tr key={s.id} className="border-b border-border">
                      <td className="py-2 px-2 font-medium">{s.name}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{st ? fmtMoney(st.end) : "—"}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{st?.low ? fmtMoney(st.low.balance) : "—"}</td>
                      <td className="py-2 px-2 text-right text-xs text-muted-foreground">{st?.low ? st.low.dateStr : "—"}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{st ? fmtMoney(st.inflows) : "—"}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{st ? fmtMoney(st.outflows) : "—"}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{st ? fmtMoney(st.net) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={compareData.rows} margin={{ top: 6, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={52} />
                <Tooltip formatter={(v) => fmtMoney(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {compareData.names.map((name, i) => (
                  <Line key={name} type="monotone" dataKey={name} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><History size={13} /> Version History — former Current Projections</h3>
        <div className="space-y-2">
          {archived.map((rec) => (
            <div key={rec.id} className="bg-muted/40 border border-dashed border-border rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{rec.name}</p>
                <div className="mt-0.5">{rowStats(rec)}</div>
              </div>
              <button onClick={() => restoreArchived(rec)} className={btn}><Copy size={13} /> Restore as Scenario</button>
            </div>
          ))}
          {archived.length === 0 && <p className="text-xs text-muted-foreground py-2">No archived projections yet. Promoting a scenario preserves the previous Current Projection here.</p>}
        </div>
      </div>

      <DiffDialog />
    </div>
  );
}