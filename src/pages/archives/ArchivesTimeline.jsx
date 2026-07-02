import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, ArrowRight, BookOpen } from "lucide-react";
import { useArchiveAdmin } from "@/components/archives/useArchiveAdmin";
import TimelineItemEditor from "@/components/archives/TimelineItemEditor";
import { useToast } from "@/components/ui/use-toast";

const ERA_FILTERS = [
  { value: "all", label: "All Eras" },
  { value: "founding", label: "Founding" },
  { value: "growth", label: "Growth" },
  { value: "expansion", label: "Expansion" },
  { value: "milestone", label: "Milestones" },
  { value: "modern", label: "Modern" },
];

export default function ArchivesTimeline() {
  const { isAdmin } = useArchiveAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [eraFilter, setEraFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { data: items } = useQuery({
    queryKey: ["archiveTimelineItems"],
    queryFn: () => base44.entities.ArchiveTimelineItem.list("-year", 200),
  });

  const sorted = (items || []).slice().sort((a, b) => {
    const aDate = (a.year || 0) * 100 + (a.month || 0);
    const bDate = (b.year || 0) * 100 + (b.month || 0);
    return bDate - aDate;
  });

  const filtered = eraFilter === "all" ? sorted : sorted.filter(i => i.era === eraFilter);

  const handleSave = async (data) => {
    try {
      if (editingItem) {
        await base44.entities.ArchiveTimelineItem.update(editingItem.id, data);
        toast({ title: "Timeline item updated" });
      } else {
        await base44.entities.ArchiveTimelineItem.create(data);
        toast({ title: "Timeline item added" });
      }
      queryClient.invalidateQueries({ queryKey: ["archiveTimelineItems"] });
      setEditorOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    try {
      await base44.entities.ArchiveTimelineItem.delete(item.id);
      queryClient.invalidateQueries({ queryKey: ["archiveTimelineItems"] });
      toast({ title: "Timeline item deleted" });
    } catch (err) {
      toast({ title: "Error deleting", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Historical Timeline</h1>
          <p className="text-muted-foreground">Click any event to see more — then read the full story.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/archives/timeline/chronicle">
            <Button variant="outline" size="sm" className="gap-2"><BookOpen className="h-4 w-4" /> Full Chronicle</Button>
          </Link>
          {isAdmin && (
            <Button size="sm" className="gap-2" onClick={() => { setEditingItem(null); setEditorOpen(true); }}>
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          )}
        </div>
      </div>

      {/* Era Filters */}
      <div className="flex flex-wrap gap-2">
        {ERA_FILTERS.map(era => (
          <Button
            key={era.value}
            variant={eraFilter === era.value ? "default" : "outline"}
            size="sm"
            onClick={() => setEraFilter(era.value)}
          >
            {era.label}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-1/2" />

        <div className="space-y-6">
          {filtered.length === 0 && (
            <p className="text-muted-foreground text-center py-12">No timeline items yet. {isAdmin && "Click 'Add Item' to get started."}</p>
          )}
          {filtered.map((item, index) => {
            const isExpanded = expandedId === item.id;
            const isFirstPhoto = item.media?.find(m => m.type === "photo");
            return (
              <div key={item.id} className={`relative flex ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                {/* Dot */}
                <div className="absolute left-4 md:left-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background md:-translate-x-1/2 mt-6 z-10" />

                {/* Card */}
                <div className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${index % 2 === 0 ? "md:mr-auto md:pr-8" : "md:ml-auto md:pl-8"}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-2xl font-display font-bold text-primary">{item.year}</span>
                          {item.month && (
                            <span className="text-sm text-muted-foreground ml-2">
                              {["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][item.month]}
                              {item.day ? ` ${item.day}` : ""}
                            </span>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingItem(item); setEditorOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(item)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold mt-1">{item.title}</h3>
                      {isExpanded ? (
                        <div className="mt-2 space-y-3">
                          {item.summary && <p className="text-sm text-muted-foreground">{item.summary}</p>}
                          {isFirstPhoto && (
                            <img src={isFirstPhoto.url} alt={isFirstPhoto.caption || ""} className="rounded-lg w-full max-h-48 object-cover" />
                          )}
                          <Link to={`/archives/timeline/${item.id}`} onClick={e => e.stopPropagation()}>
                            <Button variant="link" size="sm" className="p-0 h-auto gap-1">
                              Read full story <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        item.summary && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TimelineItemEditor open={editorOpen} onClose={() => { setEditorOpen(false); setEditingItem(null); }} onSave={handleSave} initial={editingItem} />
    </div>
  );
}