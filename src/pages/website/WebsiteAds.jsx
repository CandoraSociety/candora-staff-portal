import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Megaphone, Search, Rocket } from "lucide-react";
import AdsBriefDialog from "@/components/website/ads/AdsBriefDialog";
import AdsCampaignCard from "@/components/website/ads/AdsCampaignCard";

// Paid promotion for the public site. The AI writes the campaign from the site's
// real pages and programs; the money and launch happen in Marketing → Google Ads,
// and the campaign's status is kept here.
export default function WebsiteAds() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [plan, setPlan] = useState(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["website-ads-campaigns"],
    queryFn: () =>
      base44.entities.WebsiteAdsCampaign.list({ sort: "-created_date", limit: 100 }).then((res) => res.items || []),
  });

  const { data: settings } = useQuery({
    queryKey: ["website-settings"],
    queryFn: () => base44.entities.WebsiteSettings.list({ limit: 1 }).then((res) => (res.items || [])[0] || null),
  });

  const { data: pages = [] } = useQuery({
    queryKey: ["website-pages-menu"],
    queryFn: () => base44.entities.WebsitePage.list({ sort: "display_order", limit: 100 }).then((res) => res.items || []),
  });

  const { data: publications = [] } = useQuery({
    queryKey: ["website-ads-publications"],
    queryFn: () =>
      base44.entities.WebsitePublication.filter({ status: "published" }, { sort: "event_start", limit: 30 }).then(
        (res) => res.items || []
      ),
  });

  // What the organization actually offers, handed to the AI so it never invents
  // a program, price or phone number.
  const digest = useMemo(
    () =>
      [
        settings?.site_name,
        settings?.tagline,
        settings?.about_summary,
        settings?.contact_address,
        pages.length ? `Website pages: ${pages.map((page) => page.label).join(", ")}` : "",
        publications.length
          ? `Published programs and events: ${publications.map((item) => item.title).join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    [settings, pages, publications]
  );

  const generate = async (brief) => {
    setIsPlanning(true);
    try {
      const response = await base44.functions.invoke("websiteSeoAssistant", {
        action: "ads_plan",
        brief,
        digest,
      });
      if (response.data?.error) throw new Error(response.data.error);
      setPlan({ ...response.data.plan, planned_by: response.data.planned_by });
    } catch (error) {
      toast({ variant: "destructive", title: "The campaign could not be written", description: error.message });
    } finally {
      setIsPlanning(false);
    }
  };

  const save = async (brief, generated) => {
    setIsSaving(true);
    try {
      await base44.entities.WebsiteAdsCampaign.create({
        name: brief.name,
        objective: brief.objective,
        channel: brief.channel,
        status: "ready",
        budget_total: Number(brief.budget_total) || null,
        budget_daily: Number(brief.budget_daily) || null,
        audience: brief.audience,
        offer: brief.offer,
        landing_page: brief.landing_page,
        keywords: generated.keywords || [],
        negative_keywords: generated.negative_keywords || [],
        headlines: generated.headlines || [],
        descriptions: generated.descriptions || [],
        call_to_action: generated.call_to_action || "",
        targeting_notes: generated.targeting_notes || "",
        projected_clicks: generated.projected_clicks ?? null,
        projected_conversions: generated.projected_conversions ?? null,
        projected_cost_per_click: generated.projected_cost_per_click ?? null,
        ai_notes: generated.ai_notes || "",
        launch_notes: generated.launch_notes || "",
        created_by_name: generated.planned_by || "",
      });
      await queryClient.invalidateQueries({ queryKey: ["website-ads-campaigns"] });
      setDialogOpen(false);
      setPlan(null);
      toast({ title: "Campaign saved", description: "It is marked ready to launch." });
    } catch (error) {
      toast({ variant: "destructive", title: "Could not save the campaign", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const changeStatus = async (campaign, status) => {
    try {
      await base44.entities.WebsiteAdsCampaign.update(campaign.id, { status });
      await queryClient.invalidateQueries({ queryKey: ["website-ads-campaigns"] });
    } catch (error) {
      toast({ variant: "destructive", title: "Could not update the campaign", description: error.message });
    }
  };

  const ready = campaigns.filter((campaign) => campaign.status === "ready").length;
  const live = campaigns.filter((campaign) => campaign.status === "live").length;

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Website Studio</p>
          <h1 className="font-display text-3xl font-bold text-foreground mt-1">Ads &amp; promotion</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Plan a paid campaign and the AI writes the headlines, the phrases to bid on and what the budget should
            return — using your real pages and programs.
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/website/seo">
              <Search className="w-4 h-4" /> Search visibility
            </Link>
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              setPlan(null);
              setDialogOpen(true);
            }}
          >
            <Megaphone className="w-4 h-4" /> Plan a campaign
          </Button>
        </div>
      </header>

      <Card className="border-primary/25 bg-primary/5 shadow-sm">
        <CardContent className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Rocket className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Launching and funding happen in Marketing → Google Ads</p>
              <p className="text-xs text-muted-foreground mt-1">
                Plans saved here are the approved brief and copy. Take them to the Marketing → Google Ads page in the
                app dashboard to set the budget and go live, then mark the campaign live here so everyone can see it.
              </p>
            </div>
          </div>
          <div className="flex gap-4 flex-shrink-0">
            <div className="text-center">
              <p className="font-display text-xl font-bold text-foreground">{ready}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ready</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl font-bold text-success">{live}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Live</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading campaigns…
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="border-dashed border-border shadow-none">
          <CardContent className="p-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No campaigns planned yet.</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Megaphone className="w-4 h-4" /> Plan the first campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {campaigns.map((campaign) => (
            <AdsCampaignCard key={campaign.id} campaign={campaign} onStatusChange={changeStatus} />
          ))}
        </div>
      )}

      <AdsBriefDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setPlan(null);
        }}
        plan={plan}
        isPlanning={isPlanning}
        isSaving={isSaving}
        onGenerate={generate}
        onSave={save}
        onDiscard={() => setPlan(null)}
      />
    </div>
  );
}