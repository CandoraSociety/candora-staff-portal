import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Loader2, Pencil, Archive, Eye, EyeOff, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import SectionEditorDialog from "@/components/website/SectionEditorDialog";
import PageAiBuilder from "@/components/website/PageAiBuilder";
import ArchivedHeadersCard from "@/components/website/ArchivedHeadersCard";
import PageSelectionsCard from "@/components/website/PageSelectionsCard";
import WebsitePageNavigation from "@/components/website/WebsitePageNavigation";
import PageSelectionDialog from "@/components/website/PageSelectionDialog";
import PageDeleteDialog from "@/components/website/PageDeleteDialog";
import { activePages, archivedPages } from "@/lib/websitePages";
import { formatWebsiteDate, isScheduledLater } from "@/lib/websiteManager";

export default function WebsitePages() {
  const [page, setPage] = useState("home");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [aiBuilderOpen, setAiBuilderOpen] = useState(false);
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);
  const [editingSelection, setEditingSelection] = useState(null);
  const [selectionToDelete, setSelectionToDelete] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["website-sections"],
    queryFn: () =>
      base44.entities.WebsiteSection
        .list({ sort: "display_order", limit: 300 })
        .then((res) => res.items || []),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["website-sections"] });

  // The selections across the top of the website — the same set that fills the
  // tabs on this screen.
  const { data: pages = [] } = useQuery({
    queryKey: ["website-pages"],
    queryFn: () =>
      base44.entities.WebsitePage.list({ sort: "display_order", limit: 100 }).then((res) => res.items || []),
  });

  const refreshPages = () => queryClient.invalidateQueries({ queryKey: ["website-pages"] });

  // Site-wide wording the AI uses as context when it writes for the website.
  const { data: site = null } = useQuery({
    queryKey: ["website-settings"],
    queryFn: () =>
      base44.entities.WebsiteSettings.list({ limit: 1 }).then((res) => res.items?.[0] || null),
  });

  const menuPages = useMemo(() => activePages(pages), [pages]);
  const archivedSelections = useMemo(() => archivedPages(pages), [pages]);

  // Falls back to the first selection when the chosen page was archived.
  const currentPage = menuPages.some((item) => item.page_key === page)
    ? page
    : menuPages[0]?.page_key || "home";

  const pageSections = useMemo(
    () => sections.filter((section) => section.page === currentPage && !section.is_archived),
    [sections, currentPage]
  );

  const archivedSections = useMemo(
    () => sections.filter((section) => section.page === currentPage && section.is_archived),
    [sections, currentPage]
  );

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (section) => {
    setEditing(section);
    setDialogOpen(true);
  };

  const saveSection = async (payload) => {
    if (editing) {
      await base44.entities.WebsiteSection.update(editing.id, payload);
    } else {
      await base44.entities.WebsiteSection.create(payload);
    }
    refresh();
  };

  const toggleVisible = async (section) => {
    await base44.entities.WebsiteSection.update(section.id, { is_visible: section.is_visible === false });
    refresh();
  };

  // Removing a header only archives it — it waits in Archived headers and can
  // be put back on the page at any time.
  const archive = async (section) => {
    await base44.entities.WebsiteSection.update(section.id, { is_archived: true });
    refresh();
    toast({ title: "Header archived", description: "Find it in Archived headers to put it back." });
  };

  const restore = async (section) => {
    await base44.entities.WebsiteSection.update(section.id, { is_archived: false });
    refresh();
    toast({ title: "Header put back on the page" });
  };

  const deletePermanently = async (section) => {
    await base44.entities.WebsiteSection.delete(section.id);
    refresh();
    toast({ title: "Header deleted permanently" });
  };

  const openAddSelection = () => {
    setEditingSelection(null);
    setSelectionDialogOpen(true);
  };

  const openEditSelection = (item) => {
    setEditingSelection(item);
    setSelectionDialogOpen(true);
  };

  const saveSelection = async (payload) => {
    if (editingSelection) {
      await base44.entities.WebsitePage.update(editingSelection.id, payload);
    } else {
      await base44.entities.WebsitePage.create(payload);
    }
    refreshPages();
    toast({ title: editingSelection ? "Selection updated" : "Selection added to the menu" });
  };

  const archiveSelection = async (item) => {
    await base44.entities.WebsitePage.update(item.id, { is_archived: true });
    refreshPages();
    toast({ title: "Selection archived", description: "Find it under Archived selections to put it back." });
  };

  const restoreSelection = async (item) => {
    await base44.entities.WebsitePage.update(item.id, { is_archived: false });
    refreshPages();
    toast({ title: "Selection put back in the menu" });
  };

  // A page drafted with AI: the blocks (and the page itself, when it is new)
  // are already saved by the builder, so this only refreshes and reports.
  const handlePageCreated = ({ pageKey, pageLabel, count, createdPage }) => {
    refresh();
    if (createdPage) {
      refreshPages();
      setPage(pageKey);
    }
    toast({
      title: createdPage ? `“${pageLabel}” created` : `Added to ${pageLabel}`,
      description: `${count} block${count === 1 ? "" : "s"} written. Edit any of them, then publish the site.`,
    });
  };

  const deleteSelectionPermanently = async (item) => {
    await base44.entities.WebsitePage.delete(item.id);
    refreshPages();
    toast({ title: "Selection deleted permanently" });
  };

  // Sets the menu order by hand: a selection only moves among the items beside
  // it, so one inside a dropdown stays inside that dropdown.
  const moveSelection = async (item, direction) => {
    const siblings = menuPages.filter(
      (entry) => (entry.parent_page_key || "") === (item.parent_page_key || "")
    );
    const index = siblings.findIndex((entry) => entry.id === item.id);
    if (index < 0) return;
    const reordered = [...siblings];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(index + direction, 0, moved);
    await base44.entities.WebsitePage.bulkUpdate(
      reordered.map((entry, position) => ({ id: entry.id, display_order: position }))
    );
    refreshPages();
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Website Studio</p>
          <h1 className="font-display text-3xl font-bold text-foreground mt-1">Page Content</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Edit the copy inside the website's existing blocks. Layout, styling and page structure stay with the site.
            Removing a header moves it to the archive, where it can be put back.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" onClick={() => setAiBuilderOpen(true)}>
            <Sparkles className="w-4 h-4" /> Build a page with AI
          </Button>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4" /> Add block
          </Button>
        </div>
      </header>

      <WebsitePageNavigation pages={menuPages} currentPage={currentPage} onSelect={setPage} />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading content blocks…
        </div>
      ) : pageSections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-display text-lg font-bold text-foreground">No blocks on this page yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add a block and the website will place it in this page's layout.
          </p>
          <Button className="mt-4" onClick={openNew}>
            <Plus className="w-4 h-4" /> Add the first block
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {pageSections.map((section) => (
            <div key={section.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-foreground">{section.heading}</h3>
                    {section.is_visible === false && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Hidden
                      </span>
                    )}
                    {isScheduledLater(section.publish_at) && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                        Goes live {formatWebsiteDate(section.publish_at, true)}
                      </span>
                    )}
                  </div>
                  {section.body && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{section.body}</p>
                  )}
                  {section.image_url && (
                    <img
                      src={section.image_url}
                      alt=""
                      className="mt-2 h-24 w-40 object-cover rounded-lg border border-border"
                    />
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openEdit(section)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleVisible(section)}>
                    {section.is_visible === false ? (
                      <><Eye className="w-3.5 h-3.5" /> Show</>
                    ) : (
                      <><EyeOff className="w-3.5 h-3.5" /> Hide</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => archive(section)}
                    title="Move this header to the archive"
                  >
                    <Archive className="w-3.5 h-3.5" /> Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PageSelectionsCard
        pages={menuPages}
        archived={archivedSelections}
        onAdd={openAddSelection}
        onEdit={openEditSelection}
        onArchive={archiveSelection}
        onMove={moveSelection}
        onRestore={restoreSelection}
        onDelete={setSelectionToDelete}
      />

      <ArchivedHeadersCard
        sections={archivedSections}
        onRestore={restore}
        onDelete={deletePermanently}
      />

      <SectionEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        section={editing}
        pages={menuPages}
        defaultPage={currentPage}
        onSave={saveSection}
        site={site}
        existingHeadings={pageSections
          .filter((item) => item.id !== editing?.id)
          .map((item) => item.heading)
          .filter(Boolean)}
      />

      <PageAiBuilder
        open={aiBuilderOpen}
        onOpenChange={setAiBuilderOpen}
        pages={menuPages}
        sections={sections}
        defaultPage={currentPage}
        site={site}
        onCreated={handlePageCreated}
      />

      <PageSelectionDialog
        open={selectionDialogOpen}
        onOpenChange={setSelectionDialogOpen}
        page={editingSelection}
        pages={menuPages}
        onSave={saveSelection}
      />

      <PageDeleteDialog
        target={selectionToDelete}
        onClose={() => setSelectionToDelete(null)}
        onConfirm={deleteSelectionPermanently}
      />
    </div>
  );
}