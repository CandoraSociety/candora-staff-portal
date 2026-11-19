import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, RefreshCw, Search, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import PublishWizard from "@/components/website/PublishWizard";
import PublicationCard from "@/components/website/PublicationCard";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "unpublished", label: "Not advertised" },
];

export default function WebsiteEvents() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: publications = [], isLoading } = useQuery({
    queryKey: ["website-publications"],
    queryFn: () =>
      base44.entities.WebsitePublication
        .list({ sort: "-created_date", limit: 200 })
        .then((page) => page.items || []),
  });

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return publications
      .filter((pub) => {
        const status = pub.advertise === false ? "unpublished" : pub.status || "draft";
        if (filter !== "all" && status !== filter) return false;
        if (!term) return true;
        return (
          (pub.title || "").toLowerCase().includes(term) ||
          (pub.summary || "").toLowerCase().includes(term)
        );
      });
  }, [publications, filter, search]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["website-publications"] });

  const openNew = () => {
    setEditing(null);
    setWizardOpen(true);
  };

  const openEdit = (publication) => {
    setEditing(publication);
    setWizardOpen(true);
  };

  const toggleStatus = async (publication) => {
    const isLive = publication.status === "published" && publication.advertise !== false;
    if (!isLive && publication.advertise === false) {
      toast({
        title: "This item is set to “Do not advertise”",
        description: "Open it and turn advertising on before publishing it to the website.",
        variant: "destructive",
      });
      return;
    }
    await base44.entities.WebsitePublication.update(publication.id, {
      status: isLive ? "unpublished" : "published",
      ...(isLive
        ? {}
        : { published_at: new Date().toISOString() }),
    });
    refresh();
  };

  const remove = async (publication) => {
    if (!window.confirm(`Remove “${publication.title}” from the website studio?`)) return;
    await base44.entities.WebsitePublication.delete(publication.id);
    refresh();
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke("refreshWebsitePublications", {});
      const { updated = 0, checked = 0 } = res.data || {};
      toast({
        title: updated > 0 ? `${updated} page${updated === 1 ? "" : "s"} updated` : "Everything is up to date",
        description: `${checked} item${checked === 1 ? "" : "s"} checked against Candora 360.`,
      });
      refresh();
    } catch (err) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Website Studio</p>
          <h1 className="font-display text-3xl font-bold text-foreground mt-1">Events &amp; Programs</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Each item here has a page on the public website. Details come from Candora 360; the page copy is yours.
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button variant="outline" onClick={syncNow} disabled={syncing}>
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Sync now
          </Button>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4" /> Publish an item
          </Button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search pages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-muted/60 w-fit">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === item.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading website pages…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-display text-lg font-bold text-foreground">
            {publications.length === 0 ? "No website pages yet" : "Nothing matches this view"}
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {publications.length === 0
              ? "Pick a program or event from Candora 360 to set up its public page and home-page listing."
              : "Try a different filter or search term."}
          </p>
          {publications.length === 0 && (
            <Button className="mt-4" onClick={openNew}>
              <Plus className="w-4 h-4" /> Set up the first page
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((publication) => (
            <PublicationCard
              key={publication.id}
              publication={publication}
              onEdit={openEdit}
              onToggleStatus={toggleStatus}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      <PublishWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        publication={editing}
        onSaved={refresh}
      />
    </div>
  );
}