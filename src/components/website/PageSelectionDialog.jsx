import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { pageKeyFromLabel } from "@/lib/websitePages";

const EMPTY = { label: "", path: "", display_order: 0, is_visible: true };

// Add a selection to the top menu, or rename one and change where it points.
export default function PageSelectionDialog({ open, onOpenChange, page, nextOrder, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(page ? { ...EMPTY, ...page } : { ...EMPTY, display_order: nextOrder });
  }, [open, page?.id, nextOrder]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    const label = form.label.trim();
    if (!label) {
      setError("Give the selection a name.");
      return;
    }
    const key = page?.page_key || pageKeyFromLabel(label);
    if (!key) {
      setError("Use letters for the name so the page gets a web address.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        label,
        page_key: key,
        path: (form.path || "").trim() || (key === "home" ? "/" : `/${key.replace(/_/g, "-")}`),
        display_order: Number(form.display_order) || 0,
        is_home: page ? !!page.is_home : false,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "The selection could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {page ? "Edit page selection" : "Add a page selection"}
          </DialogTitle>
          <DialogDescription>
            It appears across the top of the website, in this position, and gets its own tab in Page Content.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="page-label">Name in the menu</Label>
            <Input
              id="page-label"
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="e.g. Winter Festival"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="page-path">Web address</Label>
              <Input
                id="page-path"
                value={form.path}
                onChange={(e) => set("path", e.target.value)}
                placeholder="/winter-festival"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="page-order">Position</Label>
              <Input
                id="page-order"
                type="number"
                value={form.display_order}
                onChange={(e) => set("display_order", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Show in the top menu</p>
              <p className="text-xs text-muted-foreground">Turn off to keep the page but hide its menu choice.</p>
            </div>
            <Switch checked={form.is_visible !== false} onCheckedChange={(v) => set("is_visible", v)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}