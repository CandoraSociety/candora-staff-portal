import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Loader2, Pencil, Trash2, Newspaper, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import NewsPostDialog from "@/components/website/NewsPostDialog";
import { formatWebsiteDate } from "@/lib/websiteManager";

const STATUS_STYLES = {
  published: "bg-success/10 text-success",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-warning/10 text-warning",
};

export default function WebsiteNews() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["website-news"],
    queryFn: () =>
      base44.entities.WebsiteNewsPost
        .list({ sort: "-publish_date", limit: 100 })
        .then((res) => res.items || []),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["website-news"] });

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (post) => {
    setEditing(post);
    setDialogOpen(true);
  };

  const savePost = async (payload) => {
    if (editing) {
      await base44.entities.WebsiteNewsPost.update(editing.id, payload);
    } else {
      await base44.entities.WebsiteNewsPost.create(payload);
    }
    refresh();
    toast({ title: payload.status === "published" ? "Post published to the website" : "Draft saved" });
  };

  const toggleStatus = async (post) => {
    const next = post.status === "published" ? "draft" : "published";
    await base44.entities.WebsiteNewsPost.update(post.id, { status: next });
    refresh();
  };

  const remove = async (post) => {
    if (!window.confirm(`Delete “${post.title}”?`)) return;
    await base44.entities.WebsiteNewsPost.delete(post.id);
    refresh();
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Website Studio</p>
          <h1 className="font-display text-3xl font-bold text-foreground mt-1">News &amp; Updates</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Announcements posted to the website. Only published posts are sent to the public site.
          </p>
        </div>
        <Button onClick={openNew} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" /> New post
        </Button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading posts…
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Newspaper className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-display text-lg font-bold text-foreground">No posts yet</p>
          <p className="text-sm text-muted-foreground mt-1">Share news, updates and announcements with supporters.</p>
          <Button className="mt-4" onClick={openNew}>
            <Plus className="w-4 h-4" /> Write the first post
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="rounded-xl border border-border bg-card p-4 flex gap-4">
              {post.image_url ? (
                <img
                  src={post.image_url}
                  alt=""
                  className="w-24 h-20 object-cover rounded-lg border border-border flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Newspaper className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-bold text-foreground truncate">{post.title}</h3>
                      {post.is_pinned && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatWebsiteDate(post.publish_date)}
                      {post.author_name ? ` · ${post.author_name}` : ""}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full flex-shrink-0 ${
                      STATUS_STYLES[post.status] || STATUS_STYLES.draft
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
                {post.summary && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.summary}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => openEdit(post)}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleStatus(post)}>
                  {post.status === "published" ? (
                    <><EyeOff className="w-3.5 h-3.5" /> Unpublish</>
                  ) : (
                    <><Eye className="w-3.5 h-3.5" /> Publish</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => remove(post)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewsPostDialog open={dialogOpen} onOpenChange={setDialogOpen} post={editing} onSave={savePost} />
    </div>
  );
}