import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { CATEGORY_OPTIONS, FREQUENCIES } from "@/lib/cashFlow/engine";

const FIELD = "w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring";
const LABEL = "text-sm font-medium mb-1.5 block";

// Add/edit dialog for a single structured assumption. preset = { type } for the
// Add Revenue / Add Expense / One-Time Receipt / One-Time Expense buttons.
export default function AssumptionDialog({ assumption, preset, onClose, onSave }) {
  const isNew = !assumption;
  const [form, setForm] = useState(() => ({
    name: "",
    category: "",
    type: preset?.type || "outflow",
    amount: "",
    frequency: preset?.frequency || "monthly",
    custom_interval_days: "",
    anchor_date: "",
    start_date: "",
    end_date: "",
    description: "",
    confidence: "estimate",
    active: true,
    ...(assumption || {}),
  }));

  useEffect(() => {
    if (assumption) setForm((f) => ({ ...f, ...assumption }));
  }, [assumption]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const cats = CATEGORY_OPTIONS[form.type] || CATEGORY_OPTIONS.outflow;

  const submit = () => {
    if (!form.name?.trim() || !form.amount) return;
    const payload = {
      ...form,
      amount: Number(form.amount),
      category: form.category || cats[0],
      custom_interval_days: form.frequency === "custom" ? Number(form.custom_interval_days) || 30 : undefined,
      source: assumption?.source || "manual",
    };
    onSave(payload);
  };

  const isOneTime = form.frequency === "one_time";

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-full overflow-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
          <h3 className="font-semibold">{isNew ? `Add ${preset?.type === "inflow" ? "Inflow" : "Expense"}` : "Edit Assumption"}</h3>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded"><X size={16} /></button>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className={LABEL}>Name *</label><input className={FIELD} value={form.name || ""} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Payroll, Operating Revenue, February Grant" /></div>
          <div>
            <label className={LABEL}>Direction</label>
            <select className={FIELD} value={form.type} onChange={(e) => set({ type: e.target.value, category: "" })}>
              <option value="outflow">Outflow (expense)</option>
              <option value="inflow">Inflow (income)</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Category</label>
            <select className={FIELD} value={form.category || cats[0]} onChange={(e) => set({ category: e.target.value })}>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Amount (per occurrence) *</label>
            <input type="number" step="0.01" className={FIELD} value={form.amount ?? ""} onChange={(e) => set({ amount: e.target.value })} placeholder="39000" />
          </div>
          <div>
            <label className={LABEL}>Frequency</label>
            <select className={FIELD} value={form.frequency} onChange={(e) => set({ frequency: e.target.value })}>
              {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          {form.frequency === "custom" && (
            <div>
              <label className={LABEL}>Every N days</label>
              <input type="number" className={FIELD} value={form.custom_interval_days ?? ""} onChange={(e) => set({ custom_interval_days: e.target.value })} />
            </div>
          )}
          <div>
            <label className={LABEL}>{isOneTime ? "Date of transaction *" : "Anchor date"}</label>
            <input type="date" className={FIELD} value={form.anchor_date || ""} onChange={(e) => set({ anchor_date: e.target.value })} />
            {!isOneTime && <p className="text-[11px] text-muted-foreground mt-1">Actual dates are generated forward and backward from this date.</p>}
          </div>
          <div>
            <label className={LABEL}>Confidence</label>
            <select className={FIELD} value={form.confidence || "estimate"} onChange={(e) => set({ confidence: e.target.value })}>
              <option value="confirmed">Confirmed</option>
              <option value="estimate">Estimate</option>
              <option value="conservative_estimate">Conservative estimate</option>
            </select>
          </div>
          {!isOneTime && (
            <>
              <div><label className={LABEL}>Active from (optional)</label><input type="date" className={FIELD} value={form.start_date || ""} onChange={(e) => set({ start_date: e.target.value })} /></div>
              <div><label className={LABEL}>Active until (optional)</label><input type="date" className={FIELD} value={form.end_date || ""} onChange={(e) => set({ end_date: e.target.value })} /></div>
            </>
          )}
          <div className="sm:col-span-2"><label className={LABEL}>Description / notes</label><input className={FIELD} value={form.description || ""} onChange={(e) => set({ description: e.target.value })} /></div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Cancel</button>
          <button onClick={submit} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 transition flex items-center justify-center gap-1.5"><Check size={15} /> {isNew ? "Add" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}