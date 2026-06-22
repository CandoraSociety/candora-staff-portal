import { useState } from "react";
import { Target, X, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const PRESET_MILESTONES = [
  "EDA Completion",
  "WD Completion",
  "Barriers Resolved",
  "90 Day DEA Follow-up",
  "90 Day WD Follow-up",
];

export default function MilestoneDialog({ client, onClose, onSave, saving }) {
  const existing = client.milestones || [];
  const initialState = PRESET_MILESTONES.map(title => {
    const found = existing.find(m => m.title === title);
    return {
      title,
      date: found?.date || "",
      status: found?.status || "pending",
    };
  });
  const [items, setItems] = useState(initialState);

  function updateItem(idx, field, value) {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  }

  function handleSave() {
    const nonPreset = existing.filter(m => !PRESET_MILESTONES.includes(m.title));
    const presets = items
      .filter(item => item.date)
      .map(item => ({
        title: item.title,
        date: item.date,
        status: item.status,
        notes: "",
      }));
    onSave({ milestones: [...nonPreset, ...presets] });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-sm" style={{ color: "hsl(231,64%,20%)" }}>
              Set Milestones — {client.first_name} {client.last_name}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-slate-500">Set target dates for key program milestones. These populate the Overdue, Upcoming, and Milestones summary cards.</p>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
              <button
                onClick={() => updateItem(idx, "status", item.status === "completed" ? "pending" : "completed")}
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition",
                  item.status === "completed" ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-emerald-400"
                )}
              >
                {item.status === "completed" && <CheckCircle2 className="w-3 h-3 text-white" />}
              </button>
              <span className={cn("text-sm w-44 shrink-0", item.status === "completed" ? "text-slate-400 line-through" : "text-slate-700")}>
                {item.title}
              </span>
              <Input
                type="date"
                value={item.date}
                onChange={e => updateItem(idx, "date", e.target.value)}
                className="h-8 text-sm flex-1"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
            Save Milestones
          </Button>
        </div>
      </div>
    </div>
  );
}