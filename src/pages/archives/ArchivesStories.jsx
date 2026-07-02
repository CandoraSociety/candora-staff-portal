import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useArchiveAdmin } from "@/components/archives/useArchiveAdmin";
import StoryEditor from "@/components/archives/StoryEditor";
import { useToast } from "@/components/ui/use-toast";

function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  return tmp.textContent || tmp.innerText || "";
}

export default function ArchivesStories() {
  const { isAdmin } = useArchiveAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewStory, setViewStory] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingStory, setEditingStory] = useState(null);

  const { data: stories } = useQuery({
    queryKey: ["archiveStories"],
    queryFn: () => base44.entities.ArchiveStory.list("-created_date", 100),
  });

  const sorted = (stories || []).slice().sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const handleSave = async (data) => {
    try {
      if (editingStory) {
        await base44.entities.ArchiveStory.update(editingStory.id, data);
        toast({ title: "Story updated" });
      } else {
        await base44.entities.ArchiveStory.create(data);
        toast({ title: "Story added" });
      }
      queryClient.invalidateQueries({ queryKey: ["archiveStories"] });
      setEditorOpen(false);
      setEditingStory(null);
    } catch (err) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (story) => {
    if (!confirm(`Delete "${story.title}"?`)) return;
    try {
      await base44.entities.ArchiveStory.delete(story.id);
      queryClient.invalidateQueries({ queryKey: ["archiveStories"] });
      setViewStory(null);
      toast({ title: "Story deleted" });
    } catch (err) {
      toast({ title: "Error deleting", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Interesting & Important Stories</h1>
          <p className="text-muted-foreground">Memorable tales and moments from Candora's history.</p>
        </div>
        {isAdmin && (
          <Button size="sm" className="gap-2" onClick={() => { setEditingStory(null); setEditorOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Story
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sorted.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No stories yet. {isAdmin && "Click 'Add Story' to share a tale."}</p>}
        {sorted.map(story => {
          const excerpt = stripHtml(story.content).slice(0, 200);
          const heroImage = story.media?.find(m => m.type === "photo");
          return (
            <Card key={story.id} className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden" onClick={() => setViewStory(story)}>
              {heroImage && <div className="aspect-video overflow-hidden"><img src={heroImage.url} alt="" className="w-full h-full object-cover" /></div>}
              <CardHeader>
                <CardTitle className="text-base">{story.title}</CardTitle>
                <CardDescription>
                  {story.story_date && new Date(story.story_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  {story.era && ` · ${story.era}`}
                  {story.author && ` · By ${story.author}`}
                </CardDescription>
              </CardHeader>
              {excerpt && <CardContent><p className="text-sm text-muted-foreground line-clamp-3">{excerpt}...</p></CardContent>}
            </Card>
          );
        })}
      </div>

      {/* View Modal */}
      <Dialog open={!!viewStory} onOpenChange={(v) => !v && setViewStory(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewStory && (
            <>
              <DialogHeader>
                <DialogTitle>{viewStory.title}</DialogTitle>
                <CardDescription>
                  {viewStory.story_date && new Date(viewStory.story_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  {viewStory.era && ` · ${viewStory.era}`}
                  {viewStory.author && ` · By ${viewStory.author}`}
                </CardDescription>
              </DialogHeader>
              <div className="space-y-4">
                {viewStory.content && (
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: viewStory.content }} />
                )}
                {viewStory.media?.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {viewStory.media.filter(m => m.type === "photo").map((m, i) => (
                      <figure key={i} className="space-y-1">
                        <img src={m.url} alt={m.caption || ""} className="rounded-lg w-full" />
                        {m.caption && <figcaption className="text-xs text-muted-foreground text-center">{m.caption}</figcaption>}
                      </figure>
                    ))}
                  </div>
                )}
                {isAdmin && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => { setEditingStory(viewStory); setViewStory(null); setEditorOpen(true); }}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 text-destructive" onClick={() => handleDelete(viewStory)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <StoryEditor open={editorOpen} onClose={() => { setEditorOpen(false); setEditingStory(null); }} onSave={handleSave} initial={editingStory} />
    </div>
  );
}