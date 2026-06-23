import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Plus, Trash2, Pencil, X, Calendar, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const MEETING_TYPES = ["Staff Meeting", "Leadership Team", "1-on-1", "Board Meeting", "External/Partner", "All-Hands", "Committee", "Other"];

const STATUS_BADGE = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

function toLocalInput(date) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EMPTY_FORM = {
  title: "", meeting_date: "", location: "", meeting_type: "Staff Meeting",
  facilitator: "", attendees: "", objectives: "", notes: "",
};

export default function MeetingListTab({ selectedMeetingId, onSelectMeeting, onSwitchToAgenda }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["ed-meetings"],
    queryFn: () => base44.entities.EDMeeting.list("-meeting_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EDMeeting.create(data),
    onSuccess: (created) => {
      qc.invalidateQueries(["ed-meetings"]);
      onSelectMeeting(created.id);
      setShowForm(false);
      toast({ title: "Meeting created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EDMeeting.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries(["ed-meetings"]);
      setShowForm(false);
      setEditingId(null);
      toast({ title: "Meeting updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EDMeeting.delete(id),
    onSuccess: () => qc.invalidateQueries(["ed-meetings"]),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      meeting_date: new Date(form.meeting_date).toISOString(),
      location: form.location || undefined,
      meeting_type: form.meeting_type,
      facilitator: form.facilitator || undefined,
      attendees: form.attendees ? form.attendees.split(",").map(s => s.trim()).filter(Boolean) : [],
      objectives: form.objectives || undefined,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate({ ...payload, status: "draft" });
    }
    setForm(EMPTY_FORM);
  };

  const handleEdit = (meeting) => {
    setEditingId(meeting.id);
    setForm({
      title: meeting.title || "",
      meeting_date: meeting.meeting_date ? toLocalInput(meeting.meeting_date) : "",
      location: meeting.location || "",
      meeting_type: meeting.meeting_type || "Staff Meeting",
      facilitator: meeting.facilitator || "",
      attendees: meeting.attendees?.length ? meeting.attendees.join(", ") : "",
      objectives: meeting.objectives || "",
      notes: meeting.notes || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">{meetings.length} meetings</p>
        <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(!showForm); }} className="gap-1.5 h-7 text-xs">
          <Plus className="w-3.5 h-3.5" /> New Meeting
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-muted/30 border border-border rounded-lg p-3 mb-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{editingId ? "Edit" : "New"} Meeting</span>
            <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
          <Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-8 text-sm" placeholder="Meeting title" />
          <Input required type="datetime-local" value={form.meeting_date} onChange={e => setForm({ ...form, meeting_date: e.target.value })} className="h-8 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.meeting_type} onChange={e => setForm({ ...form, meeting_type: e.target.value })} className="border border-input rounded-md px-2 py-1.5 text-sm bg-background h-8">
              {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="h-8 text-sm" placeholder="Location / Link" />
          </div>
          <Input value={form.facilitator} onChange={e => setForm({ ...form, facilitator: e.target.value })} className="h-8 text-sm" placeholder="Facilitator" />
          <Input value={form.attendees} onChange={e => setForm({ ...form, attendees: e.target.value })} className="h-8 text-sm" placeholder="Attendees (comma-separated)" />
          <Input value={form.objectives} onChange={e => setForm({ ...form, objectives: e.target.value })} className="h-8 text-sm" placeholder="Objectives — what to achieve" />
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none" placeholder="Pre-meeting notes / prep" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={resetForm}>Cancel</Button>
            <Button type="submit" size="sm" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingId ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {isLoading && <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>}
        {meetings.length === 0 && !isLoading && !showForm && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No meetings yet. Click "New Meeting" to create one.</p>
          </div>
        )}
        {meetings.map(m => (
          <div
            key={m.id}
            onClick={() => onSelectMeeting(m.id)}
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-colors group",
              selectedMeetingId === m.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
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
                  onClick={(e) => { e.stopPropagation(); onSelectMeeting(m.id); onSwitchToAgenda(); }}
                  className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-primary p-1"
                  title="Build agenda"
                >
                  <ListChecks className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(m); }}
                  className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-primary p-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm("Delete this meeting?")) deleteMutation.mutate(m.id); }}
                  className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}