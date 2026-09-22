import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, ArrowLeft, ChevronUp, ChevronDown, Lock, X, Lightbulb, Pencil, MapPin } from "lucide-react";
import { format } from "date-fns";
import BoardAgendaSuggestions from "@/components/board/BoardAgendaSuggestions";
import AgendaPrintButton from "@/components/board/AgendaPrintButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AGENDA_SECTIONS as SECTIONS, sectionOf } from "@/components/board/agendaDocumentHtml";



// The standing core every board agenda is built on
function buildCoreItems(previousMeeting) {
  const minutesTitle = previousMeeting
    ? `Approval of Previous Minutes — ${format(new Date(previousMeeting.meeting_date), "MMM d, yyyy")} (${previousMeeting.title})`
    : "Approval of Previous Minutes";
  return [
    { title: "Call to Order / Quorum", section: "administration", item_type: "call_to_order", duration_minutes: 2 },
    { title: "Approval of Agenda", section: "administration", item_type: "approval_of_agenda", duration_minutes: 2 },
    { title: minutesTitle, section: "administration", item_type: "approval_of_minutes", duration_minutes: 5 },
    { title: "Executive Director Report", section: "reports", item_type: "reports", duration_minutes: 15 },
    { title: "Treasurer Report", section: "reports", item_type: "reports", duration_minutes: 10 },
    { title: "Date of Next Meeting", section: "adjournment", item_type: "adjournment", duration_minutes: 1 },
    { title: "Motion to Adjourn", section: "adjournment", item_type: "adjournment", duration_minutes: 1 },
    { title: "Invitation to Visit", section: "adjournment", item_type: "adjournment", duration_minutes: 2 },
  ];
}

export default function BoardAgendaBuilder() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formSection, setFormSection] = useState(null);
  const [form, setForm] = useState({ title: "", item_type: "new_business", presenter: "", duration_minutes: 5, description: "", is_in_camera: false });
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [locationDraft, setLocationDraft] = useState(null);
  const [meetingList, setMeetingList] = useState([]);
  const [minutesEdit, setMinutesEdit] = useState(null);

  useEffect(() => {
    (async () => {
      const [meetings, agendaItems] = await Promise.all([
        base44.entities.Meeting.filter({ id }),
        base44.entities.AgendaItem.filter({ meeting_id: id }),
      ]);
      setMeeting(meetings[0]);
      let current = agendaItems.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

      // All meetings — used for the previous-minutes autofill and the picker
      const list = await base44.entities.Meeting.list("-meeting_date", 50);
      setMeetingList(list || []);

      // Seed the standing core structure the first time this agenda is opened
      if (current.length === 0) {
        // Autofill from the most recent meeting BEFORE this one
        const previous =
          (list || []).find((m) => m.id !== id && meetings[0] && new Date(m.meeting_date) < new Date(meetings[0].meeting_date)) ||
          (list || []).find((m) => m.id !== id);
        const core = buildCoreItems(previous).map((c, i) => ({
          ...c,
          meeting_id: id,
          order_index: i,
        }));
        current = await base44.entities.AgendaItem.bulkCreate(core);
      }
      setItems(current);
      setLoading(false);
    })();
  }, [id]);

  const SECTION_ITEM_TYPE = {
    administration: "other",
    business_arising: "business_arising",
    new_business: "new_business",
    reports: "reports",
    adjournment: "adjournment",
    other: "other",
  };

  const openForm = (sectionKey) => {
    setEditingItem(null);
    setFormSection(sectionKey);
    setForm({ title: "", item_type: SECTION_ITEM_TYPE[sectionKey] || "other", presenter: "", duration_minutes: 5, description: "", is_in_camera: false });
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormSection(sectionOf(item));
    setForm({
      title: item.title || "",
      item_type: item.item_type || "other",
      presenter: item.presenter || "",
      duration_minutes: item.duration_minutes ?? 5,
      description: item.description || "",
      is_in_camera: !!item.is_in_camera,
    });
  };

  const closeForm = () => {
    setEditingItem(null);
    setFormSection(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (editingItem) {
      const saved = await base44.entities.AgendaItem.update(editingItem.id, {
        ...form,
        duration_minutes: Number(form.duration_minutes),
      });
      setItems((prev) => prev.map((i) => (i.id === editingItem.id ? { ...i, ...saved } : i)));
    } else {
      const saved = await base44.entities.AgendaItem.create({
        ...form,
        section: formSection,
        meeting_id: id,
        order_index: items.length,
        duration_minutes: Number(form.duration_minutes),
      });
      setItems((prev) => [...prev, saved]);
    }
    setSaving(false);
    closeForm();
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    const value = locationDraft.trim();
    await base44.entities.Meeting.update(meeting.id, { location: value });
    setMeeting((m) => ({ ...m, location: value }));
    setLocationDraft(null);
  };

  const handleSavePrevMinutes = async (e) => {
    e.preventDefault();
    let title;
    const m = (meetingList || []).find((x) => x.id === minutesEdit.meetingId);
    if (m) {
      title = `Approval of Previous Minutes — ${format(new Date(m.meeting_date), "MMM d, yyyy")} (${m.title})`;
    } else if (minutesEdit.custom) {
      title = `Approval of Previous Minutes — ${format(new Date(minutesEdit.custom), "MMM d, yyyy")}`;
    } else {
      return;
    }
    const saved = await base44.entities.AgendaItem.update(minutesItem.id, { title });
    setItems((prev) => prev.map((i) => (i.id === minutesItem.id ? { ...i, ...saved } : i)));
    setMinutesEdit(null);
  };

  const handleDelete = async (itemId) => {
    await base44.entities.AgendaItem.delete(itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleAddSuggestion = async (s) => {
    const saved = await base44.entities.AgendaItem.create({
      title: s.title,
      description: s.description,
      section: s.section,
      item_type: s.item_type,
      meeting_id: id,
      order_index: items.length,
      duration_minutes: s.duration_minutes || 5,
    });
    setItems((prev) => [...prev, saved]);
  };

  const move = async (sectionKey, idx, direction) => {
    const sectionItems = items
      .filter((i) => sectionOf(i) === sectionKey)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const target = idx + direction;
    if (target < 0 || target >= sectionItems.length) return;
    const a = sectionItems[idx];
    const b = sectionItems[target];
    setItems((prev) =>
      prev.map((i) =>
        i.id === a.id ? { ...i, order_index: b.order_index ?? target }
        : i.id === b.id ? { ...i, order_index: a.order_index ?? idx }
        : i
      )
    );
    await Promise.all([
      base44.entities.AgendaItem.update(a.id, { order_index: b.order_index ?? target }),
      base44.entities.AgendaItem.update(b.id, { order_index: a.order_index ?? idx }),
    ]);
  };

  const totalDuration = items.reduce((s, i) => s + (i.duration_minutes || 0), 0);
  const existingTitles = new Set(items.map((i) => i.title));
  const minutesItem = items.find((i) => i.item_type === "approval_of_minutes");
  const prevMeeting = meeting
    ? (meetingList || []).find((m) => m.id !== id && new Date(m.meeting_date) < new Date(meeting.meeting_date))
    : null;

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/board/meetings" className="text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="font-heading text-2xl font-semibold">Agenda Builder</h1>
          {meeting && (
          <div className="text-muted-foreground text-sm flex items-center gap-3 flex-wrap">
            <span>{meeting.title} · {format(new Date(meeting.meeting_date), "MMMM d, yyyy 'at' h:mm a")}</span>
            {locationDraft === null ? (
              <span className="flex items-center gap-1.5">
                {meeting.location ? (
                  <>
                    <MapPin size={12} className="shrink-0" /> {meeting.location}
                    <button onClick={() => setLocationDraft(meeting.location)} className="text-primary hover:underline inline-flex items-center gap-0.5"><Pencil size={11} /> Edit</button>
                  </>
                ) : (
                  <button onClick={() => setLocationDraft("")} className="text-primary hover:underline inline-flex items-center gap-1"><MapPin size={12} /> Add meeting location</button>
                )}
              </span>
            ) : (
              <form onSubmit={handleSaveLocation} className="flex items-center gap-2">
                <input autoFocus value={locationDraft} onChange={(e) => setLocationDraft(e.target.value)} placeholder="Meeting location or video link" className="border border-input rounded-lg px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                <button type="submit" className="text-primary text-xs font-medium hover:underline">Save</button>
                <button type="button" onClick={() => setLocationDraft(null)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
              </form>
            )}
          </div>
        )}
        {meeting && minutesItem && (
          <div className="text-sm flex items-center gap-2 flex-wrap mt-1">
            <span className="text-muted-foreground">Approval of previous minutes:</span>
            {minutesEdit === null ? (
              <span className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-foreground">{minutesItem.title}</span>
                <button
                  onClick={() => setMinutesEdit({ meetingId: prevMeeting?.id || "custom", custom: "" })}
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  <Pencil size={11} /> Edit
                </button>
              </span>
            ) : (
              <form onSubmit={handleSavePrevMinutes} className="flex items-center gap-2 flex-wrap">
                <Select value={minutesEdit.meetingId} onValueChange={(v) => setMinutesEdit({ ...minutesEdit, meetingId: v })}>
                  <SelectTrigger className="w-[280px] h-8 text-sm"><SelectValue placeholder="Choose a meeting…" /></SelectTrigger>
                  <SelectContent>
                    {(meetingList || []).filter((m) => m.id !== id).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.title} — {format(new Date(m.meeting_date), "MMM d, yyyy")}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Other date…</SelectItem>
                  </SelectContent>
                </Select>
                {minutesEdit.meetingId === "custom" && (
                  <input
                    type="date"
                    required
                    value={minutesEdit.custom}
                    onChange={(e) => setMinutesEdit({ ...minutesEdit, custom: e.target.value })}
                    className="border border-input rounded-lg px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
                <button type="submit" className="text-primary text-xs font-medium hover:underline">Save</button>
                <button type="button" onClick={() => setMinutesEdit(null)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
              </form>
            )}
          </div>
        )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 mt-4">
        <p className="text-sm text-muted-foreground">{items.length} items · {totalDuration} min total</p>
        <AgendaPrintButton meeting={meeting} items={items} />
      </div>

      {/* Suggested Agenda Items — from organizational data */}
      <div className="mb-6 bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Suggested Agenda Items</h3>
          <span className="text-[10px] text-muted-foreground ml-1">Board-relevant items from the last agenda, ED reports, events, strategic goals & documents</span>
        </div>
        <BoardAgendaSuggestions meeting={meeting} existingTitles={existingTitles} onAdd={handleAddSuggestion} />
      </div>

      {/* Add item form */}
      {formSection && (
        <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {editingItem ? "Edit Item" : `Add to ${SECTIONS.find((s) => s.key === formSection)?.label}`}
            </h3>
            <button type="button" onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block">Title *</label><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Presenter</label><input value={form.presenter} onChange={e => setForm({...form, presenter: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Duration (min)</label><input type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: e.target.value})} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" min="0" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">In Camera (confidential)</label><label className="flex items-center gap-2 text-sm cursor-pointer mt-2"><input type="checkbox" checked={form.is_in_camera} onChange={e => setForm({...form, is_in_camera: e.target.checked})} className="w-4 h-4" /> Confidential item</label></div>
            <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Notes / Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={closeForm} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60">{saving ? "Saving..." : editingItem ? "Save Changes" : "Add Item"}</button>
          </div>
        </form>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {SECTIONS.filter(({ key }) => key !== "other" || items.some((i) => sectionOf(i) === "other")).map(({ key, label }) => {
          const sectionItems = items
            .filter((i) => sectionOf(i) === key)
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
          const sectionTotal = sectionItems.reduce((s, i) => s + (i.duration_minutes || 0), 0);
          return (
            <div key={key} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/60 border-b border-border">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{label}</h3>
                  {sectionTotal > 0 && <span className="text-[10px] text-muted-foreground">{sectionTotal} min</span>}
                </div>
                <button onClick={() => openForm(key)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  <Plus size={13} /> Add
                </button>
              </div>
              {sectionItems.length === 0 ? (
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground italic">
                    {key === "business_arising" || key === "new_business"
                      ? "Sub-items vary from meeting to meeting — add below or pick from the suggestions above."
                      : "No items yet."}
                  </p>
                  <button onClick={() => openForm(key)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0">
                    <Plus size={13} /> Add
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sectionItems.map((item, idx) => (
                    <div key={item.id} className={`px-4 py-3 flex items-center gap-3 group ${item.is_in_camera ? "bg-amber-50/40" : ""}`}>
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => move(key, idx, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronUp size={14} /></button>
                        <button onClick={() => move(key, idx, 1)} disabled={idx === sectionItems.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronDown size={14} /></button>
                      </div>
                      <span className="text-xs text-muted-foreground w-5 text-right">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          {item.is_in_camera && <Lock size={12} className="text-amber-600" />}
                        </div>
                        {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>}
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          {item.presenter && <span>{item.presenter}</span>}
                          {item.duration_minutes > 0 && <span>{item.duration_minutes} min</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => openEdit(item)} className="text-muted-foreground hover:text-foreground" title="Edit item"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-destructive" title="Delete item"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}