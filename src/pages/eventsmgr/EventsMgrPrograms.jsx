import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Target, Plus, Search, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useItemVisibility } from "@/lib/useItemVisibility";

const statusColors = {
  planning: "bg-warning/10 text-warning",
  active: "bg-success/10 text-success",
  paused: "bg-muted text-muted-foreground",
  archived: "bg-accent/10 text-accent-foreground",
};

const categoryIcons = {
  adult_learning: "📚",
  community_services: "🤝",
  youth_programs: "👥",
  health_wellness: "💚",
  other: "📋",
};

export default function EventsMgrPrograms() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { isAdmin, filterVisible } = useItemVisibility();

  const { data: programs, isLoading } = useQuery({
    queryKey: ["programs"],
    queryFn: () => base44.entities.Program.list(),
  });

  const visiblePrograms = filterVisible(programs);

  const filteredPrograms = visiblePrograms?.filter((program) => {
    const matchesSearch = program.name.toLowerCase().includes(search.toLowerCase()) ||
      program.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || program.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Programs</h1>
          <p className="text-muted-foreground">Manage organizational programs</p>
        </div>
        <Link to="/eventsmgr/programs/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Program
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
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
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Programs Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredPrograms?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No programs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms?.map((program) => (
            <Link key={program.id} to={`/eventsmgr/programs/${program.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-2xl mb-2 flex items-center gap-1.5">
                        {categoryIcons[program.category] || "📋"}
                        {program.is_hidden && isAdmin && <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      {program.is_hidden && isAdmin && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Hidden</Badge>
                      )}
                      <Badge className={statusColors[program.status] || "bg-muted text-muted-foreground"}>
                        {program.status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {program.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {program.start_date && (
                    <div className="text-xs text-muted-foreground">
                      <strong>Start:</strong> {new Date(program.start_date).toLocaleDateString()}
                      {program.end_date && ` - ${new Date(program.end_date).toLocaleDateString()}`}
                    </div>
                  )}
                  {program.budget && (
                    <div className="text-xs text-muted-foreground">
                      <strong>Budget:</strong> ${program.budget.toLocaleString()}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 pt-2">
                    {program.tags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}