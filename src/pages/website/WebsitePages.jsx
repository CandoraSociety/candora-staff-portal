import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Loader2, Pencil, Trash2, Eye, EyeOff, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import SectionEditorDialog from "@/components/website/SectionEditorDialog";
import { WEBSITE_PAGES } from "@/lib/websiteManager";

export default function WebsitePages() {
  const [page, setPage] = useState("home");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
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

  const pageSections = useMemo(
    () => sections.filter((section) => section.page === page),
    [sections, page]
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

  const remove = async (section) => {
    if (!window.confirm(`Delete the “${section.heading}” block?`)) return;
    await base44.entities.WebsiteSection.delete(section.id);
    refresh();
    toast({ title: "Content block deleted" });
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Website Studio</p>
          <h1 className="font-display text-3xl font-bold text-foreground mt-1">Page Content</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Edit the copy inside the website's existing blocks. Layout, styling and page structure stay with the site.
          </p>
        </div>
        <Button onClick={openNew} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add block
        </Button>
      </header>

      <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-muted/60 w-fit">
        {WEBSITE_PAGES.map((item) => (
          <button
            key={item.value}
            onClick={() => setPage(item.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              page === item.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

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
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => remove(section)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SectionEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        section={editing}
        onSave={saveSection}
      />
    </div>
  );
}