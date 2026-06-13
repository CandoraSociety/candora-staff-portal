import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, FolderKanban, Target, BarChart2, Clock, StickyNote } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isAfter, parseISO, addDays } from "date-fns";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function EDDashboard() {
  const { user } = useAuth();

  const { data: tasks = [] } = useQuery({ queryKey: ["ed-tasks"], queryFn: () => base44.entities.EDTask.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["ed-projects"], queryFn: () => base44.entities.EDProject.list() });
  const { data: objectives = [] } = useQuery({ queryKey: ["ed-objectives"], queryFn: () => base44.entities.EDObjective.list() });
  const { data: kpis = [] } = useQuery({ queryKey: ["ed-kpis"], queryFn: () => base44.entities.EDKPI.list() });
  const { data: notes = [] } = useQuery({ queryKey: ["ed-notes"], queryFn: () => base44.entities.EDNote.list() });

  const activeTasks = tasks.filter(t => t.status === "in_progress" || t.status === "not_started");
  const activeProjects = projects.filter(p => p.status === "active" || p.status === "planning");
  const activeObjectives = objectives.filter(o => o.status === "active");
  const upcomingTasks = activeTasks
    .filter(t => t.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);
  const recentNotes = [...notes].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)).slice(0, 4);

  const stats = [
    { label: "Active Tasks", value: activeTasks.length, icon: CheckSquare, color: "text-blue-500", bg: "bg-blue-50", to: "/ed/tasks" },
    { label: "Projects", value: activeProjects.length, icon: FolderKanban, color: "text-purple-500", bg: "bg-purple-50", to: "/ed/projects" },
    { label: "Objectives", value: activeObjectives.length, icon: Target, color: "text-green-500", bg: "bg-green-50", to: "/ed/opsp" },
    { label: "KPIs Tracked", value: kpis.length, icon: BarChart2, color: "text-amber-500", bg: "bg-amber-50", to: "/ed/kpis" },
  ];

  const priorityColor = { critical: "destructive", high: "default", medium: "secondary", low: "outline" };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">{greeting()}, {user?.full_name?.split(" ")[0] || "Director"} 👋</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingTasks.length === 0 && <p className="text-sm text-muted-foreground">No upcoming tasks.</p>}
            {upcomingTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40">
                <span className="text-sm truncate flex-1">{task.title}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={priorityColor[task.priority] || "outline"} className="text-xs">{task.priority}</Badge>
                  {task.due_date && <span className="text-xs text-muted-foreground">{format(parseISO(task.due_date), "MMM d")}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-purple-500" /> Project Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeProjects.length === 0 && <p className="text-sm text-muted-foreground">No active projects.</p>}
            {activeProjects.slice(0, 4).map(p => (
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

        {/* Time Horizon Snapshot */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Time Horizon Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {["This Week", "This Month", "This Quarter"].map((label, i) => {
              const days = [7, 30, 90][i];
              const horizon = addDays(new Date(), days);
              const count = activeTasks.filter(t => t.due_date && isAfter(horizon, parseISO(t.due_date))).length;
              return (
                <div key={label} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                  <span className="text-sm">{label}</span>
                  <Badge variant="secondary">{count} tasks due</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Notes */}
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
    </div>
  );
}