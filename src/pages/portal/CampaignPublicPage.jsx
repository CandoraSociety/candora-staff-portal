import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, Loader2, Mail, XCircle } from 'lucide-react';
import CampaignHero from '@/components/campaign-public/CampaignHero';
import CampaignDonate from '@/components/campaign-public/CampaignDonate';
import CampaignPillars from '@/components/campaign-public/CampaignPillars';
import DonationFooter from '@/components/campaign-public/DonationFooter';
import CandoraGarland from '@/components/campaign-public/CandoraGarland';
import moment from 'moment';

// A campaign's public page — standalone, no staff sign-in. Supporters read the
// appeal and give by card; everything else in the portal stays behind login.
export default function CampaignPublicPage({ campaignSlug, returnPath, children }) {
  const { slug: routeSlug } = useParams();
  const slug = campaignSlug || routeSlug;
  // A pillar's own share link opens this page already giving to that cause.
  const [pillarId, setPillarId] = useState(
    () => new URLSearchParams(window.location.search).get('pillar') || ''
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-campaign', slug],
    queryFn: async () => (await base44.functions.invoke('getPublicCampaign', { slug })).data,
    retry: false,
  });

  // What a link to this page looks like when it is shared — the campaign's own
  // name, its tagline and the sharing picture staff chose.
  useEffect(() => {
    const campaign = data?.campaign;
    if (!campaign) return;

    const previousTitle = document.title;
    const title = `${campaign.name} · Candora Society`;
    const description = campaign.tagline || campaign.description || '';
    const image = campaign.share_image_url || campaign.hero_image_url || '';

    const tags = [
      ['name', 'description', description],
      ['property', 'og:title', title],
      ['property', 'og:description', description],
      ['property', 'og:type', 'website'],
      ['name', 'twitter:card', 'summary_large_image'],
      ['name', 'twitter:title', title],
      ['name', 'twitter:description', description],
    ];
    if (image) {
      tags.push(['property', 'og:image', image]);
      tags.push(['name', 'twitter:image', image]);
    }

    document.title = title;
    const added = tags
      .filter(([, , value]) => !!value)
      .map(([attr, key, value]) => {
        const tag = document.createElement('meta');
        tag.setAttribute(attr, key);
        tag.setAttribute('content', value);
        document.head.appendChild(tag);
        return tag;
      });

    return () => {
      added.forEach((tag) => tag.remove());
      document.title = previousTitle;
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data?.campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-3 max-w-sm">
          <XCircle className="w-8 h-8 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-display font-bold">This campaign page isn't available</h1>
          <p className="text-sm text-muted-foreground">
            The link may be incorrect, or the campaign page may not be published yet.
          </p>
        </div>
      </div>
    );
  }

  const { campaign, raised, giftCount, preview, pillars: pillarTotals = [] } = data;
  const ended = campaign.end_date && moment(campaign.end_date).endOf('day').isBefore(moment());
  const closed = campaign.is_active === false || ended;
  const paragraphs = String(campaign.story || '').split(/\n{2,}/).filter(Boolean);
  const gift = new URLSearchParams(window.location.search).get('gift');

  return (
    <div className="relative min-h-screen bg-background">
      {preview && (
        <div className="bg-amber-100 text-amber-900 text-center text-xs py-2 px-4">
          Staff preview — this page is not published yet, so visitors can't open it.
        </div>
      )}

      <CampaignHero campaign={campaign} raised={raised} />

      <CandoraGarland
        campaign={campaign}
        variant="top"
        className="mx-auto block w-full max-w-4xl"
      />

      <main className="relative w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-10 grid gap-8 lg:gap-14 lg:grid-cols-[minmax(0,1.75fr)_minmax(340px,1fr)] lg:items-start">
        <article className="space-y-6">
          {campaign.description && (
            <p className="text-lg text-foreground/90 leading-relaxed">{campaign.description}</p>
          )}

          <CampaignPillars
            campaign={campaign}
            totals={pillarTotals}
            selectedPillarId={pillarId}
            onSelect={setPillarId}
          />

          {paragraphs.length > 0 ? (
            <div className="space-y-4 text-[15px] leading-relaxed text-foreground/85">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="whitespace-pre-line">{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">The full story for this campaign is coming soon.</p>
          )}

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-2xl font-display font-bold">{giftCount}</p>
              <p className="text-sm text-muted-foreground">gifts so far</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-2xl font-display font-bold">100%</p>
              <p className="text-sm text-muted-foreground">goes to the appeal</p>
            </div>
          </div>

          {campaign.contact_email && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Questions? <a className="underline" href={`mailto:${campaign.contact_email}`}>{campaign.contact_email}</a>
            </p>
          )}
        </article>

        <div className="lg:sticky lg:top-6 space-y-3">
          {gift === 'success' ? (
            <div className="rounded-2xl border bg-card p-6 text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
                <Heart className="w-7 h-7" />
              </div>
              <h2 className="font-display font-bold text-lg">Thank you for your gift</h2>
              <p className="text-sm text-muted-foreground">
                {campaign.thank_you_message || 'Your gift has been received — thank you for standing with us.'}
              </p>
              <a className="text-sm underline inline-block" href={window.location.pathname}>Give again</a>
            </div>
          ) : closed ? (
            <div className="rounded-2xl border bg-card p-6 text-center space-y-2">
              <h2 className="font-display font-bold text-lg">This campaign has closed</h2>
              <p className="text-sm text-muted-foreground">
                Thank you to everyone who gave. {campaign.contact_email ? 'Reach out to us to support our other work.' : ''}
              </p>
              {campaign.contact_email && (
                <a className="text-sm underline inline-block" href={`mailto:${campaign.contact_email}`}>{campaign.contact_email}</a>
              )}
            </div>
          ) : (
            <>
              {gift === 'cancelled' && (
                <p className="text-sm rounded-lg border bg-card px-3 py-2 text-muted-foreground">
                  Your gift wasn't completed — nothing was charged.
                </p>
              )}
              <CampaignDonate
                campaign={campaign}
                pillarId={pillarId}
                onSelectPillar={setPillarId}
                returnPath={returnPath}
              />
            </>
          )}
        </div>
      </main>

      {children}
      <DonationFooter />
    </div>
  );
}