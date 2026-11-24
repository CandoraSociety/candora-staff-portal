import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink } from 'lucide-react';
import { publicCampaignUrl } from '@/lib/donorConstants';
import { qrImageUrl } from '@/lib/giftShopElf';

// The campaign's own link plus a link for each cause, ready to copy or print as
// a QR code for posters, cards and table tents.
export default function CampaignShareLinks({ campaign }) {
  const [copied, setCopied] = useState('');

  const base = publicCampaignUrl(campaign?.slug);
  const pillars = (campaign?.pillars || []).filter((pillar) => pillar.is_active !== false);

  const links = [
    { id: 'campaign', name: campaign?.name || 'Campaign page', url: base },
    ...pillars.map((pillar) => ({
      id: pillar.id,
      name: pillar.name,
      url: `${base}?pillar=${pillar.id}`,
    })),
  ];

  const copy = async (link) => {
    await navigator.clipboard.writeText(link.url);
    setCopied(link.id);
    setTimeout(() => setCopied(''), 2000);
  };

  if (!campaign?.public_page_enabled) {
    return (
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-display font-bold">Promotion & sharing</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Publish the campaign's page first — the links and QR codes below only work once it is live.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-display font-bold">Promotion & sharing</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Share the whole campaign or a single cause. A cause's link opens the page already giving to
          it, so a poster or a social post can speak to one pillar on its own.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {links.map((link) => (
          <div key={link.id} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm leading-tight">{link.name}</p>
                <p className="text-xs text-muted-foreground break-all mt-1">{link.url}</p>
              </div>
              {link.id === 'campaign' && (
                <Badge className="bg-blue-100 text-blue-700 shrink-0">Main</Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <img
                src={qrImageUrl(link.url, 220)}
                alt={`QR code for ${link.name}`}
                className="h-24 w-24 rounded-lg border bg-white p-1"
              />
              <div className="flex flex-col gap-1">
                <Button variant="outline" size="sm" onClick={() => copy(link)}>
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> {copied === link.id ? 'Copied' : 'Copy link'}
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href={link.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}