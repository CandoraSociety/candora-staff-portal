import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, FolderKanban, Target, BarChart2, Clock, StickyNote } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isAfter, parseISO, addDays } from "date-fns";

// Dashboard widgets — same components as main dashboard (shared data)
import AnnouncementsWidget from "@/components/dashboard/AnnouncementsWidget";
import HowToSearch from "@/components/howto/HowToSearch";
import GoogleTranslateWidget from "@/components/dashboard/GoogleTranslateWidget";
import RecentActivityWidget from "@/components/dashboard/RecentActivityWidget";
import EAAssistantWidget from "@/components/ed/EAAssistantWidget";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function EDDashboard() {
  const { user } = useAuth();

  const { data: projects = [] } = useQuery({ queryKey: ["ed-projects"], queryFn: () => base44.entities.EDProject.list() });
  const { data: objectives = [] } = useQuery({ queryKey: ["ed-objectives"], queryFn: () => base44.entities.EDObjective.list() });
  const { data: kpis = [] } = useQuery({ queryKey: ["ed-kpis"], queryFn: () => base44.entities.EDKPI.list() });
  const { data: notes = [] } = useQuery({ queryKey: ["ed-notes"], queryFn: () => base44.entities.EDNote.list() });

  // For widget rendering — use same tasks entity as main organizer
  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => base44.entities.Announcement.list("-created_date"),
  });

  // EA widget preferences (separate from main dashboard)
  const { data: preferences } = useQuery({
    queryKey: ["dashboardPreferences", user?.id],
    queryFn: () => base44.entities.UserDashboardPreference.filter({ user_id: user?.id }).then(d => d[0]),
    enabled: !!user?.id,
  });
  const { data: dbWidgets = [] } = useQuery({
    queryKey: ["dashboardWidgets"],
    queryFn: () => base44.entities.DashboardWidget.list(),
  });

  const edEnabled = preferences?.ed_enabled_widgets || [];
  const lockedIds = dbWidgets.filter(w => w.locked_to_dashboard).map(w => w.widget_id);
  const isOn = (id) => lockedIds.includes(id) || edEnabled.includes(id);

  const activeProjects = projects.filter(p => p.status === "active" || p.status === "planning");
  const activeObjectives = objectives.filter(o => o.status === "active");
  const recentNotes = [...notes].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)).slice(0, 4);

  const stats = [
    { label: "Projects", value: activeProjects.length, icon: FolderKanban, color: "text-purple-500", bg: "bg-purple-50", to: "/ed/projects" },
    { label: "Objectives", value: activeObjectives.length, icon: Target, color: "text-green-500", bg: "bg-green-50", to: "/ed/opsp" },
    { label: "KPIs Tracked", value: kpis.length, icon: BarChart2, color: "text-amber-500", bg: "bg-amber-50", to: "/ed/kpis" },
    { label: "Notes", value: notes.length, icon: StickyNote, color: "text-rose-500", bg: "bg-rose-50", to: "/ed/notes" },
  ];

  const userAnnouncements = announcements.filter(a => {
    if (!a.is_active) return false;
    if (a.expires_at && new Date(a.expires_at) < new Date()) return false;
    if (a.target_roles && a.target_roles.length > 0) return a.target_roles.includes(user?.role);
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">{greeting()}, {user?.full_name?.split(" ")[0] || "Director"} 👋</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* EA Assistant Widget */}
      <EAAssistantWidget />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, to }) => (
          <Link key={label} to={to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Project Progress + Recent Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-purple-500" /> Project Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeProjects.length === 0 && <p className="text-sm text-muted-foreground">No active projects.</p>}
            {activeProjects.slice(0, 5).map(p => (
              <div key={p.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium truncate flex-1">{p.name}</span>
                  <span className="text-muted-foreground ml-2">{p.progress_percent || 0}%</span>
                </div>
                <Progress value={p.progress_percent || 0} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-500" /> Recent Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentNotes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
            {recentNotes.map(n => (
              <div key={n.id} className="p-2 rounded-lg bg-muted/40">
                <p className="text-sm font-medium truncate">{n.title}</p>
                <p className="text-xs text-muted-foreground truncate">{n.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Optional widgets from main dashboard (shared data) */}
      {(isOn("howto") || isOn("google_translate") || isOn("announcements") || isOn("recent_activity")) && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dashboard Widgets</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {isOn("howto") && <HowToSearch user={user} />}
              {isOn("google_translate") && <GoogleTranslateWidget />}
              {isOn("recent_activity") && <RecentActivityWidget />}
            </div>
            <div>
              {isOn("announcements") && <AnnouncementsWidget announcements={userAnnouncements} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}