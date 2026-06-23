import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { FileText, Save, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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

export default function MinutesTab({ selectedMeetingId, onSelectMeeting }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [minutes, setMinutes] = useState("");
  const [dirty, setDirty] = useState(false);
  const saveTimer = useRef(null);

  const { data: meetings = [] } = useQuery({
    queryKey: ["ed-meetings"],
    queryFn: () => base44.entities.EDMeeting.list("-meeting_date"),
  });

  const { data: agendaItems = [] } = useQuery({
    queryKey: ["ed-agenda-items", selectedMeetingId],
    queryFn: () => selectedMeetingId ? base44.entities.EDAgendaItem.filter({ meeting_id: selectedMeetingId }) : [],
    enabled: !!selectedMeetingId,
  });

  const sortedItems = [...agendaItems].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);

  useEffect(() => {
    setMinutes(selectedMeeting?.minutes_notes || "");
    setDirty(false);
  }, [selectedMeetingId, selectedMeeting?.minutes_notes]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EDMeeting.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries(["ed-meetings"]);
      setDirty(false);
    },
  });

  const handleSave = () => {
    if (!selectedMeetingId) return;
    updateMutation.mutate({ id: selectedMeetingId, data: { minutes_notes: minutes } });
    toast({ title: "Minutes saved" });
  };

  // Auto-save after 2s of inactivity
  useEffect(() => {
    if (!dirty || !selectedMeetingId) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateMutation.mutate({ id: selectedMeetingId, data: { minutes_notes: minutes } });
    }, 2000);
    return () => clearTimeout(saveTimer.current);
  }, [minutes, dirty, selectedMeetingId]);

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
    <div>
      {selectedMeeting && (
        <div className="bg-muted/30 border border-border rounded-lg p-3 mb-3">
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

      {sortedItems.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Agenda</p>
          <div className="space-y-1">
            {sortedItems.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-4 text-right">{idx + 1}.</span>
                <span className="font-medium">{item.title}</span>
                {item.item_type && (
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", TYPE_COLORS[item.item_type] || TYPE_COLORS.other)}>
                    {item.item_type?.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Minutes</p>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-amber-600">Unsaved...</span>}
          <Button size="sm" variant="outline" onClick={handleSave} disabled={updateMutation.isPending || !dirty} className="gap-1.5 h-7 text-xs">
            <Save className="w-3.5 h-3.5" /> Save
          </Button>
        </div>
      </div>
      <textarea
        value={minutes}
        onChange={e => { setMinutes(e.target.value); setDirty(true); }}
        rows={12}
        className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-y"
        placeholder="Take meeting minutes here... Notes are auto-saved as you type."
      />
    </div>
  );
}