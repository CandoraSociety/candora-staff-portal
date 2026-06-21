import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Calendar, Clock, MapPin, Trash2 } from "lucide-react";
import { format } from "date-fns";
import BoardNewMeetingModal from "@/components/board/BoardNewMeetingModal";

const statusColors = {
  upcoming: "bg-blue-100 text-blue-700",
  in_progress: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

export default function BoardMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    const data = await base44.entities.Meeting.list("-meeting_date");
    setMeetings(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this meeting?")) return;
    await base44.entities.Meeting.delete(id);
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  const grouped = meetings.reduce((acc, m) => {
    const s = m.status || "upcoming";
    if (!acc[s]) acc[s] = [];
    acc[s].push(m);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Meetings</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule and manage board meetings</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
          <Plus size={16} /> New Meeting
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-8">
          {["in_progress", "upcoming", "completed", "cancelled"].map(status => {
            const group = grouped[status];
            if (!group?.length) return null;
            return (
              <div key={status}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{status.replace(/_/g, " ")}</h2>
                <div className="space-y-3">
                  {group.map(meeting => (
                    <div key={meeting.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">{meeting.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[meeting.status]}`}>{meeting.status?.replace(/_/g, " ")}</span>
                            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{meeting.meeting_type}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Calendar size={13} />{format(new Date(meeting.meeting_date), "MMMM d, yyyy")}</span>
                            <span className="flex items-center gap-1"><Clock size={13} />{format(new Date(meeting.meeting_date), "h:mm a")}</span>
                            {meeting.location && <span className="flex items-center gap-1"><MapPin size={13} />{meeting.location}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link to={`/board/meetings/${meeting.id}/agenda`} className="text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition text-foreground">Agenda</Link>
                          <Link to={`/board/meetings/${meeting.id}/minutes`} className="text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition text-foreground">Minutes</Link>
                          <button onClick={() => handleDelete(meeting.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {meetings.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No meetings yet</p>
            </div>
          )}
        </div>
      )}
      {showNew && (
        <BoardNewMeetingModal
          onClose={() => setShowNew(false)}
          onSaved={(m) => { setMeetings(prev => [m, ...prev]); setShowNew(false); }}
        />
      )}
    </div>
  );
}