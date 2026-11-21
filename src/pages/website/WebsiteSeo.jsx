import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MapPin, Megaphone } from "lucide-react";
import SeoScoreCard from "@/components/website/seo/SeoScoreCard";
import SeoFindingsList from "@/components/website/seo/SeoFindingsList";
import SeoPageTable from "@/components/website/seo/SeoPageTable";
import SeoMetaDialog from "@/components/website/seo/SeoMetaDialog";
import KeywordIdeasCard from "@/components/website/seo/KeywordIdeasCard";
import AiSearchCard from "@/components/website/seo/AiSearchCard";
import StructuredDataCard from "@/components/website/seo/StructuredDataCard";

// Search and AI visibility for the public site: one AI review of the whole site,
// the settings each page shows in search, the phrases to be found for, and the
// structured data search engines read.
export default function WebsiteSeo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [generatingKey, setGeneratingKey] = useState("");
  const [editingPage, setEditingPage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: pages = [] } = useQuery({
    queryKey: ["website-pages-menu"],
    queryFn: () => base44.entities.WebsitePage.list({ sort: "display_order", limit: 100 }).then((res) => res.items || []),
  });

  const { data: seoPages = [] } = useQuery({
    queryKey: ["website-seo-pages"],
    queryFn: () => base44.entities.WebsiteSeoPage.list({ limit: 100 }).then((res) => res.items || []),
  });

  const { data: audits = [] } = useQuery({
    queryKey: ["website-seo-audits"],
    queryFn: () =>
      base44.entities.WebsiteSeoAudit.list({ sort: "-created_date", limit: 5 }).then((res) => res.items || []),
  });

  const { data: settings } = useQuery({
    queryKey: ["website-settings"],
    queryFn: () => base44.entities.WebsiteSettings.list({ limit: 1 }).then((res) => (res.items || [])[0] || null),
  });

  const audit = audits[0] || null;

  const livePages = useMemo(
    () =>
      pages
        .filter((page) => page.is_visible !== false && !page.is_archived)
        .sort((a, b) => Number(b.is_home) - Number(a.is_home) || (a.display_order || 0) - (b.display_order || 0)),
    [pages]
  );

  const seoByKey = useMemo(() => {
    const map = {};
    seoPages.forEach((record) => {
      map[record.page_key] = record;
    });
    return map;
  }, [seoPages]);

  const stats = useMemo(
    () => ({
      total: livePages.length,
      titled: livePages.filter((page) => seoByKey[page.page_key]?.meta_title).length,
      described: livePages.filter((page) => seoByKey[page.page_key]?.meta_description).length,
      keywords: audit?.keywords?.length || 0,
    }),
    [livePages, seoByKey, audit]
  );

  const runAudit = async () => {
    setIsRunning(true);
    try {
      const response = await base44.functions.invoke("websiteSeoAssistant", { action: "audit" });
      if (response.data?.error) throw new Error(response.data.error);
      await queryClient.invalidateQueries({ queryKey: ["website-seo-audits"] });
      toast({ title: "Review finished", description: "The findings are below." });
    } catch (error) {
      toast({ variant: "destructive", title: "The review could not finish", description: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const generateMeta = async (page) => {
    setGeneratingKey(page.page_key);
    try {
      const response = await base44.functions.invoke("websiteSeoAssistant", {
        action: "generate_meta",
        page_key: page.page_key,
        page_label: page.label,
        path: page.path,
      });
      if (response.data?.error) throw new Error(response.data.error);
      await queryClient.invalidateQueries({ queryKey: ["website-seo-pages"] });
      toast({ title: "Search settings written", description: `The AI wrote the title and description for ${page.label}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Could not write the settings", description: error.message });
    } finally {
      setGeneratingKey("");
    }
  };

  const saveMeta = async (page, values) => {
    setIsSaving(true);
    try {
      const existing = seoByKey[page.page_key];
      const payload = { ...values, page_key: page.page_key, page_label: page.label, path: page.path || "" };
      if (existing) await base44.entities.WebsiteSeoPage.update(existing.id, payload);
      else await base44.entities.WebsiteSeoPage.create(payload);
      await queryClient.invalidateQueries({ queryKey: ["website-seo-pages"] });
      setEditingPage(null);
      toast({ title: "Saved", description: `${page.label} search settings updated.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Could not save", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Website Studio</p>
          <h1 className="font-display text-3xl font-bold text-foreground mt-1">Search &amp; AI visibility</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            How the site is found on Google, in maps and in AI answers — reviewed by the AI against the real copy on
            every page, with the changes written out for you.
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/website/presence">
              <MapPin className="w-4 h-4" /> Online presence
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link to="/website/ads">
              <Megaphone className="w-4 h-4" /> Ads
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <SeoScoreCard audit={audit} stats={stats} isRunning={isRunning} onRun={runAudit} />
        </div>
        <AiSearchCard notes={audit?.ai_search_notes} />
      </div>

      {isRunning && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Reading every page of the site…
        </div>
      )}

      <SeoFindingsList findings={audit?.findings || []} quickWins={audit?.quick_wins || []} />

      <SeoPageTable
        pages={livePages}
        seoByKey={seoByKey}
        generatingKey={generatingKey}
        onGenerate={generateMeta}
        onEdit={setEditingPage}
      />

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <KeywordIdeasCard keywords={audit?.keywords || []} />
        <StructuredDataCard settings={settings} />
      </div>

      <SeoMetaDialog
        open={!!editingPage}
        onOpenChange={(open) => !open && setEditingPage(null)}
        page={editingPage}
        record={editingPage ? seoByKey[editingPage.page_key] : null}
        isSaving={isSaving}
        onSave={saveMeta}
      />
    </div>
  );
}