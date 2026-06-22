import { useState } from "react";
import { Target, X, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const PRESET_MILESTONES = [
  "EDA Completion",
  "WD Completion",
  "Barriers Resolved",
  "90 Day DEA Follow-up",
  "90 Day WD Follow-up",
  "Follow up period maintenance",
];

const EDA_ACTIVITY_TITLE = "EDA Activity";

export default function MilestoneDialog({ client, onClose, onSave, saving }) {
  const existing = client.milestones || [];

  // Preset milestones (simple — date + status)
  const presetState = PRESET_MILESTONES.map(title => {
    const found = existing.find(m => m.title === title);
    return {
      title,
      date: found?.date || "",
      status: found?.status || "pending",
    };
  });
  const [items, setItems] = useState(presetState);

  // EDA Activities (multiple, each with a fillable activity name)
  const existingEda = existing.filter(m => m.title === EDA_ACTIVITY_TITLE);
  const [edaActivities, setEdaActivities] = useState(
    existingEda.length > 0
      ? existingEda.map(m => ({
          activity: m.notes || "",
          date: m.date || "",
          status: m.status || "pending",
        }))
      : [{ activity: "", date: "", status: "pending" }]
  );

  function updateItem(idx, field, value) {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  }

  function updateEdaActivity(idx, field, value) {
    const next = [...edaActivities];
    next[idx] = { ...next[idx], [field]: value };
    setEdaActivities(next);
  }

  function addEdaActivity() {
    setEdaActivities([...edaActivities, { activity: "", date: "", status: "pending" }]);
  }

  function removeEdaActivity(idx) {
    setEdaActivities(edaActivities.filter((_, i) => i !== idx));
  }

  function handleSave() {
    const nonPresetNonEda = existing.filter(
      m => !PRESET_MILESTONES.includes(m.title) && m.title !== EDA_ACTIVITY_TITLE
    );
    const presets = items
      .filter(item => item.date)
      .map(item => ({
        title: item.title,
        date: item.date,
        status: item.status,
        notes: "",
      }));
    const edaMilestones = edaActivities
      .filter(a => a.activity || a.date)
      .map(a => ({
        title: EDA_ACTIVITY_TITLE,
        date: a.date,
        status: a.status,
        notes: a.activity,
      }));
    onSave({ milestones: [...nonPresetNonEda, ...presets, ...edaMilestones] });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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

        {/* Preset milestones */}
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

        {/* EDA Activities — fillable activity name, add multiple */}
        <div className="border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">EDA Activities</span>
            <button
              type="button"
              onClick={addEdaActivity}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Activity
            </button>
          </div>
          <div className="space-y-2">
            {edaActivities.map((eda, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-blue-50 rounded-lg p-2">
                <button
                  onClick={() => updateEdaActivity(idx, "status", eda.status === "completed" ? "pending" : "completed")}
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition",
                    eda.status === "completed" ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-emerald-400"
                  )}
                >
                  {eda.status === "completed" && <CheckCircle2 className="w-3 h-3 text-white" />}
                </button>
                <Input
                  placeholder="Specific EDA activity..."
                  value={eda.activity}
                  onChange={e => updateEdaActivity(idx, "activity", e.target.value)}
                  className="h-8 text-sm flex-1"
                />
                <Input
                  type="date"
                  value={eda.date}
                  onChange={e => updateEdaActivity(idx, "date", e.target.value)}
                  className="h-8 text-sm w-36"
                />
                {edaActivities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEdaActivity(idx)}
                    className="text-slate-400 hover:text-red-500 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
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