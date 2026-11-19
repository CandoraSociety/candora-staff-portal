import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WEBSITE_PAGES } from "@/lib/websiteManager";

const EMPTY = {
  page: "home",
  section_key: "",
  heading: "",
  body: "",
  image_url: "",
  cta_label: "",
  cta_url: "",
  display_order: 0,
  is_visible: true,
};

export default function SectionEditorDialog({ open, onOpenChange, section, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(section ? { ...EMPTY, ...section } : EMPTY);
  }, [open, section?.id]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.heading.trim()) {
      setError("Give the block a heading.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        section_key: form.section_key || form.heading.toLowerCase().replace(/[^\w]+/g, "_").slice(0, 40),
        display_order: Number(form.display_order) || 0,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "The block could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {section ? "Edit content block" : "Add content block"}
          </DialogTitle>
          <DialogDescription>
            These blocks are the only parts of the site you edit directly — the website decides their layout.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Page</Label>
              <Select value={form.page} onValueChange={(v) => set("page", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WEBSITE_PAGES.map((page) => (
                    <SelectItem key={page.value} value={page.value}>{page.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="section-order">Position</Label>
              <Input
                id="section-order"
                type="number"
                value={form.display_order}
                onChange={(e) => set("display_order", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="section-heading">Heading</Label>
            <Input id="section-heading" value={form.heading} onChange={(e) => set("heading", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="section-body">Text</Label>
            <Textarea
              id="section-body"
              rows={5}
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder="Keep it to a short paragraph or two"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="section-image">Image link (optional)</Label>
            <Input
              id="section-image"
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="section-cta">Button label (optional)</Label>
              <Input id="section-cta" value={form.cta_label} onChange={(e) => set("cta_label", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="section-cta-url">Button link</Label>
              <Input id="section-cta-url" value={form.cta_url} onChange={(e) => set("cta_url", e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Show on the website</p>
              <p className="text-xs text-muted-foreground">Turn off to hide the block without deleting it.</p>
            </div>
            <Switch checked={form.is_visible} onCheckedChange={(v) => set("is_visible", v)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save block
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}