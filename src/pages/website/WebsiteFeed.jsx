import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Copy, Check, Radio, RefreshCw, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ENDPOINT = "https://candora-360.base44.app/functions/getPublicWebsiteContent";

export default function WebsiteFeed() {
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["website-public-feed"],
    queryFn: () => base44.functions.invoke("getPublicWebsiteContent", {}).then((res) => res.data),
  });

  const copyEndpoint = async () => {
    await navigator.clipboard.writeText(ENDPOINT);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const counts = data?.counts || { events: 0, news: 0, sections: 0 };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Website Studio</p>
        <h1 className="font-display text-3xl font-bold text-foreground mt-1">Website Feed</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          The separate website app reads everything it publishes from this one feed. Only published pages, news and
          approved public fields are included — nothing else from Candora 360 leaves the app.
        </p>
      </header>

      <Card className="border-border/70">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Feed address</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <code className="flex-1 rounded-lg bg-muted px-3 py-2.5 text-xs text-foreground break-all">
              {ENDPOINT}
            </code>
            <Button variant="outline" onClick={copyEndpoint} className="flex-shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Point the website app's data source at this address. It returns JSON and needs no sign-in, because it only
            contains content that is already public.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Events live", value: counts.events },
          { label: "News live", value: counts.news },
          { label: "Content blocks", value: counts.sections },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/70">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="font-display text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/70">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">What the website receives</h2>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Refresh
            </Button>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
            <li>Site settings, contact details and footer.</li>
            <li>Visible content blocks for each page, in order.</li>
            <li>Published news posts.</li>
            <li>Events and programs that are published and advertised, with their page path.</li>
            <li>
              Giving pages read their own public endpoints: the general fund and open campaigns with their progress, and
              checkout starts through the donor portal so every gift is recorded in one place.
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Drafts, items set to “Do not advertise”, and every other Candora 360 record stay out of the feed.
          </p>
          {isLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Reading the live feed…
            </div>
          ) : (
            <pre className="max-h-72 overflow-auto rounded-lg bg-muted p-4 text-[11px] leading-relaxed text-foreground">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}