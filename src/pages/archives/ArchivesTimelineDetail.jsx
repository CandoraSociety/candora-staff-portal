import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Pencil, ExternalLink, Video, FileText } from "lucide-react";
import { useArchiveAdmin } from "@/components/archives/useArchiveAdmin";
import TimelineItemEditor from "@/components/archives/TimelineItemEditor";
import { useToast } from "@/components/ui/use-toast";

export default function ArchivesTimelineDetail() {
  const { id } = useParams();
  const { isAdmin } = useArchiveAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ["archiveTimelineItem", id],
    queryFn: () => base44.entities.ArchiveTimelineItem.get(id),
    enabled: !!id,
  });

  const handleSave = async (data) => {
    try {
      await base44.entities.ArchiveTimelineItem.update(id, data);
      queryClient.invalidateQueries({ queryKey: ["archiveTimelineItem", id] });
      queryClient.invalidateQueries({ queryKey: ["archiveTimelineItems"] });
      toast({ title: "Timeline item updated" });
      setEditorOpen(false);
    } catch (err) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Timeline item not found.</p>
        <Link to="/archives/timeline"><Button variant="link">Back to Timeline</Button></Link>
      </div>
    );
  }

  const monthName = item.month ? ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][item.month] : "";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/archives/timeline"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Timeline</Button></Link>
        {isAdmin && <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditorOpen(true)}><Pencil className="h-4 w-4" /> Edit</Button>}
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-4xl font-display font-bold text-primary">{item.year}</div>
        {monthName && <div className="text-muted-foreground">{monthName}{item.day ? ` ${item.day}, ${item.year}` : ""}</div>}
        <h1 className="text-2xl md:text-3xl font-display font-bold">{item.title}</h1>
        {item.summary && <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{item.summary}</p>}
      </div>

      {/* Hero image */}
      {item.media?.find(m => m.type === "photo") && (
        <div className="rounded-xl overflow-hidden">
          <img src={item.media.find(m => m.type === "photo").url} alt="" className="w-full max-h-96 object-cover" />
        </div>
      )}

      {/* Detailed content */}
      {item.detailed_content && (
        <Card>
          <CardContent className="prose prose-sm max-w-none p-6">
            <div dangerouslySetInnerHTML={{ __html: item.detailed_content }} />
          </CardContent>
        </Card>
      )}

      {/* Media gallery */}
      {item.media?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Gallery</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {item.media.map((m, i) => (
              <div key={i} className="space-y-1">
                {m.type === "photo" ? (
                  <img src={m.url} alt={m.caption || ""} className="rounded-lg w-full h-40 object-cover" />
                ) : m.type === "video" ? (
                  <div className="rounded-lg overflow-hidden bg-muted h-40 flex items-center justify-center">
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                      <Video className="h-8 w-8" /><span className="text-xs">View Video</span>
                    </a>
                  </div>
                ) : (
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="rounded-lg flex items-center justify-center bg-muted h-40 hover:bg-muted/80">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground"><FileText className="h-8 w-8" /><span className="text-xs">View Document</span></div>
                  </a>
                )}
                {m.caption && <p className="text-xs text-muted-foreground text-center">{m.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <TimelineItemEditor open={editorOpen} onClose={() => setEditorOpen(false)} onSave={handleSave} initial={item} />
    </div>
  );
}