import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FolderKanban, Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const statusColors = {
  planning: "bg-warning/10 text-warning",
  in_progress: "bg-primary/10 text-primary",
  on_hold: "bg-muted text-muted-foreground",
  completed: "bg-success/10 text-success",
  archived: "bg-accent/10 text-accent-foreground",
};

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function EventsMgrProjects() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const filteredProjects = projects?.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Projects</h1>
          <p className="text-muted-foreground">Track and manage projects</p>
        </div>
        <Link to="/eventsmgr/projects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="all">All Status</option>
          <option value="planning">Planning</option>
          <option value="in_progress">In Progress</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredProjects?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No projects found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects?.map((project) => (
            <Link key={project.id} to={`/eventsmgr/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <div className="flex gap-1">
                      {project.priority && (
                        <Badge className={priorityColors[project.priority] || "bg-muted"}>
                          {project.priority}
                        </Badge>
                      )}
                      <Badge className={statusColors[project.status] || "bg-muted"}>
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  )}
                  {project.progress_percent !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{project.progress_percent}%</span>
                      </div>
                      <Progress value={project.progress_percent} className="h-2" />
                    </div>
                  )}
                  {project.start_date && (
                    <div className="text-xs text-muted-foreground">
                      <strong>Start:</strong> {new Date(project.start_date).toLocaleDateString()}
                      {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                    </div>
                  )}
                  {project.budget && (
                    <div className="text-xs text-muted-foreground">
                      <strong>Budget:</strong> ${project.budget.toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}