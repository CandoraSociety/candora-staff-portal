import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Globe2, CalendarDays, FileText, Newspaper, ArrowUpRight, Sparkles, Radio, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatWebsiteDate } from "@/lib/websiteManager";

export default function WebsiteHome() {
  const { data: publications = [], isLoading: loadingPublications } = useQuery({
    queryKey: ["website-publications"],
    queryFn: () =>
      base44.entities.WebsitePublication
        .list({ sort: "-created_date", limit: 200 })
        .then((res) => res.items || []),
  });

  const { data: news = [] } = useQuery({
    queryKey: ["website-news"],
    queryFn: () =>
      base44.entities.WebsiteNewsPost.list({ sort: "-publish_date", limit: 100 }).then((res) => res.items || []),
  });

  const published = publications.filter((p) => p.status === "published" && p.advertise !== false);
  const drafts = publications.filter((p) => (p.advertise === false ? false : p.status !== "published"));
  const notAdvertised = publications.filter((p) => p.advertise === false);
  const publishedNews = news.filter((p) => p.status === "published");

  const lastSync = publications
    .map((p) => p.last_synced_at)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  const stats = [
    { label: "Live on the site", value: published.length, icon: CalendarDays, tone: "text-primary" },
    { label: "News published", value: publishedNews.length, icon: Newspaper, tone: "text-accent" },
    { label: "Drafts waiting", value: drafts.length, icon: FileText, tone: "text-warning" },
    { label: "Not advertised", value: notAdvertised.length, icon: Radio, tone: "text-muted-foreground" },
  ];

  const recent = publications.slice(0, 4);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Website Studio</p>
          <h1 className="font-display text-3xl font-bold text-foreground mt-1">Your public website, managed here</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Publish programs and events from Candora 360, edit the pages supporters see, and post news — all within
            the layouts the public site is built on.
          </p>
        </div>
        <Button asChild size="lg" className="gap-2 self-start sm:self-auto">
          <Link to="/website/events">
            <Sparkles className="w-4 h-4" /> Publish an item
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-border/70 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <Icon className={`w-4 h-4 ${stat.tone}`} />
                </div>
                <p className="font-display text-2xl font-bold text-foreground mt-2">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 border-border/70 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-foreground">Recently set up</h2>
              <Link to="/website/events" className="text-xs font-semibold text-primary inline-flex items-center gap-1">
                All items <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingPublications ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : recent.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No website pages set up yet.</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link to="/website/events">Set up the first page</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recent.map((item) => {
                  const status = item.advertise === false ? "Not advertised" : item.status === "published" ? "Published" : "Draft";
                  return (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.source_type === "program" ? "Program" : "Event"}
                          {item.event_start ? ` · ${formatWebsiteDate(item.event_start)}` : ""}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full flex-shrink-0 ${
                          status === "Published"
                            ? "bg-success/10 text-success"
                            : status === "Draft"
                            ? "bg-muted text-muted-foreground"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/25 bg-primary/5 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-primary" />
                <h2 className="font-display text-lg font-bold text-foreground">How publishing works</h2>
              </div>
              <ol className="space-y-3 text-sm text-muted-foreground">
                {[
                  "A program or event is created in Candora 360.",
                  "The setup wizard pre-fills its public details for you to review.",
                  "Publish, or choose “Do not advertise” to keep it off the site.",
                  "The public page and home-page listing update automatically.",
                ].map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="flex items-center gap-2 text-xs text-success pt-2 border-t border-primary/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Only approved public fields ever leave Candora 360.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-primary" />
                <h2 className="font-display text-base font-bold text-foreground">Website feed</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                {lastSync
                  ? `Last synced from Candora 360 on ${formatWebsiteDate(lastSync, true)}.`
                  : "The feed updates as soon as a page is published."}
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/website/feed">View feed details</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}