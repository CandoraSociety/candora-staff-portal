import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, Target, FolderKanban, TrendingUp, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function EventsMgrDashboard() {
  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: () => base44.entities.Event.list(),
  });

  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: () => base44.entities.Program.list(),
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: contacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list(),
  });

  const stats = [
    {
      title: "Total Events",
      value: events?.length || 0,
      icon: Calendar,
      href: "/eventsmgr/events",
      color: "bg-primary",
    },
    {
      title: "Active Programs",
      value: programs?.filter((p) => p.status === "active").length || 0,
      icon: Target,
      href: "/eventsmgr/programs",
      color: "bg-success",
    },
    {
      title: "In Progress Projects",
      value: projects?.filter((p) => p.status === "in_progress").length || 0,
      icon: FolderKanban,
      href: "/eventsmgr/projects",
      color: "bg-accent",
    },
    {
      title: "Total Contacts",
      value: contacts?.length || 0,
      icon: Users,
      href: "/eventsmgr/contacts",
      color: "bg-chart-3",
    },
  ];

  const upcomingEvents = events
    ?.filter((e) => new Date(e.start_date) > new Date())
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 5) || [];

  const activeProjects = projects?.filter((p) => p.status === "in_progress").slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your events, programs, and projects</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} to={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Next 5 scheduled events</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/eventsmgr/events/${event.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-sm">{event.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.start_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      event.status === "confirmed" ? "bg-success/10 text-success" :
                      event.status === "planning" ? "bg-warning/10 text-warning" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {event.status.replace("_", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
            <CardDescription>Currently in progress</CardDescription>
          </CardHeader>
          <CardContent>
            {activeProjects.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active projects</p>
            ) : (
              <div className="space-y-3">
                {activeProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/eventsmgr/projects/${project.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-sm">{project.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {project.priority ? `${project.priority} priority` : "No priority set"}
                      </p>
                    </div>
                    <div className="text-right">
                      {project.progress_percent !== undefined && (
                        <div className="text-xs font-medium">{project.progress_percent}%</div>
                      )}
                      <div className="w-20 h-2 bg-muted rounded-full mt-1">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${project.progress_percent || 0}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Create new items quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/eventsmgr/events/new"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors"
            >
              <div className="bg-primary/10 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">New Event</h4>
                <p className="text-xs text-muted-foreground">Create event</p>
              </div>
            </Link>
            <Link
              to="/eventsmgr/programs/new"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors"
            >
              <div className="bg-success/10 p-2 rounded-lg">
                <Target className="h-5 w-5 text-success" />
              </div>
              <div>
                <h4 className="font-medium text-sm">New Program</h4>
                <p className="text-xs text-muted-foreground">Design program</p>
              </div>
            </Link>
            <Link
              to="/eventsmgr/projects/new"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors"
            >
              <div className="bg-accent/10 p-2 rounded-lg">
                <FolderKanban className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h4 className="font-medium text-sm">New Project</h4>
                <p className="text-xs text-muted-foreground">Start project</p>
              </div>
            </Link>
            <Link
              to="/eventsmgr/contacts/new"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors"
            >
              <div className="bg-chart-3/10 p-2 rounded-lg">
                <Users className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <h4 className="font-medium text-sm">New Contact</h4>
                <p className="text-xs text-muted-foreground">Add contact</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}