import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, Plus, Search, Filter, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useItemVisibility } from "@/lib/useItemVisibility";

const statusColors = {
  planning: "bg-warning/10 text-warning",
  confirmed: "bg-success/10 text-success",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-accent/10 text-accent-foreground",
  cancelled: "bg-destructive/10 text-destructive-foreground",
};

export default function EventsMgrEvents() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { isAdmin, filterVisible } = useItemVisibility();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => base44.entities.Event.list("-start_date"),
  });

  const visibleEvents = filterVisible(events);

  const filteredEvents = visibleEvents?.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(search.toLowerCase()) ||
      event.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Events</h1>
          <p className="text-muted-foreground">Manage and organize your events</p>
        </div>
        <Link to="/eventsmgr/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="all">All Status</option>
            <option value="planning">Planning</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredEvents?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No events found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents?.map((event) => (
            <Link key={event.id} to={`/eventsmgr/events/${event.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                {event.cover_image_url && (
                  <div className="h-40 bg-muted rounded-t-lg overflow-hidden">
                    <img
                      src={event.cover_image_url}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg flex items-center gap-1.5">
                      {event.is_hidden && isAdmin && <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      {event.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      {event.is_hidden && isAdmin && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Hidden</Badge>
                      )}
                      <Badge className={statusColors[event.status] || "bg-muted text-muted-foreground"}>
                        {event.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {event.location && (
                    <p className="text-sm text-muted-foreground truncate">{event.location}</p>
                  )}
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 pt-2">
                    {event.tags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {event.tags?.length > 3 && (
                      <Badge variant="secondary" className="text-xs">+{event.tags.length - 3}</Badge>
                    )}
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