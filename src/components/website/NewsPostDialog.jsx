import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import WebsiteImageField from "@/components/website/WebsiteImageField";
import { toDateTimeLocal } from "@/lib/websiteManager";

const EMPTY = {
  title: "",
  summary: "",
  body: "",
  image_url: "",
  publish_date: new Date().toISOString().slice(0, 10),
  publish_at: "",
  is_pinned: false,
};

export default function NewsPostDialog({ open, onOpenChange, post, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(post ? { ...EMPTY, ...post, publish_at: toDateTimeLocal(post.publish_at) } : EMPTY);
  }, [open, post?.id]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (status) => async () => {
    if (!form.title.trim()) {
      setError("Give the post a title.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        status,
        publish_at: form.publish_at ? new Date(form.publish_at).toISOString() : "",
        slug:
          form.slug ||
          form.title.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").slice(0, 70),
      });
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "The post could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{post ? "Edit post" : "New post"}</DialogTitle>
          <DialogDescription>
            News and announcements use the website's standard post layout.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="news-title">Title</Label>
            <Input id="news-title" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="news-summary">Short summary</Label>
            <Textarea
              id="news-summary"
              rows={2}
              maxLength={240}
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="news-body">Post text</Label>
            <Textarea id="news-body" rows={7} value={form.body} onChange={(e) => set("body", e.target.value)} />
          </div>
          <WebsiteImageField label="Image" value={form.image_url} onChange={(url) => set("image_url", url)} />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="news-date">Date</Label>
              <Input
                id="news-date"
                type="date"
                value={form.publish_date}
                onChange={(e) => set("publish_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="news-schedule">Go live at (optional)</Label>
              <Input
                id="news-schedule"
                type="datetime-local"
                value={form.publish_at || ""}
                onChange={(e) => set("publish_at", e.target.value)}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-2">
            Leave “Go live at” empty to go live as soon as you publish. Set a time and the website adds the post
            itself at that moment.
          </p>
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Pin to the top of the news list</p>
              <p className="text-xs text-muted-foreground">Keeps this post first while it is published.</p>
            </div>
            <Switch checked={form.is_pinned} onCheckedChange={(v) => set("is_pinned", v)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" onClick={submit("draft")} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save draft
          </Button>
          <Button onClick={submit("published")} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Publish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}