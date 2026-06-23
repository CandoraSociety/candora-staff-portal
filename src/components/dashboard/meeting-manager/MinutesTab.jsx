import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { FileText, Clock, Calendar, Plus, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import MinuteEntryForm from "./MinuteEntryForm";

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

const ENTRY_TYPE_COLORS = {
  motion: "bg-blue-100 text-blue-700 border-blue-200",
  resolution: "bg-indigo-100 text-indigo-700 border-indigo-200",
  action_item: "bg-rose-100 text-rose-700 border-rose-200",
  discussion: "bg-violet-100 text-violet-700 border-violet-200",
  information: "bg-cyan-100 text-cyan-700 border-cyan-200",
  dissent: "bg-orange-100 text-orange-700 border-orange-200",
  abstention: "bg-amber-100 text-amber-700 border-amber-200",
  in_camera: "bg-slate-100 text-slate-700 border-slate-200",
  note: "bg-muted text-muted-foreground border-border",
};

const ENTRY_TYPE_LABELS = {
  motion: "Motion",
  resolution: "Resolution",
  action_item: "Action Item",
  discussion: "Discussion",
  information: "Information",
  dissent: "Dissent",
  abstention: "Abstention",
  in_camera: "In Camera",
  note: "Note",
};

const SUMMARY_ORDER = ["motion", "resolution", "action_item", "discussion", "information", "dissent", "abstention", "in_camera"];

export default function MinutesTab({ selectedMeetingId, onSelectMeeting }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [addingEntryFor, setAddingEntryFor] = useState(null);
  const [notesDrafts, setNotesDrafts] = useState({});
  const [notesDirty, setNotesDirty] = useState({});
  const saveTimers = useRef({});

  const { data: meetings = [] } = useQuery({
    queryKey: ["ed-meetings"],
    queryFn: () => base44.entities.EDMeeting.list("-meeting_date"),
  });

  const { data: agendaItems = [] } = useQuery({
    queryKey: ["ed-agenda-items", selectedMeetingId],
    queryFn: () => selectedMeetingId ? base44.entities.EDAgendaItem.filter({ meeting_id: selectedMeetingId }) : [],
    enabled: !!selectedMeetingId,
  });

  const { data: minuteEntries = [] } = useQuery({
    queryKey: ["ed-minute-entries", selectedMeetingId],
    queryFn: () => selectedMeetingId ? base44.entities.MinuteEntry.filter({ meeting_id: selectedMeetingId }) : [],
    enabled: !!selectedMeetingId,
  });

  const sortedItems = [...agendaItems].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);
  const attendees = selectedMeeting?.attendees || [];

  // Group entries by agenda item
  const entriesByItem = {};
  minuteEntries.forEach(e => {
    const key = e.agenda_item_id || "_general";
    if (!entriesByItem[key]) entriesByItem[key] = [];
    entriesByItem[key].push(e);
  });

  // Initialize notes drafts from existing "note" entries
  useEffect(() => {
    if (!selectedMeetingId) return;
    const drafts = {};
    minuteEntries.forEach(e => {
      if (e.entry_type === "note" && e.agenda_item_id) {
        drafts[e.agenda_item_id] = e.content || "";
      }
    });
    setNotesDrafts(drafts);
    setNotesDirty({});
  }, [selectedMeetingId, minuteEntries.length]);

  const createEntryMutation = useMutation({
    mutationFn: (data) => base44.entities.MinuteEntry.create(data),
    onSuccess: () => qc.invalidateQueries(["ed-minute-entries"]),
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MinuteEntry.update(id, data),
    onSuccess: () => qc.invalidateQueries(["ed-minute-entries"]),
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id) => base44.entities.MinuteEntry.delete(id),
    onSuccess: () => qc.invalidateQueries(["ed-minute-entries"]),
  });

  const handleSaveNotes = (agendaItemId, text) => {
    const existing = minuteEntries.find(e => e.entry_type === "note" && e.agenda_item_id === agendaItemId);
    if (existing) {
      updateEntryMutation.mutate({ id: existing.id, data: { content: text } });
    } else {
      createEntryMutation.mutate({
        meeting_id: selectedMeetingId,
        agenda_item_id: agendaItemId,
        entry_type: "note",
        content: text,
      });
    }
    setNotesDirty(prev => ({ ...prev, [agendaItemId]: false }));
  };

  const handleNotesChange = (agendaItemId, text) => {
    setNotesDrafts(prev => ({ ...prev, [agendaItemId]: text }));
    setNotesDirty(prev => ({ ...prev, [agendaItemId]: true }));
    clearTimeout(saveTimers.current[agendaItemId]);
    saveTimers.current[agendaItemId] = setTimeout(() => {
      handleSaveNotes(agendaItemId, text);
    }, 1500);
  };

  const handleNotesKeyDown = (e, agendaItemId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const value = ta.value;
      const newValue = value.substring(0, start) + "\n• " + value.substring(end);
      handleNotesChange(agendaItemId, newValue);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 3;
      });
    }
  };

  const handleAddEntry = (agendaItemId, data) => {
    createEntryMutation.mutate({
      meeting_id: selectedMeetingId,
      agenda_item_id: agendaItemId,
      ...data,
    });
    setAddingEntryFor(null);
    toast({ title: "Entry added" });
  };

  const handleDeleteEntry = (entryId) => {
    deleteEntryMutation.mutate(entryId);
  };

  const renderEntryCard = (entry) => {
    const isMotion = entry.entry_type === "motion" || entry.entry_type === "resolution";
    const isAction = entry.entry_type === "action_item";
    return (
      <div key={entry.id} className="border rounded-lg p-2 bg-card text-xs space-y-1">
        <div className="flex items-start justify-between gap-2">
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium border", ENTRY_TYPE_COLORS[entry.entry_type] || ENTRY_TYPE_COLORS.note)}>
            {ENTRY_TYPE_LABELS[entry.entry_type] || entry.entry_type}
          </span>
          <button onClick={() => handleDeleteEntry(entry.id)} className="text-muted-foreground hover:text-destructive shrink-0">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        {entry.content && (
          <p
            className={cn(isMotion && "font-bold italic")}
            style={{
              color: isMotion
                ? entry.motion_result === "carried"
                  ? "#16a34a"
                  : entry.motion_result === "defeated"
                    ? "#dc2626"
                    : "hsl(var(--accent))"
                : "hsl(var(--accent))",
            }}
          >
            {entry.content}
          </p>
        )}
        {isMotion && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            {entry.moved_by && <span>Moved: <span className="font-medium text-foreground">{entry.moved_by}</span></span>}
            {entry.seconded_by && <span>Seconded: <span className="font-medium text-foreground">{entry.seconded_by}</span></span>}
            {entry.motion_result && (
              <span className="font-medium" style={{
                color: entry.motion_result === "carried" ? "#16a34a" : entry.motion_result === "defeated" ? "#dc2626" : undefined,
              }}>
                {entry.motion_result.charAt(0).toUpperCase() + entry.motion_result.slice(1)}
              </span>
            )}
          </div>
        )}
        {isAction && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            {entry.action_assigned_to && <span>Assigned: <span className="font-medium text-foreground">{entry.action_assigned_to}</span></span>}
            {entry.action_due_date && <span>Due: <span className="font-medium text-foreground">{format(new Date(entry.action_due_date), "MMM d")}</span></span>}
          </div>
        )}
      </div>
    );
  };

  // Build summary groups
  const summaryGroups = SUMMARY_ORDER
    .map(type => ({
      type,
      entries: minuteEntries
        .filter(e => e.entry_type === type)
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    }))
    .filter(g => g.entries.length > 0);

  if (!selectedMeetingId) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-medium">Select a meeting to take minutes</p>
        </div>
        {meetings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No meetings yet. Create one from the Meetings tab first.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {meetings.map(m => (
              <div
                key={m.id}
                onClick={() => onSelectMeeting(m.id)}
                className="p-3 rounded-lg border border-border bg-card hover:border-primary/40 cursor-pointer transition-colors"
              >
                <p className="text-sm font-medium truncate">{m.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {m.meeting_date ? format(new Date(m.meeting_date), "MMM d, h:mm a") : "No date"}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-muted-foreground">{m.meeting_type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Meeting header */}
      {selectedMeeting && (
        <div className="bg-muted/30 border border-border rounded-lg p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{selectedMeeting.title}</p>
            <select
              value={selectedMeetingId}
              onChange={e => onSelectMeeting(e.target.value)}
              className="border border-input rounded-md px-2 py-1 text-xs bg-background h-7 max-w-[180px]"
            >
              {meetings.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {selectedMeeting.meeting_date && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(selectedMeeting.meeting_date), "MMM d, h:mm a")}
              </span>
            )}
            {selectedMeeting.facilitator && <span>Facilitator: {selectedMeeting.facilitator}</span>}
          </div>
          {selectedMeeting.objectives && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              <p className="text-xs font-medium text-amber-700">Objectives:</p>
              <p className="text-xs text-amber-900">{selectedMeeting.objectives}</p>
            </div>
          )}
        </div>
      )}

      {/* Per-item minutes */}
      {sortedItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No agenda items yet. Add agenda items from the Agenda tab to take per-item minutes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item, idx) => {
            const itemEntries = (entriesByItem[item.id] || []).filter(e => e.entry_type !== "note");
            const notesText = notesDrafts[item.id] ?? "";
            return (
              <div key={item.id} className="border border-border rounded-lg overflow-hidden">
                {/* Agenda item header */}
                <div className="bg-muted/50 px-3 py-2 flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-mono w-5">{idx + 1}.</span>
                  <span className="text-sm font-medium flex-1">{item.title}</span>
                  {item.item_type && (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", TYPE_COLORS[item.item_type] || TYPE_COLORS.other)}>
                      {item.item_type?.replace(/_/g, " ")}
                    </span>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  {/* Notes textarea — red text, bullet points */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Notes</span>
                      {notesDirty[item.id] && <span className="text-[10px] text-amber-600">Saving...</span>}
                    </div>
                    <textarea
                      value={notesText}
                      onChange={e => handleNotesChange(item.id, e.target.value)}
                      onKeyDown={e => handleNotesKeyDown(e, item.id)}
                      onBlur={() => {
                        if (notesDirty[item.id]) handleSaveNotes(item.id, notesText);
                      }}
                      rows={2}
                      className="w-full border border-input rounded-md px-2 py-1.5 text-xs bg-background resize-y text-red-600"
                      placeholder="• Type notes here..."
                    />
                  </div>

                  {/* Existing structured entries */}
                  {itemEntries.length > 0 && (
                    <div className="space-y-1.5">
                      {itemEntries.map(renderEntryCard)}
                    </div>
                  )}

                  {/* Add entry dropdown / form */}
                  {addingEntryFor === item.id ? (
                    <MinuteEntryForm
                      onSave={(data) => handleAddEntry(item.id, data)}
                      onCancel={() => setAddingEntryFor(null)}
                    />
                  ) : (
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddingEntryFor(item.id)}
                        className="w-full h-7 text-xs gap-1 border-dashed"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Entry
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary section at bottom */}
      {summaryGroups.length > 0 && (
        <div className="border-t-2 border-border pt-4 space-y-3">
          <p className="text-sm font-heading font-bold">Summary</p>
          {summaryGroups.map(group => (
            <div key={group.type}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded border", ENTRY_TYPE_COLORS[group.type])}>
                  {ENTRY_TYPE_LABELS[group.type]}s
                </span>
                <span className="text-[10px] text-muted-foreground">({group.entries.length})</span>
              </div>
              <div className="space-y-1.5 pl-2">
                {group.entries.map(renderEntryCard)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}