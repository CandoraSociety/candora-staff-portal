import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, TrendingDown, TrendingUp, Wallet, CalendarRange, Info } from "lucide-react";
import { computeProjection, fmtMoney } from "@/lib/cashFlow/engine";
import CashFlowAssistant from "@/components/cashflow/CashFlowAssistant";
import AssumptionsPanel from "@/components/cashflow/AssumptionsPanel";
import MonthlyTable from "@/components/cashflow/MonthlyTable";
import CashFlowChart from "@/components/cashflow/CashFlowChart";
import ScenarioPanel from "@/components/cashflow/ScenarioPanel";

const DRAFT = { name: "Current Cash Flow Projection", kind: "current", opening_balance: null, opening_date: null, end_date: null, assumptions: [] };

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "assumptions", label: "Assumptions" },
  { key: "scenarios", label: "Scenarios" },
];

export default function FinanceCashFlow() {
  const { user } = useAuth();
  const [records, setRecords] = useState(null);
  const [tab, setTab] = useState("overview");
  const [viewId, setViewId] = useState(null);
  const [creatingManually, setCreatingManually] = useState(false);

  const load = () => base44.entities.CashFlowProjection.list("-updated_date").then(setRecords);
  useEffect(() => { load(); }, []);

  if (records === null) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-[3px] border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  const current = records.find((r) => r.kind === "current") || null;
  const scenarios = records.filter((r) => r.kind === "scenario");
  const archived = records.filter((r) => r.kind === "archived");
  const viewed = viewId ? records.find((r) => r.id === viewId) : null;
  const activeRecord = viewed || current;
  const computed = activeRecord ? computeProjection(activeRecord) : null;

  const applyChanges = async ({ meta_changes, operations, interpretation }) => {
    const rec = activeRecord || DRAFT;
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
    const merged = {
      opening_balance: meta_changes?.opening_balance ?? rec.opening_balance ?? null,
      opening_date: meta_changes?.opening_date ?? rec.opening_date ?? null,
      end_date: meta_changes?.end_date ?? rec.end_date ?? null,
    };
    const logEntry = { date: format(new Date(), "yyyy-MM-dd"), by_name: user?.full_name, summary: interpretation || "Updated via Cash Flow Assistant" };

    if (!rec.id) {
      if (merged.opening_balance == null || !merged.opening_date || !merged.end_date) {
        throw new Error("Still needed: the opening balance, opening date and projection end date. e.g. \"We have $390,000 as of October 1. Project through March 31.\"");
      }
      const created = await base44.entities.CashFlowProjection.create({
        name: "Current Cash Flow Projection",
        kind: "current",
        opening_balance: Number(merged.opening_balance),
        opening_date: merged.opening_date,
        end_date: merged.end_date,
        assumptions,
        change_log: [logEntry],
        created_by_name: user?.full_name,
        updated_by_name: user?.full_name,
      });
      await load();
      setViewId(null);
      setTab("overview");
      toast.success("Current Cash Flow Projection created");
      return created;
    }
    const updated = await base44.entities.CashFlowProjection.update(rec.id, {
      ...(meta_changes?.name ? { name: meta_changes.name } : {}),
      opening_balance: merged.opening_balance,
      opening_date: merged.opening_date,
      end_date: merged.end_date,
      assumptions,
      change_log: [...(rec.change_log || []), logEntry],
      updated_by_name: user?.full_name,
    });
    await load();
    return updated;
  };

  // ── First-run: build the Current Projection with the assistant (or manually) ──
  if (!current && !viewed) {
    return (
      <div className="max-w-3xl mx-auto py-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Cash Flow Projection</h1>
          <p className="text-sm text-muted-foreground mt-1">
            There's no Current Cash Flow Projection yet. Describe your cash situation below in plain language — the assistant converts it into
            structured assumptions, and the projection itself is calculated by the application. Or set it up manually.
          </p>
        </div>
        <CashFlowAssistant
          projection={DRAFT}
          onApply={applyChanges}
          introNote={"Let's build your cash-flow projection. Tell me things like:\n\n\"We should have about $390,000 in the bank at the end of October. Payroll is $39,000 biweekly. Rent is approximately $17,000 on the first of each month. We usually bring in about $80,000 per month. Project this through the end of March.\""}
        />
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-muted-foreground">Prefer typing the numbers yourself?</p>
          <button
            onClick={async () => {
              setCreatingManually(true);
              try {
                await base44.entities.CashFlowProjection.create({ name: "Current Cash Flow Projection", kind: "current", assumptions: [], created_by_name: user?.full_name, updated_by_name: user?.full_name });
                await load();
                setTab("assumptions");
              } catch (err) { toast.error("Could not create the projection", { description: err?.message }); }
              finally { setCreatingManually(false); }
            }}
            disabled={creatingManually}
            className="border border-border rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            {creatingManually ? "Creating…" : "Set Up Manually"}
          </button>
        </div>
      </div>
    );
  }

  const isScenarioView = !!viewed;
  const summaryCards = computed ? [
    { label: "Opening Cash", value: fmtMoney(computed.totals.opening), sub: `on ${activeRecord.opening_date}`, icon: Wallet },
    { label: "Projection Period", value: `${format(new Date(activeRecord.opening_date), "MMM d, yy")} → ${format(new Date(activeRecord.end_date), "MMM d, yy")}`, sub: `${computed.days.length} days`, icon: CalendarRange },
    { label: "Projected Ending Cash", value: fmtMoney(computed.totals.end), sub: `on ${activeRecord.end_date}`, icon: TrendingUp },
    { label: "Lowest Projected Balance", value: computed.low ? fmtMoney(computed.low.balance) : "—", sub: computed.low ? format(computed.low.date, "MMMM d, yyyy") : "", icon: TrendingDown },
    { label: "Total Projected Inflows", value: fmtMoney(computed.totals.inflows), sub: "", icon: TrendingUp },
    { label: "Total Projected Outflows", value: fmtMoney(computed.totals.outflows), sub: "", icon: TrendingDown },
  ] : [];

  const recentChanges = [...(activeRecord.change_log || [])].slice(-4).reverse();

  return (
    <div className="space-y-6">
      {isScenarioView && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-amber-800 flex items-center gap-2"><Info size={15} /> Viewing scenario <strong>{viewed.name}</strong> — changes here never alter the Current Projection.</p>
          <button onClick={() => { setViewId(null); setTab("overview"); }} className="flex items-center gap-1.5 text-sm text-amber-800 font-medium hover:underline"><ArrowLeft size={14} /> Back to Current Projection</button>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-semibold flex items-center gap-2 flex-wrap">
            Cash Flow Projection
            {isScenarioView && <span className="text-sm font-normal text-muted-foreground">— scenario</span>}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {current ? <>Official projection: <strong>{current.name}</strong></> : "No current projection"} · {scenarios.length} scenario{scenarios.length === 1 ? "" : "s"} · last updated {format(new Date(activeRecord.updated_date), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          {!computed && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-800">
              The projection isn't calculable yet — set the opening balance, opening date and end date under <button onClick={() => setTab("assumptions")} className="underline font-medium">Assumptions → Projection Settings</button>, or tell the assistant.
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {summaryCards.map((card) => (
              <div key={card.label} className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><card.icon size={13} /> {card.label}</p>
                <p className="text-lg font-semibold mt-1.5 tabular-nums break-words">{card.value}</p>
                {card.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</p>}
              </div>
            ))}
          </div>

          <CashFlowChart projection={computed} />
          <MonthlyTable projection={computed} />

          <CashFlowAssistant
            projection={activeRecord}
            onApply={applyChanges}
            introNote={isScenarioView ? `This conversation changes the scenario "${activeRecord.name}" only — never the Current Projection.` : undefined}
          />

          {recentChanges.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Changes</h3>
              <ul className="text-sm space-y-1">
                {recentChanges.map((c, i) => (
                  <li key={i} className="text-sm"><span className="text-muted-foreground text-xs">{c.date} · {c.by_name || "—"}</span> — {c.summary}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === "assumptions" && activeRecord && (
        <AssumptionsPanel record={activeRecord} onChanged={load} />
      )}

      {tab === "scenarios" && (
        <ScenarioPanel
          current={current}
          scenarios={scenarios}
          archived={archived}
          onRefresh={load}
          onView={(id) => { setViewId(id); setTab("overview"); }}
        />
      )}
    </div>
  );
}