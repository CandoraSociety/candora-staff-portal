import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pageKeyFromLabel } from "@/lib/websitePages";

// The choices inside a dropdown under one top-level menu item. A page can be
// written from scratch, moved in from elsewhere in the menu, or duplicated in
// with its content blocks, without touching anything else on the site.
const EMPTY = { mode: "move", targetId: "", label: "", path: "" };

export default function DropdownOptionDialog({
  open,
  onOpenChange,
  parent,
  pages = [],
  sections = [],
  initialMode = "move",
  onChanged,
}) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // A selection that already holds a dropdown cannot itself move inside one,
  // and the home page always stays at the top of the menu.
  const holders = new Set(pages.filter((entry) => entry.parent_page_key).map((entry) => entry.parent_page_key));
  const candidates = pages.filter(
    (entry) =>
      entry.id !== parent?.id &&
      !entry.is_home &&
      !holders.has(entry.page_key) &&
      entry.parent_page_key !== parent?.page_key
  );

  const target = candidates.find((entry) => entry.id === form.targetId) || null;
  const takenKeys = new Set(pages.map((entry) => entry.page_key));
  const takenPaths = new Set(pages.map((entry) => entry.path));

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm({ ...EMPTY, mode: initialMode, targetId: candidates[0]?.id || "" });
  }, [open, parent?.id, initialMode]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const nextOrder = () =>
    Math.max(-1, ...pages.filter((entry) => entry.parent_page_key === parent.page_key).map((entry) => Number(entry.display_order) || 0)) + 1;

  const uniqueKey = (base) => {
    let key = base || "page";
    let n = 2;
    while (takenKeys.has(key)) key = `${base}_${n++}`;
    return key;
  };

  const submit = async () => {
    if (!parent) return;
    setBusy(true);
    setError("");
    try {
      if (form.mode === "new") {
        const label = form.label.trim();
        if (!label) throw new Error("Give the new page a name.");
        const base = pageKeyFromLabel(label);
        if (!base) throw new Error("Use letters for the name so the page gets a web address.");
        const key = uniqueKey(base);
        const path = (form.path || "").trim() || `${parent.path || ""}/${key.replace(/_/g, "-")}`;
        await base44.entities.WebsitePage.create({
          label,
          page_key: key,
          path,
          parent_page_key: parent.page_key,
          display_order: nextOrder(),
          is_home: false,
          is_visible: true,
          is_archived: false,
        });
        onChanged?.({ title: `“${label}” added under ${parent.label}`, pageKey: key });
      } else {
        if (!target) throw new Error("Choose a page from the list.");
        if (form.mode === "move") {
          await base44.entities.WebsitePage.update(target.id, {
            parent_page_key: parent.page_key,
            display_order: nextOrder(),
          });
          onChanged?.({ title: `“${target.label}” moved under ${parent.label}`, pageKey: target.page_key });
        } else {
          const key = uniqueKey(pageKeyFromLabel(target.label));
          let path = target.path ? `${target.path}-copy` : `${parent.path || ""}/${key.replace(/_/g, "-")}`;
          let n = 2;
          while (takenPaths.has(path)) path = `${target.path || `${parent.path}/${key}`}-copy-${n++}`;
          const sourceSections = sections.filter(
            (section) => section.page === target.page_key && !section.is_archived
          );
          await base44.entities.WebsitePage.create({
            label: target.label,
            page_key: key,
            path,
            parent_page_key: parent.page_key,
            display_order: nextOrder(),
            is_home: false,
            is_visible: true,
            is_archived: false,
          });
          if (sourceSections.length) {
            await base44.entities.WebsiteSection.bulkCreate(
              sourceSections.map((section) => ({
                page: key,
                section_key: section.section_key,
                heading: section.heading,
                body: section.body || "",
                image_url: section.image_url || "",
                cta_label: section.cta_label || "",
                cta_url: section.cta_url || "",
                display_order: Number(section.display_order) || 0,
                is_visible: section.is_visible !== false,
                is_archived: false,
              }))
            );
          }
          onChanged?.({
            title: `“${target.label}” duplicated under ${parent.label}`,
            pageKey: key,
            description: sourceSections.length
              ? `${sourceSections.length} content block${sourceSections.length === 1 ? "" : "s"} copied too.`
              : "The copy has no content blocks yet.",
          });
        }
      }
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "It could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Dropdown under {parent?.label}
          </DialogTitle>
          <DialogDescription>
            Add a choice to this dropdown. Only the menu changes — every page keeps its own content.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>What would you like to do</Label>
            <Select value={form.mode} onValueChange={(value) => set("mode", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="move">Move an existing page here</SelectItem>
                <SelectItem value="duplicate">Duplicate an existing page here</SelectItem>
                <SelectItem value="new">Write a new page here</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.mode === "new" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="dropdown-label">Name in the menu</Label>
                <Input
                  id="dropdown-label"
                  value={form.label}
                  onChange={(e) => set("label", e.target.value)}
                  placeholder="e.g. Our kitchen"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dropdown-path">Web address (optional)</Label>
                <Input
                  id="dropdown-path"
                  value={form.path}
                  onChange={(e) => set("path", e.target.value)}
                  placeholder={`${parent?.path || ""}/our-kitchen`}
                />
              </div>
            </>
          ) : candidates.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
              There is no page that can be moved in here. Write a new page instead.
            </p>
          ) : (
            <div className="space-y-1.5">
              <Label>Page</Label>
              <Select value={form.targetId} onValueChange={(value) => set("targetId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a page" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.label}
                      {entry.parent_page_key ? " (in a dropdown)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {form.mode === "move"
                  ? "The page leaves its current place in the menu and opens from here. Its content comes with it."
                  : "A second copy is created here, with its content blocks, and the original stays where it is."}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {form.mode === "new" ? "Add page" : form.mode === "move" ? "Move here" : "Duplicate here"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}