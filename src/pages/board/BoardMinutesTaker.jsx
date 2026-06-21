import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const ENTRY_TYPES = ["note","motion","resolution","action_item","discussion","information","dissent","abstention","in_camera"];
const MOTION_RESULTS = ["","carried","defeated","tabled","withdrawn"];

const ENTRY_COLORS = {
  motion: "border-l-4 border-l-blue-400 bg-blue-50/40",
  resolution: "border-l-4 border-l-purple-400 bg-purple-50/40",
  action_item: "border-l-4 border-l-amber-400 bg-amber-50/40",
  in_camera: "border-l-4 border-l-red-400 bg-red-50/40",
  note: "",
};

export default function BoardMinutesTaker() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [agendaItems, setAgendaItems] = useState([]);
  const [entries, setEntries] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});
  const [activeItemId, setActiveItemId] = useState(null);
  const [form, setForm] = useState({ entry_type: "note", content: "", motion_verbiage: "", moved_by: "", seconded_by: "", motion_result: "", action_assigned_to: "", action_due_date: "", is_in_camera: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Meeting.filter({ id }),
      base44.entities.AgendaItem.filter({ meeting_id: id }),
      base44.entities.MinuteEntry.filter({ meeting_id: id }),
      base44.entities.BoardMember.filter({ status: "active" }),
    ]).then(([meetings, ai, me, bm]) => {
      setMeeting(meetings[0]);
      setAgendaItems(ai.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
      setEntries(me.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
      setMembers(bm);
      if (ai.length > 0) { setActiveItemId(ai[0].id); setExpandedItems({ [ai[0].id]: true }); }
      setLoading(false);
    });
  }, [id]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!activeItemId) return;
    setSaving(true);
    const itemEntries = entries.filter(e => e.agenda_item_id === activeItemId);
    const saved = await base44.entities.MinuteEntry.create({ ...form, meeting_id: id, agenda_item_id: activeItemId, order_index: itemEntries.length });
    setEntries(prev => [...prev, saved]);
    setForm({ entry_type: "note", content: "", motion_verbiage: "", moved_by: "", seconded_by: "", motion_result: "", action_assigned_to: "", action_due_date: "", is_in_camera: false });
    setSaving(false);
  };

  const handleDelete = async (entryId) => {
    await base44.entities.MinuteEntry.delete(entryId);
    setEntries(prev => prev.filter(e => e.id !== entryId));
  };

  const toggleItem = (itemId) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    setActiveItemId(itemId);
  };

  const isMotion = ["motion","resolution"].includes(form.entry_type);
  const isAction = form.entry_type === "action_item";

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/board/meetings" className="text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="font-heading text-2xl font-semibold">Minutes Taker</h1>
          {meeting && <p className="text-muted-foreground text-sm">{meeting.title} · {format(new Date(meeting.meeting_date), "MMMM d, yyyy")}</p>}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {agendaItems.map((item, idx) => {
          const itemEntries = entries.filter(e => e.agenda_item_id === item.id);
          const expanded = expandedItems[item.id];
          const isActive = activeItemId === item.id;
          return (
            <div key={item.id} className={`bg-card border rounded-xl overflow-hidden transition ${isActive ? "border-primary/40 shadow-sm" : "border-border"}`}>
              <button onClick={() => toggleItem(item.id)} className="w-full flex items-center gap-3 p-4 hover:bg-muted/40 transition text-left">
                <span className="text-xs font-semibold text-muted-foreground w-5">{idx + 1}.</span>
                <span className="flex-1 text-sm font-medium text-foreground">{item.title}</span>
                <span className="text-xs text-muted-foreground">{itemEntries.length} entries</span>
                {expanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
              </button>
              {expanded && (
                <div className="border-t border-border p-4 space-y-3">
                  {itemEntries.map(entry => (
                    <div key={entry.id} className={`p-3 rounded-lg bg-background border border-border group ${ENTRY_COLORS[entry.entry_type] || ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-muted-foreground uppercase">{entry.entry_type?.replace(/_/g, " ")}</span>
                          {entry.motion_verbiage && <p className="text-sm font-medium mt-1 italic">"{entry.motion_verbiage}"</p>}
                          {entry.content && <p className="text-sm text-foreground mt-1">{entry.content}</p>}
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                            {entry.moved_by && <span>Moved: {entry.moved_by}</span>}
                            {entry.seconded_by && <span>Seconded: {entry.seconded_by}</span>}
                            {entry.motion_result && <span className={`font-medium ${entry.motion_result === "carried" ? "text-green-600" : entry.motion_result === "defeated" ? "text-red-600" : "text-amber-600"}`}>{entry.motion_result}</span>}
                            {entry.action_assigned_to && <span>Assigned: {entry.action_assigned_to}</span>}
                            {entry.action_due_date && <span>Due: {format(new Date(entry.action_due_date), "MMM d, yyyy")}</span>}
                          </div>
                        </div>
                        <button onClick={() => handleDelete(entry.id)} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive shrink-0"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}

                  <form onSubmit={handleAddEntry} className="bg-muted/40 rounded-xl p-4 space-y-3 border border-dashed border-border">
                    <div className="flex items-center gap-2 flex-wrap">
                      <select value={form.entry_type} onChange={e => setForm({...form, entry_type: e.target.value})} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none">
                        {ENTRY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                      </select>
                      <span className="text-xs text-muted-foreground">for "{item.title}"</span>
                    </div>
                    {isMotion && (
                      <input value={form.motion_verbiage} onChange={e => setForm({...form, motion_verbiage: e.target.value})} placeholder="Motion verbiage (e.g. Be it resolved that...)" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none" />
                    )}
                    <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Notes / details..." rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none resize-none" />
                    {isMotion && (
                      <div className="grid grid-cols-3 gap-2">
                        <input value={form.moved_by} onChange={e => setForm({...form, moved_by: e.target.value})} placeholder="Moved by" className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none" />
                        <input value={form.seconded_by} onChange={e => setForm({...form, seconded_by: e.target.value})} placeholder="Seconded by" className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none" />
                        <select value={form.motion_result} onChange={e => setForm({...form, motion_result: e.target.value})} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none">
                          {MOTION_RESULTS.map(r => <option key={r} value={r}>{r || "— result —"}</option>)}
                        </select>
                      </div>
                    )}
                    {isAction && (
                      <div className="grid grid-cols-2 gap-2">
                        <input value={form.action_assigned_to} onChange={e => setForm({...form, action_assigned_to: e.target.value})} placeholder="Assigned to" className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none" />
                        <input type="date" value={form.action_due_date} onChange={e => setForm({...form, action_due_date: e.target.value})} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none" />
                      </div>
                    )}
                    <button type="submit" disabled={saving || (!form.content && !form.motion_verbiage)} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition disabled:opacity-50">
                      <Plus size={13} /> Add Entry
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
        {agendaItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No agenda items found. <Link to={`/board/meetings/${id}/agenda`} className="text-primary hover:underline">Build the agenda first.</Link></p>
          </div>
        )}
      </div>
    </div>
  );
}