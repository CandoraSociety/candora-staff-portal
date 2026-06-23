import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, ChevronUp, ChevronDown, X, Pencil, ListChecks, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const ITEM_TYPES = ["opening", "review", "discussion", "decision", "action_item", "update", "presentation", "closing", "other"];

const TYPE_COLORS = {
  opening: "bg-emerald-100 text-emerald-700",
  review: "bg-blue-100 text-blue-700",
  discussion: "bg-violet-100 text-violet-700",
  decision: "bg-amber-100 text-amber-700",
  action_item: "bg-rose-100 text-rose-700",
  update: "bg-cyan-100 text-cyan-700",
  presentation: "bg-indigo-100 text-indigo-700",
  closing: "bg-slate-100 text-slate-700",
  other: "bg-muted text-muted-foreground",
};

const AGENDA_TEMPLATES = {
  "Staff Meeting": [
    { title: "Welcome & Check-in", item_type: "opening", duration_minutes: 10 },
    { title: "Agenda Review", item_type: "review", duration_minutes: 5 },
    { title: "Team Updates", item_type: "update", duration_minutes: 15 },
    { title: "Discussion Items", item_type: "discussion", duration_minutes: 20 },
    { title: "Action Items Review", item_type: "action_item", duration_minutes: 10 },
    { title: "Wrap-up & Next Steps", item_type: "closing", duration_minutes: 5 },
  ],
  "1-on-1": [
    { title: "Wins & Accomplishments", item_type: "opening", duration_minutes: 10 },
    { title: "Challenges & Blockers", item_type: "discussion", duration_minutes: 15 },
    { title: "Goal Progress Review", item_type: "review", duration_minutes: 10 },
    { title: "Feedback", item_type: "discussion", duration_minutes: 10 },
    { title: "Action Items", item_type: "action_item", duration_minutes: 5 },
  ],
  "Leadership Team": [
    { title: "Strategic Priority Updates", item_type: "update", duration_minutes: 20 },
    { title: "Financial Review", item_type: "presentation", duration_minutes: 15 },
    { title: "Operations Report", item_type: "presentation", duration_minutes: 15 },
    { title: "Strategic Decisions", item_type: "decision", duration_minutes: 20 },
    { title: "Open Discussion", item_type: "discussion", duration_minutes: 15 },
  ],
};

const EMPTY_ITEM = { title: "", item_type: "", presenter: "", duration_minutes: "", description: "" };

export default function AgendaTab({ selectedMeetingId }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);

  const { data: meetings = [] } = useQuery({
    queryKey: ["ed-meetings"],
    queryFn: () => base44.entities.EDMeeting.list("-meeting_date"),
  });

  const { data: agendaItems = [], isLoading } = useQuery({
    queryKey: ["ed-agenda-items", selectedMeetingId],
    queryFn: () => selectedMeetingId ? base44.entities.EDAgendaItem.filter({ meeting_id: selectedMeetingId }) : [],
    enabled: !!selectedMeetingId,
  });

  const sortedItems = [...agendaItems].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);

  useEffect(() => {
    if (selectedMeetingId && !isLoading && sortedItems.length === 0) {
      setShowForm(true);
    }
  }, [selectedMeetingId, isLoading, sortedItems.length]);

  const createItem = useMutation({
    mutationFn: (data) => base44.entities.EDAgendaItem.create(data),
    onSuccess: () => { qc.invalidateQueries(["ed-agenda-items", selectedMeetingId]); setShowForm(false); toast({ title: "Agenda item added" }); },
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EDAgendaItem.update(id, data),
    onSuccess: () => { qc.invalidateQueries(["ed-agenda-items", selectedMeetingId]); setShowForm(false); setEditingItemId(null); toast({ title: "Agenda item updated" }); },
  });

  const deleteItem = useMutation({
    mutationFn: (id) => base44.entities.EDAgendaItem.delete(id),
    onSuccess: () => qc.invalidateQueries(["ed-agenda-items", selectedMeetingId]),
  });

  const moveItem = useMutation({
    mutationFn: async (items) => {
      await Promise.all(items.map((item, i) => base44.entities.EDAgendaItem.update(item.id, { order_index: i })));
    },
    onSuccess: () => qc.invalidateQueries(["ed-agenda-items", selectedMeetingId]),
  });

  const applyTemplate = useMutation({
    mutationFn: async (templateName) => {
      const template = AGENDA_TEMPLATES[templateName];
      if (!template) return;
      const startIdx = sortedItems.length;
      await base44.entities.EDAgendaItem.bulkCreate(
        template.map((item, i) => ({ ...item, meeting_id: selectedMeetingId, order_index: startIdx + i }))
      );
    },
    onSuccess: () => { qc.invalidateQueries(["ed-agenda-items", selectedMeetingId]); toast({ title: "Template applied" }); },
  });

  const handleSubmitItem = (e) => {
    e.preventDefault();
    const payload = {
      ...itemForm,
      meeting_id: selectedMeetingId,
      duration_minutes: itemForm.duration_minutes === "" ? null : Number(itemForm.duration_minutes) || 0,
    };
    if (editingItemId) {
      updateItem.mutate({ id: editingItemId, data: payload });
    } else {
      createItem.mutate({ ...payload, order_index: sortedItems.length });
    }
    setItemForm(EMPTY_ITEM);
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setItemForm({
      title: item.title || "",
      item_type: item.item_type || "",
      presenter: item.presenter || "",
      duration_minutes: item.duration_minutes ?? "",
      description: item.description || "",
    });
    setShowForm(true);
  };

  const handleMove = (index, direction) => {
    const newItems = [...sortedItems];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    moveItem.mutate(newItems.map((item, i) => ({ ...item, order_index: i })));
  };

  const totalDuration = sortedItems.reduce((s, i) => s + (i.duration_minutes || 0), 0);

  if (!selectedMeetingId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ListChecks className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Select a meeting from the Meetings tab to build its agenda.</p>
      </div>
    );
  }

  return (
    <div>
      {selectedMeeting && (
        <div className="bg-muted/30 border border-border rounded-lg p-3 mb-3">
          <p className="text-sm font-medium">{selectedMeeting.title}</p>
          <p className="text-xs text-muted-foreground">{selectedMeeting.meeting_type}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">{sortedItems.length} items · {Math.floor(totalDuration / 60)}h {totalDuration % 60}m</p>
        <Button size="sm" variant="outline" onClick={() => { setEditingItemId(null); setItemForm(EMPTY_ITEM); setShowForm(!showForm); }} className="gap-1.5 h-7 text-xs">
          <Plus className="w-3.5 h-3.5" /> Add Item
        </Button>
      </div>

      {sortedItems.length === 0 && !showForm && (
        <div className="bg-muted/30 border border-dashed border-border rounded-lg p-3 mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <LayoutTemplate className="w-3.5 h-3.5" /> Apply a template (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(AGENDA_TEMPLATES).map(name => (
              <button key={name} onClick={() => applyTemplate.mutate(name)} disabled={applyTemplate.isPending}
                className="text-xs px-2.5 py-1 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 transition disabled:opacity-50">
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmitItem} className="bg-muted/30 border border-border rounded-lg p-3 mb-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{editingItemId ? "Edit" : "New"} Item</span>
            <button type="button" onClick={() => { setShowForm(false); setEditingItemId(null); setItemForm(EMPTY_ITEM); }} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
          <Input required value={itemForm.title} onChange={e => setItemForm({ ...itemForm, title: e.target.value })} className="h-8 text-sm" placeholder="Agenda item title" />
          <div className="grid grid-cols-2 gap-2">
            <select value={itemForm.item_type} onChange={e => setItemForm({ ...itemForm, item_type: e.target.value })} className="border border-input rounded-md px-2 py-1.5 text-sm bg-background h-8">
              <option value="">— Type —</option>
              {ITEM_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
            <Input type="number" min="0" value={itemForm.duration_minutes} onChange={e => setItemForm({ ...itemForm, duration_minutes: e.target.value })} className="h-8 text-sm" placeholder="Min" />
          </div>
          <Input value={itemForm.presenter} onChange={e => setItemForm({ ...itemForm, presenter: e.target.value })} className="h-8 text-sm" placeholder="Presenter" />
          <textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} rows={2} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none" placeholder="Description (optional)" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => { setShowForm(false); setEditingItemId(null); setItemForm(EMPTY_ITEM); }}>Cancel</Button>
            <Button type="submit" size="sm" className="flex-1" disabled={createItem.isPending || updateItem.isPending}>
              {createItem.isPending || updateItem.isPending ? "Saving..." : editingItemId ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {isLoading && <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>}
        {sortedItems.map((item, idx) => (
          <div key={item.id} className="bg-card border border-border rounded-lg p-2.5 flex items-center gap-2 group">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => handleMove(idx, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleMove(idx, 1)} disabled={idx === sortedItems.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground w-4 text-right font-medium">{idx + 1}.</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-medium">{item.title}</p>
                {item.item_type && (
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", TYPE_COLORS[item.item_type] || TYPE_COLORS.other)}>
                    {item.item_type?.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                {item.presenter && <span>{item.presenter}</span>}
                {item.duration_minutes > 0 && <span>{item.duration_minutes} min</span>}
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => handleEditItem(item)} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-primary p-1">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => deleteItem.mutate(item.id)} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {sortedItems.length === 0 && !isLoading && !showForm && (
          <p className="text-xs text-muted-foreground text-center py-6">No agenda items yet.</p>
        )}
      </div>
    </div>
  );
}