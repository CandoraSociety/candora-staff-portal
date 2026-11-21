import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

// Writing one page's search settings by hand, with the character counts a
// search result allows.
export default function SeoMetaDialog({ open, onOpenChange, page, record, isSaving, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({
      meta_title: record?.meta_title || "",
      meta_description: record?.meta_description || "",
      keywords: (record?.keywords || []).join(", "),
      og_image_url: record?.og_image_url || "",
      canonical_path: record?.canonical_path || "",
      is_indexable: record?.is_indexable !== false,
    });
  }, [open, record, page]);

  if (!page) return null;

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSave = () =>
    onSave(page, {
      meta_title: form.meta_title.trim(),
      meta_description: form.meta_description.trim(),
      keywords: form.keywords
        .split(",")
        .map((word) => word.trim())
        .filter(Boolean),
      og_image_url: form.og_image_url.trim(),
      canonical_path: form.canonical_path.trim(),
      is_indexable: form.is_indexable,
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search settings — {page.label}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="meta_title">Title</Label>
              <span className="text-[11px] text-muted-foreground">{form.meta_title.length}/60</span>
            </div>
            <Input
              id="meta_title"
              value={form.meta_title}
              onChange={(event) => update("meta_title", event.target.value)}
              placeholder="What this page is, then | Candora"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="meta_description">Description</Label>
              <span className="text-[11px] text-muted-foreground">{form.meta_description.length}/160</span>
            </div>
            <Textarea
              id="meta_description"
              rows={3}
              value={form.meta_description}
              onChange={(event) => update("meta_description", event.target.value)}
              placeholder="One sentence on what the page offers and who it is for."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="keywords">Words this page should be found for</Label>
            <Input
              id="keywords"
              value={form.keywords}
              onChange={(event) => update("keywords", event.target.value)}
              placeholder="food bank Edmonton, free lunches, community meals"
            />
            <p className="text-[11px] text-muted-foreground">Separate each phrase with a comma.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="og_image">Share image URL</Label>
              <Input
                id="og_image"
                value={form.og_image_url}
                onChange={(event) => update("og_image_url", event.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="canonical">Canonical address</Label>
              <Input
                id="canonical"
                value={form.canonical_path}
                onChange={(event) => update("canonical_path", event.target.value)}
                placeholder={page.path || "/"}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">Show in search results</p>
              <p className="text-[11px] text-muted-foreground">
                Turn off to keep the page live but out of search engines and AI answers.
              </p>
            </div>
            <Switch
              checked={form.is_indexable}
              onCheckedChange={(value) => update("is_indexable", value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Save settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}