import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Target, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_OPTS = ["not_started","in_progress","on_track","at_risk","completed"];
const STATUS_COLORS = {
  not_started: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  on_track: "bg-green-100 text-green-700",
  at_risk: "bg-red-100 text-red-700",
  completed: "bg-emerald-100 text-emerald-700",
};

export default function BoardStrategicPlan() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedPillars, setExpandedPillars] = useState({});
  const [form, setForm] = useState({ pillar: "", goal: "", description: "", owner: "", target_date: "", status: "not_started", progress_percent: 0 });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    base44.entities.StrategicGoal.list("order_index").then(data => { setGoals(data); setLoading(false); });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saved = await base44.entities.StrategicGoal.create({ ...form, order_index: goals.length, progress_percent: Number(form.progress_percent) });
    setGoals(prev => [...prev, saved]);
    setForm({ pillar: "", goal: "", description: "", owner: "", target_date: "", status: "not_started", progress_percent: 0 });
    setShowForm(false);
    setSaving(false);
  };

  const handleUpdate = async (id) => {
    await base44.entities.StrategicGoal.update(id, { ...editForm, progress_percent: Number(editForm.progress_percent) });
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...editForm } : g));
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this goal?")) return;
    await base44.entities.StrategicGoal.delete(id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const pillars = [...new Set(goals.map(g => g.pillar))];

  const togglePillar = (pillar) => setExpandedPillars(p => ({ ...p, [pillar]: !p[pillar] }));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Strategic Plan</h1>
          <p className="text-muted-foreground text-sm mt-1">{goals.length} goals across {pillars.length} pillars</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4">New Strategic Goal</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block">Strategic Pillar *</label><input required value={form.pillar} onChange={e => setForm({...form, pillar: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Financial Sustainability" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Goal *</label><input required value={form.goal} onChange={e => setForm({...form, goal: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Owner</label><input value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Target Date</label><input type="date" value={form.target_date} onChange={e => setForm({...form, target_date: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none">{STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</select></div>
            <div><label className="text-sm font-medium mb-1.5 block">Progress ({form.progress_percent}%)</label><input type="range" min="0" max="100" value={form.progress_percent} onChange={e => setForm({...form, progress_percent: e.target.value})} className="w-full" /></div>
            <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none resize-none" /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60">{saving ? "Saving..." : "Add Goal"}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : pillars.length > 0 ? (
        <div className="space-y-4">
          {pillars.map(pillar => {
            const pillarGoals = goals.filter(g => g.pillar === pillar);
            const expanded = expandedPillars[pillar] !== false;
            const avgProgress = Math.round(pillarGoals.reduce((s, g) => s + (g.progress_percent || 0), 0) / pillarGoals.length);
            return (
              <div key={pillar} className="bg-card border border-border rounded-xl overflow-hidden">
                <button onClick={() => togglePillar(pillar)} className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition">
                  <div className="flex items-center gap-3">
                    <Target size={16} className="text-primary" />
                    <span className="font-semibold text-foreground">{pillar}</span>
                    <span className="text-xs text-muted-foreground">{pillarGoals.length} goal{pillarGoals.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${avgProgress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{avgProgress}%</span>
                    </div>
                    {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </div>
                </button>
                {expanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {pillarGoals.map(goal => (
                      <div key={goal.id} className="p-4 group">
                        {editingId === goal.id ? (
                          <div className="space-y-3">
                            <input value={editForm.goal} onChange={e => setEditForm({...editForm, goal: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none" />
                            <div className="grid grid-cols-3 gap-3">
                              <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none">{STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</select>
                              <input type="range" min="0" max="100" value={editForm.progress_percent} onChange={e => setEditForm({...editForm, progress_percent: e.target.value})} className="col-span-2" />
                            </div>
                            <textarea value={editForm.updates || ""} onChange={e => setEditForm({...editForm, updates: e.target.value})} rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none resize-none" placeholder="Latest updates..." />
                            <div className="flex gap-2">
                              <button onClick={() => handleUpdate(goal.id)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">Save</button>
                              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 border border-border rounded-lg text-xs">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="text-sm font-medium text-foreground">{goal.goal}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[goal.status]}`}>{goal.status?.replace(/_/g, " ")}</span>
                              </div>
                              {goal.description && <p className="text-xs text-muted-foreground mb-2">{goal.description}</p>}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 max-w-xs h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full bg-primary rounded-full" style={{ width: `${goal.progress_percent || 0}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground">{goal.progress_percent || 0}%</span>
                                {goal.owner && <span className="text-xs text-muted-foreground">· {goal.owner}</span>}
                              </div>
                              {goal.updates && <p className="text-xs text-muted-foreground mt-1 italic">{goal.updates}</p>}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                              <button onClick={() => { setEditingId(goal.id); setEditForm({ goal: goal.goal, status: goal.status, progress_percent: goal.progress_percent || 0, updates: goal.updates || "" }); }} className="text-xs border border-border px-2 py-1 rounded-lg hover:bg-muted transition">Edit</button>
                              <button onClick={() => handleDelete(goal.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded"><Trash2 size={13} /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Target size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No strategic goals yet</p>
        </div>
      )}
    </div>
  );
}