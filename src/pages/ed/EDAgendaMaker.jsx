import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Plus, Trash2, ChevronUp, ChevronDown, Calendar, Clock, Users, X, ListChecks, FileText, Eye, LayoutTemplate, StickyNote, Pencil, PencilLine, Lightbulb, X as XIcon } from "lucide-react";
import AgendaPreviewDialog from "@/components/ed/AgendaPreviewDialog";
import ActivitySuggestionsPanel from "@/components/shared/ActivitySuggestionsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useOrgSettings } from "@/lib/useOrgSettings";

const MEETING_TYPES = ["Staff Meeting", "Leadership Team", "1-on-1", "Board Meeting", "External/Partner", "All-Hands", "Committee", "Other"];
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

const STATUS_BADGE = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const AGENDA_TEMPLATES = {
  "Formal Board Meeting": [
    { title: "Call to Order", item_type: "opening", duration_minutes: 5 },
    { title: "Roll Call", item_type: "opening", duration_minutes: 5 },
    { title: "Approval of Agenda", item_type: "decision", duration_minutes: 10 },
    { title: "Approval of Previous Minutes", item_type: "decision", duration_minutes: 10 },
    { title: "Business Arising from Minutes", item_type: "review", duration_minutes: 15 },
    { title: "Chairperson's Report", item_type: "presentation", duration_minutes: 10 },
    { title: "Treasurer's Report", item_type: "presentation", duration_minutes: 15 },
    { title: "New Business", item_type: "discussion", duration_minutes: 20 },
    { title: "Adjournment", item_type: "closing", duration_minutes: 5 },
  ],
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
    { title: "Feedback (both ways)", item_type: "discussion", duration_minutes: 10 },
    { title: "Action Items", item_type: "action_item", duration_minutes: 5 },
  ],
  "Leadership Team": [
    { title: "Strategic Priority Updates", item_type: "update", duration_minutes: 20 },
    { title: "Financial Review", item_type: "presentation", duration_minutes: 15 },
    { title: "Operations Report", item_type: "presentation", duration_minutes: 15 },
    { title: "HR & Staffing Updates", item_type: "update", duration_minutes: 10 },
    { title: "Strategic Decisions", item_type: "decision", duration_minutes: 20 },
    { title: "Open Discussion", item_type: "discussion", duration_minutes: 15 },
  ],
};

function toLocalInput(date) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EDAgendaMaker() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [showRibbon, setShowRibbon] = useState(() => localStorage.getItem("ed_agenda_ribbon_dismissed") !== "true");

  const dismissRibbon = () => {
    setShowRibbon(false);
    localStorage.setItem("ed_agenda_ribbon_dismissed", "true");
  };

  const [meetingForm, setMeetingForm] = useState({
    title: "",
    meeting_date: "",
    location: "",
    meeting_type: "Staff Meeting",
    facilitator: "",
    attendees: "",
    notes: "",
  });

  const [itemForm, setItemForm] = useState({
    title: "",
    item_type: "",
    presenter: "",
    duration_minutes: "",
    description: "",
    facilitator_notes: "",
  });

  // Fetch meetings
  const { data: meetings = [], isLoading: loadingMeetings } = useQuery({
    queryKey: ["ed-meetings"],
    queryFn: () => base44.entities.EDMeeting.list("-meeting_date"),
  });

  // Auto-select first meeting when list loads
  useEffect(() => {
    if (meetings.length > 0 && !selectedMeetingId) setSelectedMeetingId(meetings[0].id);
  }, [meetings, selectedMeetingId]);

  // Fetch agenda items for selected meeting
  const { data: agendaItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ["ed-agenda-items", selectedMeetingId],
    queryFn: () => selectedMeetingId ? base44.entities.EDAgendaItem.filter({ meeting_id: selectedMeetingId }) : [],
    enabled: !!selectedMeetingId,
  });

  const sortedItems = [...agendaItems].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId);

  const { logoUrl, orgName } = useOrgSettings();

  // Auto-show item form when selecting a meeting with no agenda items
  useEffect(() => {
    if (selectedMeetingId && !loadingItems && sortedItems.length === 0) {
      setShowItemForm(true);
    }
  }, [selectedMeetingId, loadingItems, sortedItems.length]);

  // Mutations
  const createMeeting = useMutation({
    mutationFn: (data) => base44.entities.EDMeeting.create(data),
    onSuccess: (created) => {
      qc.invalidateQueries(["ed-meetings"]);
      setSelectedMeetingId(created.id);
      setShowMeetingForm(false);
      toast({ title: "Meeting created", description: created.title });
    },
    onError: (err) => {
      toast({ title: "Failed to create meeting", description: err?.message || "Unknown error", variant: "destructive" });
    },
  });

  const deleteMeeting = useMutation({
    mutationFn: (id) => base44.entities.EDMeeting.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(["ed-meetings"]);
      qc.invalidateQueries(["ed-agenda-items"]);
      setSelectedMeetingId(null);
    },
  });

  const updateMeeting = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EDMeeting.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries(["ed-meetings"]);
      setShowMeetingForm(false);
      setEditingMeetingId(null);
      toast({ title: "Meeting updated" });
    },
    onError: (err) => {
      toast({ title: "Failed to update meeting", description: err?.message || "Unknown error", variant: "destructive" });
    },
  });

  const createItem = useMutation({
    mutationFn: (data) => base44.entities.EDAgendaItem.create(data),
    onSuccess: () => {
      qc.invalidateQueries(["ed-agenda-items", selectedMeetingId]);
      setShowItemForm(false);
      toast({ title: "Agenda item added" });
    },
    onError: (err) => {
      toast({ title: "Failed to add agenda item", description: err?.message || "Unknown error", variant: "destructive" });
    },
  });

  const deleteItem = useMutation({
    mutationFn: (id) => base44.entities.EDAgendaItem.delete(id),
    onSuccess: () => qc.invalidateQueries(["ed-agenda-items", selectedMeetingId]),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EDAgendaItem.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries(["ed-agenda-items", selectedMeetingId]);
      setShowItemForm(false);
      setEditingItemId(null);
      toast({ title: "Agenda item updated" });
    },
    onError: (err) => {
      toast({ title: "Failed to update agenda item", description: err?.message || "Unknown error", variant: "destructive" });
    },
  });

  const moveItem = useMutation({
    mutationFn: async ({ items }) => {
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
        template.map((item, i) => ({
          ...item,
          meeting_id: selectedMeetingId,
          order_index: startIdx + i,
        }))
      );
    },
    onSuccess: () => {
      qc.invalidateQueries(["ed-agenda-items", selectedMeetingId]);
      toast({ title: "Template applied", description: "Agenda items added from template" });
    },
    onError: (err) => {
      toast({ title: "Failed to apply template", description: err?.message || "Unknown error", variant: "destructive" });
    },
  });

  const handleCreateMeeting = (e) => {
    e.preventDefault();
    const payload = {
      title: meetingForm.title,
      meeting_date: new Date(meetingForm.meeting_date).toISOString(),
      location: meetingForm.location || undefined,
      meeting_type: meetingForm.meeting_type,
      facilitator: meetingForm.facilitator || undefined,
      attendees: meetingForm.attendees ? meetingForm.attendees.split(",").map((s) => s.trim()).filter(Boolean) : [],
      notes: meetingForm.notes || undefined,
    };
    if (editingMeetingId) {
      updateMeeting.mutate({ id: editingMeetingId, data: payload });
    } else {
      createMeeting.mutate({ ...payload, status: "draft" });
    }
    setMeetingForm({ title: "", meeting_date: "", location: "", meeting_type: "Staff Meeting", facilitator: "", attendees: "", notes: "" });
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeetingId(meeting.id);
    setMeetingForm({
      title: meeting.title || "",
      meeting_date: meeting.meeting_date ? toLocalInput(meeting.meeting_date) : "",
      location: meeting.location || "",
      meeting_type: meeting.meeting_type || "Staff Meeting",
      facilitator: meeting.facilitator || "",
      attendees: meeting.attendees?.length ? meeting.attendees.join(", ") : "",
      notes: meeting.notes || "",
    });
    setShowMeetingForm(true);
  };

  const handleCancelMeetingForm = () => {
    setShowMeetingForm(false);
    setEditingMeetingId(null);
    setMeetingForm({ title: "", meeting_date: "", location: "", meeting_type: "Staff Meeting", facilitator: "", attendees: "", notes: "" });
  };

  const handleAddItem = (e) => {
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
    setItemForm({ title: "", item_type: "", presenter: "", duration_minutes: "", description: "", facilitator_notes: "" });
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setItemForm({
      title: item.title || "",
      item_type: item.item_type || "",
      presenter: item.presenter || "",
      duration_minutes: item.duration_minutes ?? "",
      description: item.description || "",
      facilitator_notes: item.facilitator_notes || "",
    });
    setShowItemForm(true);
  };

  const handleCancelItemForm = () => {
    setShowItemForm(false);
    setEditingItemId(null);
    setItemForm({ title: "", item_type: "", presenter: "", duration_minutes: "", description: "", facilitator_notes: "" });
  };

  const handleAddSuggestion = (suggestion) => {
    createItem.mutate({
      title: suggestion.title,
      item_type: suggestion.suggestion_type || "update",
      description: suggestion.description || "",
      meeting_id: selectedMeetingId,
      order_index: sortedItems.length,
    });
    toast({ title: "Added from suggestions", description: suggestion.title });
  };

  const handleMove = (index, direction) => {
    const newItems = [...sortedItems];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    const reordered = newItems.map((item, i) => ({ ...item, order_index: i }));
    moveItem.mutate({ items: reordered });
  };

  const totalDuration = sortedItems.reduce((s, i) => s + (i.duration_minutes || 0), 0);

  const handleDeleteMeeting = (id) => {
    if (confirm("Delete this meeting and all its agenda items?")) {
      deleteMeeting.mutate(id);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Reminder Ribbon */}
      {showRibbon && (
        <div className="mb-4 no-print bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-orange-500/10 border border-amber-300/40 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-400/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Reminder: Build a Meeting Manager module</p>
            <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
              Consider creating a dedicated <strong>Meeting Manager</strong> in another portal (or as a dashboard widget) that includes: this agenda maker, automatic agenda &amp; meeting notices on attendee dashboards, a minute-taking function tied to the agenda, a personal notes section, and Outlook/calendar integration.
            </p>
          </div>
          <button onClick={dismissRibbon} className="flex-shrink-0 text-amber-700/60 hover:text-amber-900 transition mt-0.5">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 no-print">
        <div className="flex items-center gap-2 mb-1">
          <ListChecks className="w-6 h-6 text-primary" />
          <h1 className="font-heading text-2xl font-bold">Meeting Agenda Maker</h1>
        </div>
        <p className="text-sm text-muted-foreground">Create meetings and build structured agendas with time tracking.</p>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        {/* Meeting List Sidebar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Meetings</h2>
            <Button size="sm" onClick={() => { setEditingMeetingId(null); setMeetingForm({ title: "", meeting_date: "", location: "", meeting_type: "Staff Meeting", facilitator: "", attendees: "", notes: "" }); setShowMeetingForm(!showMeetingForm); }} className="gap-1.5 h-7 text-xs">
              <Plus className="w-3.5 h-3.5" /> New
            </Button>
          </div>

          {showMeetingForm && (
            <form onSubmit={handleCreateMeeting} className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{editingMeetingId ? "Edit Meeting" : "New Meeting"}</span>
                <button type="button" onClick={handleCancelMeetingForm} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Title *</label>
                <Input required value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} className="h-8 text-sm" placeholder="Weekly Staff Check-in" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Date & Time *</label>
                <Input required type="datetime-local" value={meetingForm.meeting_date} onChange={(e) => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Type</label>
                <select value={meetingForm.meeting_type} onChange={(e) => setMeetingForm({ ...meetingForm, meeting_type: e.target.value })} className="w-full border border-input rounded-lg px-2 py-1.5 text-sm bg-background h-8">
                  {MEETING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Location / Link</label>
                <Input value={meetingForm.location} onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })} className="h-8 text-sm" placeholder="Boardroom / Zoom" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Facilitator</label>
                <Input value={meetingForm.facilitator} onChange={(e) => setMeetingForm({ ...meetingForm, facilitator: e.target.value })} className="h-8 text-sm" placeholder="Name" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Attendees (comma-separated)</label>
                <Input value={meetingForm.attendees} onChange={(e) => setMeetingForm({ ...meetingForm, attendees: e.target.value })} className="h-8 text-sm" placeholder="Jane, John, Sarah" />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={handleCancelMeetingForm}>Cancel</Button>
                <Button type="submit" size="sm" className="flex-1" disabled={createMeeting.isPending || updateMeeting.isPending}>{(createMeeting.isPending || updateMeeting.isPending) ? "Saving..." : editingMeetingId ? "Save Changes" : "Create"}</Button>
              </div>
            </form>
          )}

          <div className="space-y-1.5">
            {loadingMeetings && <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>}
            {meetings.length === 0 && !loadingMeetings && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No meetings yet. Click "New" to create one.</p>
              </div>
            )}
            {meetings.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMeetingId(m.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors group",
                  selectedMeetingId === m.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.meeting_date ? format(new Date(m.meeting_date), "MMM d, h:mm a") : "No date"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", STATUS_BADGE[m.status] || STATUS_BADGE.draft)}>
                        {m.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{m.meeting_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditMeeting(m); }}
                      className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-primary"
                    >
                      <PencilLine className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteMeeting(m.id); }}
                      className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Agenda Builder */}
        <div>
          {!selectedMeeting ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                {selectedMeetingId ? (
                  <>
                    <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">Loading meeting...</p>
                  </>
                ) : (
                  <>
                    <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Select a meeting from the left to build its agenda.</p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div>
              {/* Candora Branded Header */}
              <div className="bg-accent text-accent-foreground rounded-xl p-5 mb-4 flex items-center gap-4 no-print">
                <img src={logoUrl} alt={orgName} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h1 className="font-heading text-xl font-bold truncate">{orgName}</h1>
                  <p className="text-sm opacity-80">Meeting Agenda</p>
                </div>
                <button onClick={() => setShowPreview(true)} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition">
                  <Eye className="w-4 h-4" /> Preview
                </button>
              </div>

              {/* Meeting header */}
              <div className="bg-card border border-border rounded-xl p-5 mb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-heading text-xl font-semibold">{selectedMeeting.title}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      {selectedMeeting.meeting_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(selectedMeeting.meeting_date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                        </span>
                      )}
                      {selectedMeeting.location && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selectedMeeting.location}</span>}
                    </div>
                    {selectedMeeting.facilitator && (
                      <p className="text-xs text-muted-foreground mt-1">Facilitator: {selectedMeeting.facilitator}</p>
                    )}
                    {selectedMeeting.attendees?.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {selectedMeeting.attendees.map((a, i) => (
                            <span key={i} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={cn("text-xs px-2 py-1 rounded font-medium shrink-0", STATUS_BADGE[selectedMeeting.status] || STATUS_BADGE.draft)}>
                    {selectedMeeting.status}
                  </span>
                </div>
              </div>

              {/* Agenda summary + add button */}
              <div className="flex items-center justify-between mb-3 no-print">
                <p className="text-sm text-muted-foreground">
                  {sortedItems.length} items · {Math.floor(totalDuration / 60)}h {totalDuration % 60}m total
                </p>
                <Button size="sm" onClick={() => { setEditingItemId(null); setItemForm({ title: "", item_type: "", presenter: "", duration_minutes: "", description: "", facilitator_notes: "" }); setShowItemForm(!showItemForm); }} className="gap-1.5">
                  <Plus className="w-4 h-4" /> Add Agenda Item
                </Button>
              </div>

              {/* Template selector — shown when no agenda items exist */}
              {sortedItems.length === 0 && !showItemForm && (
                <div className="bg-muted/50 border border-dashed border-border rounded-xl p-4 mb-4 no-print">
                  <p className="text-xs font-medium text-muted-foreground mb-2.5 flex items-center gap-1.5">
                    <LayoutTemplate className="w-3.5 h-3.5" /> Apply a formal agenda template (optional)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(AGENDA_TEMPLATES).map((name) => (
                      <button
                        key={name}
                        onClick={() => applyTemplate.mutate(name)}
                        disabled={applyTemplate.isPending}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 transition disabled:opacity-50"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* My Activity Suggestions */}
              <div className="mb-4 no-print">
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold">My Activity Suggestions</h3>
                    <span className="text-[10px] text-muted-foreground ml-1">From your notes, tasks, projects & priorities</span>
                  </div>
                  <ActivitySuggestionsPanel onAddSuggestion={handleAddSuggestion} />
                </div>
              </div>

              {/* Add item form */}
              {showItemForm && (
                <form onSubmit={handleAddItem} className="bg-card border border-border rounded-xl p-5 mb-4 space-y-3 no-print">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{editingItemId ? "Edit Agenda Item" : "New Agenda Item"}</h3>
                    <button type="button" onClick={handleCancelItemForm} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium mb-1 block">Title *</label>
                      <Input required value={itemForm.title} onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })} placeholder="Q3 Budget Review" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Type <span className="text-muted-foreground font-normal">(optional)</span></label>
                      <select value={itemForm.item_type} onChange={(e) => setItemForm({ ...itemForm, item_type: e.target.value })} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
                        <option value="">— None —</option>
                        {ITEM_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Duration (min) <span className="text-muted-foreground font-normal">(optional)</span></label>
                      <Input type="number" min="0" value={itemForm.duration_minutes} onChange={(e) => setItemForm({ ...itemForm, duration_minutes: e.target.value })} placeholder="—" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium mb-1 block">Presenter</label>
                      <Input value={itemForm.presenter} onChange={(e) => setItemForm({ ...itemForm, presenter: e.target.value })} placeholder="Name" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium mb-1 block">Description</label>
                      <textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none" placeholder="Optional details..." />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium mb-1 block flex items-center gap-1.5">
                        <StickyNote className="w-3.5 h-3.5 text-amber-500" /> Facilitator Notes
                        <span className="text-muted-foreground font-normal">(not shown on printed agenda)</span>
                      </label>
                      <textarea value={itemForm.facilitator_notes} onChange={(e) => setItemForm({ ...itemForm, facilitator_notes: e.target.value })} rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-amber-50/50 resize-none" placeholder="Private notes for the facilitator..." />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="flex-1" onClick={handleCancelItemForm}>Cancel</Button>
                    <Button type="submit" size="sm" className="flex-1" disabled={createItem.isPending || updateItem.isPending}>{(createItem.isPending || updateItem.isPending) ? "Saving..." : editingItemId ? "Save Changes" : "Add Item"}</Button>
                  </div>
                </form>
              )}

              {/* Agenda items */}
              <div className="space-y-2">
                {loadingItems && <p className="text-sm text-muted-foreground text-center py-8">Loading agenda...</p>}
                {sortedItems.map((item, idx) => (
                  <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 group print:break-inside-avoid">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => handleMove(idx, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleMove(idx, 1)} disabled={idx === sortedItems.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground w-5 text-right font-medium">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.item_type && (
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", TYPE_COLORS[item.item_type] || TYPE_COLORS.other)}>
                            {item.item_type?.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        {item.presenter && <span>{item.presenter}</span>}
                        {item.duration_minutes > 0 && <span>{item.duration_minutes} min</span>}
                      </div>
                      {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                      {item.facilitator_notes && (
                        <div className="mt-2 no-print bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                          <StickyNote className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-900 whitespace-pre-wrap">{item.facilitator_notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEditItem(item)} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-primary">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteItem.mutate(item.id)} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {sortedItems.length === 0 && !loadingItems && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">No agenda items yet. Click "Add Agenda Item" to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedMeeting && (
        <AgendaPreviewDialog
          meeting={selectedMeeting}
          items={sortedItems}
          open={showPreview}
          onOpenChange={setShowPreview}
        />
      )}
    </div>
  );
}