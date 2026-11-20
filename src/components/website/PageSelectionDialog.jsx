import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pageKeyFromLabel } from "@/lib/websitePages";

const EMPTY = { label: "", path: "", display_order: 0, is_visible: true, parent_page_key: "" };

// Add a selection to the top menu, or rename one and change where it points.
// A selection can also be placed inside a dropdown under another one.
export default function PageSelectionDialog({ open, onOpenChange, page, pages = [], onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Only a selection that sits across the top menu can hold a dropdown, so the
  // choices never create a second level.
  const parentOptions = pages.filter(
    (entry) => !entry.is_home && entry.id !== page?.id && !entry.parent_page_key
  );
  const childrenCount = page
    ? pages.filter((entry) => entry.parent_page_key === page.page_key).length
    : 0;

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(page ? { ...EMPTY, ...page, parent_page_key: page.parent_page_key || "" } : { ...EMPTY });
  }, [open, page?.id]);

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
        parent_page_key: form.parent_page_key || "",
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
            It appears across the top of the website, or inside a dropdown, and gets its own tab in Page
            Content.
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

          <div className="space-y-1.5">
            <Label>Where it sits</Label>
            <Select
              value={form.parent_page_key || "top"}
              onValueChange={(value) => set("parent_page_key", value === "top" ? "" : value)}
              disabled={childrenCount > 0}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Across the top menu</SelectItem>
                {parentOptions.map((entry) => (
                  <SelectItem key={entry.id} value={entry.page_key}>
                    In a dropdown under {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {childrenCount > 0
                ? `This selection holds a dropdown of its own (${childrenCount}), so it stays across the top menu.`
                : "Choose an item to make this a choice inside its dropdown."}
            </p>
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