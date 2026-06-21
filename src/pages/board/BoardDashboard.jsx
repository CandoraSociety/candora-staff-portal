import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Calendar, FileText, Users, Target, Clock, ChevronRight, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function BoardDashboard() {
  const [meetings, setMeetings] = useState([]);
  const [members, setMembers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Meeting.list("-meeting_date", 10),
      base44.entities.BoardMember.filter({ status: "active" }),
      base44.entities.StrategicGoal.list(),
      base44.entities.BoardDocument.list("-created_date", 5),
    ]).then(([m, mb, g, d]) => {
      setMeetings(m); setMembers(mb); setGoals(g); setDocs(d); setLoading(false);
    });
  }, []);

  const upcomingMeetings = meetings.filter(m => m.status === "upcoming" || m.status === "in_progress");
  const nextMeeting = upcomingMeetings[0];

  const statCards = [
    { label: "Upcoming Meetings", value: upcomingMeetings.length, icon: Calendar, color: "bg-blue-50 text-blue-700", link: "/board/meetings" },
    { label: "Active Board Members", value: members.length, icon: Users, color: "bg-green-50 text-green-700", link: "/board/members" },
    { label: "Strategic Goals", value: goals.length, icon: Target, color: "bg-purple-50 text-purple-700", link: "/board/strategic-plan" },
    { label: "Documents Filed", value: docs.length, icon: FileText, color: "bg-amber-50 text-amber-700", link: "/board/documents" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-foreground">Board Dashboard</h1>
        <p className="text-muted-foreground mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}><Icon size={18} /></div>
            <p className="text-2xl font-semibold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Next Meeting */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground">Next Meeting</h2>
            <Link to="/board/meetings" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">View all <ChevronRight size={12} /></Link>
          </div>
          {nextMeeting ? (
            <div>
              <p className="font-semibold text-foreground">{nextMeeting.title}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Clock size={14} />
                <span>{format(new Date(nextMeeting.meeting_date), "EEEE, MMMM d 'at' h:mm a")}</span>
              </div>
              {nextMeeting.location && <p className="text-sm text-muted-foreground mt-1">📍 {nextMeeting.location}</p>}
              <div className="flex gap-2 mt-4">
                <Link to={`/board/meetings/${nextMeeting.id}/agenda`} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition">Build Agenda</Link>
                <Link to={`/board/meetings/${nextMeeting.id}/minutes`} className="text-xs border border-border text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition">Take Minutes</Link>
              </div>
            </div>
          ) : <p className="text-muted-foreground text-sm">No upcoming meetings scheduled.</p>}
        </div>

        {/* Strategic Goals */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground">Strategic Plan</h2>
            <Link to="/board/strategic-plan" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">View all <ChevronRight size={12} /></Link>
          </div>
          <div className="space-y-3">
            {goals.slice(0, 3).map(goal => (
              <div key={goal.id} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{goal.goal}</p>
                  <p className="text-xs text-muted-foreground">{goal.pillar}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ml-2 shrink-0 ${
                  goal.status === "completed" ? "bg-green-100 text-green-700" :
                  goal.status === "on_track" ? "bg-blue-100 text-blue-700" :
                  goal.status === "at_risk" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-600"}`}>
                  {goal.status?.replace(/_/g, " ")}
                </span>
              </div>
            ))}
            {goals.length === 0 && <p className="text-sm text-muted-foreground">No strategic goals added yet.</p>}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground">Recent Documents</h2>
            <Link to="/board/documents" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">View all <ChevronRight size={12} /></Link>
          </div>
          <div className="space-y-2">
            {docs.slice(0, 4).map(doc => (
              <div key={doc.id} className="flex items-center gap-3 py-1.5">
                <FileText size={14} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">{doc.document_type?.replace(/_/g, " ")}</p>
                </div>
              </div>
            ))}
            {docs.length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-heading font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Schedule Meeting", to: "/board/meetings", icon: Calendar },
              { label: "Upload Document", to: "/board/documents", icon: FileText },
              { label: "Add Board Member", to: "/board/members", icon: Users },
              { label: "Board Assistant", to: "/board/assistant", icon: MessageSquare },
            ].map(({ label, to, icon: Icon }) => (
              <Link key={label} to={to} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted transition text-sm text-foreground">
                <Icon size={15} className="text-muted-foreground" />{label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}