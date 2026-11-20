import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pageKeyFromLabel } from "@/lib/websitePages";

const NEW_PAGE = "__new__";

// Builds a whole page of content blocks from one brief — on a page that already
// exists, or on a page created in the same step. Nothing is saved until the
// blocks are reviewed and added.
export default function PageAiBuilder({ open, onOpenChange, pages = [], sections = [], defaultPage, site, onCreated }) {
  const [target, setTarget] = useState(NEW_PAGE);
  const [newLabel, setNewLabel] = useState("");
  const [brief, setBrief] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTarget(defaultPage || pages[0]?.page_key || NEW_PAGE);
    setNewLabel("");
    setBrief("");
    setBlocks([]);
    setError("");
  }, [open]);

  const isNew = target === NEW_PAGE;
  const targetLabel = isNew
    ? newLabel.trim()
    : pages.find((page) => page.page_key === target)?.label || "";

  const generate = async () => {
    if (!brief.trim()) {
      setError("Say what the page is about.");
      return;
    }
    if (isNew && !newLabel.trim()) {
      setError("Give the new page a name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const pageHeadings = sections
        .filter((section) => section.page === target && !section.is_archived)
        .map((section) => section.heading)
        .filter(Boolean);

      const plan = await base44.integrations.Core.InvokeLLM({
        prompt: `You are writing the content blocks for the "${targetLabel}" page of the public website of ${
          site?.site_name || "Candora"
        }, a community charity in Canada.
${site?.about_summary ? `About the organization: ${site.about_summary}` : ""}
${pageHeadings.length ? `Blocks already on this page: ${pageHeadings.join(" | ")}` : ""}

The staff member's brief for this page: "${brief.trim()}"

Write between three and six blocks that together make a complete page, in the order they should appear. For each block:
- heading: two to seven words, plain and specific.
- body: one or two short sentences, at most 45 words, warm plain language a supporter understands.
- cta_label: two or three words such as "Get involved", or an empty string when the block needs no button.
- cta_url: an in-site path such as /programs or /donate when the block has a button, otherwise an empty string.
Cover the page in a sensible arc: an opening block, then what the page is for, then how someone takes part. Do not repeat a heading that is already on the page.
Never invent statistics, dollar amounts, dates, names or program names that were not given to you.`,
        response_json_schema: {
          type: "object",
          properties: {
            blocks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  heading: { type: "string" },
                  body: { type: "string" },
                  cta_label: { type: "string" },
                  cta_url: { type: "string" },
                },
                required: ["heading", "body", "cta_label", "cta_url"],
              },
            },
          },
          required: ["blocks"],
        },
      });

      const drafted = (plan.blocks || [])
        .filter((block) => block.heading?.trim())
        .slice(0, 8)
        .map((block) => ({
          heading: block.heading.trim(),
          body: block.body || "",
          cta_label: block.cta_label || "",
          cta_url: block.cta_url || "",
        }));

      setBlocks(drafted);
      if (!drafted.length) setError("Nothing came back — try describing the page again.");
    } catch (err) {
      setError(err.message || "The page could not be drafted.");
    } finally {
      setBusy(false);
    }
  };

  const removeBlock = (index) => setBlocks((prev) => prev.filter((_, i) => i !== index));

  const addToPage = async () => {
    if (!blocks.length) return;
    setSaving(true);
    setError("");
    try {
      let pageKey = target;
      let pageLabel = targetLabel;

      if (isNew) {
        pageKey = pageKeyFromLabel(newLabel) || `page_${Date.now()}`;
        if (pages.some((page) => page.page_key === pageKey)) {
          throw new Error("A page with that name already exists — choose it from the list instead.");
        }
        await base44.entities.WebsitePage.create({
          label: newLabel.trim(),
          page_key: pageKey,
          path: `/${pageKey.replace(/_/g, "-")}`,
          display_order: pages.length,
          is_visible: true,
        });
        pageLabel = newLabel.trim();
      }

      const startOrder =
        sections
          .filter((section) => section.page === pageKey && !section.is_archived)
          .reduce((max, section) => Math.max(max, Number(section.display_order) || 0), -1) + 1;

      await base44.entities.WebsiteSection.bulkCreate(
        blocks.map((block, index) => ({
          page: pageKey,
          section_key: `${pageKey}_${(block.heading.toLowerCase().replace(/[^\w]+/g, "_") || "block").slice(0, 30)}_${startOrder + index}`,
          heading: block.heading,
          body: block.body,
          cta_label: block.cta_label,
          cta_url: block.cta_url,
          display_order: startOrder + index,
          is_visible: true,
        }))
      );

      onCreated?.({ pageKey, pageLabel, count: blocks.length, createdPage: isNew });
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "The blocks could not be added.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Build a page with AI</DialogTitle>
          <DialogDescription>
            Describe the page and the AI writes its blocks. You review them before anything is added.
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
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {pages.map((page) => (
                    <SelectItem key={page.page_key} value={page.page_key}>{page.label}</SelectItem>
                  ))}
                  <SelectItem value={NEW_PAGE}>A new page…</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isNew && (
              <div className="space-y-1.5">
                <Label htmlFor="ai-page-label">New page name</Label>
                <Input
                  id="ai-page-label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Winter Festival"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ai-page-brief">What is this page for?</Label>
            <Textarea
              id="ai-page-brief"
              rows={3}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="A page about our winter festival — what happens, who it helps and how people can take part or donate"
            />
          </div>

          <Button type="button" onClick={generate} disabled={busy || saving} className="gap-1.5">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {busy ? "Writing the page…" : blocks.length ? "Draft again" : "Draft the page"}
          </Button>

          {blocks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {blocks.length} block{blocks.length === 1 ? "" : "s"} for {targetLabel}
              </p>
              {blocks.map((block, index) => (
                <div key={`${block.heading}-${index}`} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display text-sm font-bold text-foreground">{block.heading}</h4>
                    <button
                      type="button"
                      onClick={() => removeBlock(index)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Leave this block out"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {block.body && <p className="text-xs text-muted-foreground mt-1">{block.body}</p>}
                  {block.cta_label && (
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Button: {block.cta_label}
                      {block.cta_url ? ` → ${block.cta_url}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={addToPage} disabled={!blocks.length || saving || busy}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isNew ? "Create the page" : "Add to this page"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}