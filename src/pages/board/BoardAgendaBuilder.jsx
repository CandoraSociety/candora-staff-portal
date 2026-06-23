import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, GripVertical, ArrowLeft, ChevronUp, ChevronDown, Lock } from "lucide-react";
import { format } from "date-fns";
import ActivitySuggestionsPanel from "@/components/shared/ActivitySuggestionsPanel";
import { Lightbulb } from "lucide-react";

const ITEM_TYPES = ["call_to_order","approval_of_agenda","approval_of_minutes","business_arising","new_business","reports","in_camera","adjournment","other"];

export default function BoardAgendaBuilder() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", item_type: "other", presenter: "", duration_minutes: 10, description: "", is_in_camera: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Meeting.filter({ id }),
      base44.entities.AgendaItem.filter({ meeting_id: id }),
    ]).then(([meetings, agendaItems]) => {
      setMeeting(meetings[0]);
      setItems(agendaItems.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
      setLoading(false);
    });
  }, [id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saved = await base44.entities.AgendaItem.create({ ...form, meeting_id: id, order_index: items.length, duration_minutes: Number(form.duration_minutes) });
    setItems(prev => [...prev, saved]);
    setForm({ title: "", item_type: "other", presenter: "", duration_minutes: 10, description: "", is_in_camera: false });
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (itemId) => {
    await base44.entities.AgendaItem.delete(itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const move = async (index, direction) => {
    const newItems = [...items];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    const updated = newItems.map((item, i) => ({ ...item, order_index: i }));
    setItems(updated);
    await Promise.all(updated.map(item => base44.entities.AgendaItem.update(item.id, { order_index: item.order_index })));
  };

  const handleAddSuggestion = async (suggestion) => {
    const saved = await base44.entities.AgendaItem.create({
      title: suggestion.title,
      item_type: "reports",
      description: suggestion.description || "",
      meeting_id: id,
      order_index: items.length,
      duration_minutes: 10,
    });
    setItems(prev => [...prev, saved]);
  };

  const totalDuration = items.reduce((s, i) => s + (i.duration_minutes || 0), 0);

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/board/meetings" className="text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="font-heading text-2xl font-semibold">Agenda Builder</h1>
          {meeting && <p className="text-muted-foreground text-sm">{meeting.title} · {format(new Date(meeting.meeting_date), "MMMM d, yyyy 'at' h:mm a")}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 mt-4">
        <p className="text-sm text-muted-foreground">{items.length} items · {totalDuration} min total</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
          <Plus size={15} /> Add Item
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4">New Agenda Item</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block">Title *</label><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Type</label><select value={form.item_type} onChange={e => setForm({...form, item_type: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none">{ITEM_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</select></div>
            <div><label className="text-sm font-medium mb-1.5 block">Presenter</label><input value={form.presenter} onChange={e => setForm({...form, presenter: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Duration (min)</label><input type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none" min="0" /></div>
            <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Notes / Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none resize-none" /></div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_in_camera} onChange={e => setForm({...form, is_in_camera: e.target.checked})} className="w-4 h-4" />
                In Camera (confidential)
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60">{saving ? "Saving..." : "Add Item"}</button>
          </div>
        </form>
      )}

      {/* My Activity Suggestions */}
      <div className="mb-6 bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">My Activity Suggestions</h3>
          <span className="text-[10px] text-muted-foreground ml-1">From your notes, tasks, projects & priorities</span>
        </div>
        <ActivitySuggestionsPanel onAddSuggestion={handleAddSuggestion} />
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.id} className={`bg-card border rounded-xl p-4 flex items-center gap-3 group ${item.is_in_camera ? "border-amber-200 bg-amber-50/40" : "border-border"}`}>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(idx, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronUp size={14} /></button>
              <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronDown size={14} /></button>
            </div>
            <span className="text-xs text-muted-foreground w-5 text-right">{idx + 1}.</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                {item.is_in_camera && <Lock size={12} className="text-amber-600" />}
                <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{item.item_type?.replace(/_/g, " ")}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                {item.presenter && <span>{item.presenter}</span>}
                {item.duration_minutes > 0 && <span>{item.duration_minutes} min</span>}
              </div>
            </div>
            <button onClick={() => handleDelete(item.id)} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No agenda items yet. Add the first item above.</p>
          </div>
        )}
      </div>
    </div>
  );
}