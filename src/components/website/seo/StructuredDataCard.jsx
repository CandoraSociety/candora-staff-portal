import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, Copy, Check } from "lucide-react";

// The Organization structured data built from the site's own details — the block
// search engines read to learn the legal name, address, phone and social
// profiles. It is generated from real settings, so it never drifts from the site.
export default function StructuredDataCard({ settings }) {
  const [copied, setCopied] = useState(false);

  const jsonLd = useMemo(() => {
    const data = {
      "@context": "https://schema.org",
      "@type": settings?.charity_number ? "NGO" : "LocalBusiness",
      name: settings?.site_name || "Candora",
      description: settings?.about_summary || settings?.tagline || "",
      telephone: settings?.contact_phone || "",
      email: settings?.contact_email || "",
      address: {
        "@type": "PostalAddress",
        streetAddress: settings?.contact_address || "",
        addressLocality: "Edmonton",
        addressRegion: "AB",
        addressCountry: "CA",
      },
      sameAs: (settings?.social_links || []).map((link) => link.url).filter(Boolean),
    };
    if (settings?.public_site_url) data.url = settings.public_site_url;
    if (settings?.logo_url) data.logo = settings.logo_url;
    return JSON.stringify(data, null, 2);
  }, [settings]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonLd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Organization details for search engines</h2>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Built from the name, address, phone and social links in Site Settings. Give this to whoever maintains
          the live website to place in the page head.
        </p>
        <pre className="text-[11px] leading-relaxed bg-muted/60 rounded-lg p-3 overflow-x-auto max-h-64 text-foreground">
          {jsonLd}
        </pre>
      </CardContent>
    </Card>
  );
}