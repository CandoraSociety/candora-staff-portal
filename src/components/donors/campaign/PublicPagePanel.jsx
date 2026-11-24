import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Globe, ImagePlus, Sparkles } from 'lucide-react';
import { activeTiers, campaignPagePath, publicCampaignUrl, slugify, tierAmountLabel } from '@/lib/donorConstants';
import HeroImageAiDialog from '@/components/donors/campaign/HeroImageAiDialog';
import PublicPageAiCopyDialog from '@/components/donors/campaign/PublicPageAiCopyDialog';

// Publishes the campaign's own page: its web address, whether it is live, and a
// link staff can open (or share) to see exactly what supporters see.
export default function PublicPagePanel({ campaign, onSave, onManageOptions }) {
  const [slug, setSlug] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSlug(campaign?.slug || slugify(campaign?.name));
    setEnabled(!!campaign?.public_page_enabled);
    setIsPrivate(!!campaign?.is_private);
  }, [campaign]);

  const url = publicCampaignUrl(slug);

  const submit = async () => {
    setSaving(true);
    await onSave({
      slug: slugify(slug) || slugify(campaign?.name),
      public_page_enabled: enabled,
      is_private: isPrivate,
    });
    setSaving(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display font-bold flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Public campaign page
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              A standalone page with the campaign story, progress and giving options. Anyone with the link can open it.
            </p>
          </div>
          <Badge className={enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}>
            {enabled ? 'Live' : 'Not published'}
          </Badge>
        </div>

        <div>
          <Label>Page address</Label>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">/campaign/</span>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)}
              onBlur={() => setSlug((value) => slugify(value))} placeholder="winter-warmth-appeal" />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">Lowercase letters, numbers and hyphens.</p>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span>
            Publish this page so supporters can open it and give online
            <span className="block text-xs text-muted-foreground">
              While unpublished, only signed-in staff can preview it.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
          <span>
            Private campaign — share by link only
            <span className="block text-xs text-muted-foreground">
              Keeps it out of the donation page, the campaign list and the website. The link above still works for anyone you send it to.
            </span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save page settings'}</Button>
          {slug && (
            <>
              <Button variant="outline" onClick={copy}>
                <Copy className="w-4 h-4 mr-2" /> {copied ? 'Copied' : 'Copy link'}
              </Button>
              <Button variant="outline" asChild>
                <a href={campaignPagePath(slug)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" /> {enabled ? 'Open page' : 'Preview page'}
                </a>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div>
          <h2 className="font-display font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Build the page with AI
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generate the hero photo from a description you type, or write the tagline, story and thank-you message from the campaign's details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {campaign?.hero_image_url ? (
            <img src={campaign.hero_image_url} alt="" className="h-20 w-32 rounded-lg object-cover border" />
          ) : (
            <div className="h-20 w-32 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
              <ImagePlus className="w-5 h-5" />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <HeroImageAiDialog campaign={campaign} onSave={onSave} />
            <PublicPageAiCopyDialog campaign={campaign} onSave={onSave} />
          </div>
        </div>

        {campaign?.tagline && (
          <p className="text-sm"><span className="text-muted-foreground">Current tagline:</span> {campaign.tagline}</p>
        )}
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display font-bold">Giving options on this page</h2>
            <p className="text-sm text-muted-foreground mt-1">
              The donation products supporters pick from. Each one is created in Stripe automatically when saved.
            </p>
          </div>
          {onManageOptions && (
            <Button variant="outline" size="sm" onClick={onManageOptions}>Manage options</Button>
          )}
        </div>

        {activeTiers(campaign).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No options yet — supporters can give any amount they choose.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeTiers(campaign).map((option) => (
              <span key={option.id}
                className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-sm">
                <span>{option.name}</span>
                <span className="font-semibold">{tierAmountLabel(option)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-dashed bg-muted/40 p-5 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">What supporters see</p>
        <p>The hero photo, name, tagline and progress toward the goal, then your story, the giving options, and a donate box where they choose an amount and pay by card.</p>
        <p>Gifts paid on the page land in this campaign's gift list and on the donor's record.</p>
      </div>
    </div>
  );
}