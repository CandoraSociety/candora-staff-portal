import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Settings2, Circle, CircleCheck } from "lucide-react";
import AssumptionDialog from "./AssumptionDialog";
import { fmtMoney, freqLabel } from "@/lib/cashFlow/engine";

const FIELD = "w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring";
const LABEL = "text-sm font-medium mb-1.5 block";
let uidCounter = 0;
const newId = () => `a${Date.now().toString(36)}${(++uidCounter).toString(36)}`;

// Structured assumptions manager: projection settings + full manual editing of
// every assumption. All calculations come from the engine, never from the AI.
export default function AssumptionsPanel({ record, onChanged }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    name: record.name || "",
    opening_balance: record.opening_balance ?? "",
    opening_date: record.opening_date || "",
    end_date: record.end_date || "",
    notes: record.notes || "",
  });
  const [showSettings, setShowSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [dialog, setDialog] = useState(null); // { assumption } | { preset: {type, frequency} }

  const assumptions = record.assumptions || [];

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const updated = await base44.entities.CashFlowProjection.update(record.id, {
        name: settings.name,
        opening_balance: settings.opening_balance === "" ? null : Number(settings.opening_balance),
        opening_date: settings.opening_date || null,
        end_date: settings.end_date || null,
        notes: settings.notes,
        updated_by_name: user?.full_name,
      });
      onChanged(updated);
      setShowSettings(false);
      toast.success("Projection settings saved");
    } catch (err) {
      toast.error("Could not save settings", { description: err?.message });
    } finally { setSavingSettings(false); }
  };

  const upsert = async (payload) => {
    const exists = assumptions.find((a) => a.id === payload.id);
    const next = exists
      ? assumptions.map((a) => (a.id === payload.id ? payload : a))
      : [...assumptions, { ...payload, id: newId(), source: payload.source || "manual" }];
    try {
      const updated = await base44.entities.CashFlowProjection.update(record.id, {
        assumptions: next,
        change_log: [...(record.change_log || []), { date: format(new Date(), "yyyy-MM-dd"), by_name: user?.full_name, summary: `${exists ? "Updated" : "Added"} assumption "${payload.name}"` }],
        updated_by_name: user?.full_name,
      });
      onChanged(updated);
      setDialog(null);
    } catch (err) {
      toast.error("Could not save the assumption", { description: err?.message });
    }
  };

  const toggleActive = async (a) => {
    const next = assumptions.map((x) => (x.id === a.id ? { ...x, active: x.active === false } : x));
    try {
      const updated = await base44.entities.CashFlowProjection.update(record.id, { assumptions: next, updated_by_name: user?.full_name });
      onChanged(updated);
    } catch (err) { toast.error("Could not update", { description: err?.message }); }
  };

  const remove = async (a) => {
    if (!confirm(`Remove "${a.name}"?`)) return;
    try {
      const updated = await base44.entities.CashFlowProjection.update(record.id, {
        assumptions: assumptions.filter((x) => x.id !== a.id),
        change_log: [...(record.change_log || []), { date: format(new Date(), "yyyy-MM-dd"), by_name: user?.full_name, summary: `Removed assumption "${a.name}"` }],
        updated_by_name: user?.full_name,
      });
      onChanged(updated);
    } catch (err) { toast.error("Could not remove", { description: err?.message }); }
  };

  const btn = "flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-muted transition";

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-heading text-lg font-semibold">{record.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Opening {fmtMoney(record.opening_balance)} on {record.opening_date || "—"} · through {record.end_date || "—"} · {assumptions.length} assumptions
            </p>
          </div>
          <button onClick={() => { setSettings({ name: record.name || "", opening_balance: record.opening_balance ?? "", opening_date: record.opening_date || "", end_date: record.end_date || "", notes: record.notes || "" }); setShowSettings(true); }} className={btn}>
            <Settings2 size={15} /> Projection Settings
          </button>
        </div>

        {showSettings && (
          <div className="grid sm:grid-cols-2 gap-4 border-t border-border mt-4 pt-4">
            <div><label className={LABEL}>Name</label><input className={FIELD} value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} /></div>
            <div><label className={LABEL}>Opening balance</label><input type="number" step="0.01" className={FIELD} value={settings.opening_balance} onChange={(e) => setSettings({ ...settings, opening_balance: e.target.value })} /></div>
            <div><label className={LABEL}>Opening date</label><input type="date" className={FIELD} value={settings.opening_date} onChange={(e) => setSettings({ ...settings, opening_date: e.target.value })} /></div>
            <div><label className={LABEL}>Projection end date</label><input type="date" className={FIELD} value={settings.end_date} onChange={(e) => setSettings({ ...settings, end_date: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className={LABEL}>Notes</label><textarea rows={2} className={`${FIELD} resize-none`} value={settings.notes} onChange={(e) => setSettings({ ...settings, notes: e.target.value })} /></div>
            <div className="sm:col-span-2 flex gap-3">
              <button onClick={() => setShowSettings(false)} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Cancel</button>
              <button onClick={saveSettings} disabled={savingSettings} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60">{savingSettings ? "Saving..." : "Save Settings"}</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setDialog({ preset: { type: "inflow", frequency: "monthly" } })} className={btn}><Plus size={15} /> Add Revenue</button>
        <button onClick={() => setDialog({ preset: { type: "outflow", frequency: "monthly" } })} className={btn}><Plus size={15} /> Add Expense</button>
        <button onClick={() => setDialog({ preset: { type: "inflow", frequency: "one_time" } })} className={btn}><Plus size={15} /> Add One-Time Receipt</button>
        <button onClick={() => setDialog({ preset: { type: "outflow", frequency: "one_time" } })} className={btn}><Plus size={15} /> Add One-Time Expense</button>
      </div>

      <div className="space-y-2">
        {assumptions.map((a) => (
          <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4 group">
            <div className="flex items-start gap-3 min-w-0">
              <button onClick={() => toggleActive(a)} title={a.active === false ? "Inactive — click to activate" : "Active — click to deactivate"} className={a.active === false ? "text-muted-foreground/50 hover:text-foreground shrink-0 mt-0.5" : "text-green-600 shrink-0 mt-0.5"}>
                {a.active === false ? <Circle size={16} /> : <CircleCheck size={16} />}
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-medium truncate ${a.active === false ? "text-muted-foreground line-through" : ""}`}>{a.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${a.type === "inflow" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{a.type === "inflow" ? "inflow" : "outflow"}</span>
                  {a.source === "ai" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">AI-interpreted</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {a.category} · {fmtMoney(a.amount)} · {freqLabel(a.frequency)}{a.frequency === "custom" ? ` (${a.custom_interval_days} days)` : ""} · anchor {a.anchor_date || "—"}
                  {a.start_date ? ` · from ${a.start_date}` : ""}{a.end_date ? ` · until ${a.end_date}` : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setDialog({ assumption: a })} className="p-1.5 text-muted-foreground hover:text-foreground rounded"><Pencil size={14} /></button>
              <button onClick={() => remove(a)} className="p-1.5 text-muted-foreground hover:text-destructive rounded"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {assumptions.length === 0 && (
          <p className="text-center py-10 text-sm text-muted-foreground">No assumptions yet — add one above, or describe your situation to the Cash Flow Assistant.</p>
        )}
      </div>

      {dialog && <AssumptionDialog assumption={dialog.assumption} preset={dialog.preset} onClose={() => setDialog(null)} onSave={upsert} />}
    </div>
  );
}