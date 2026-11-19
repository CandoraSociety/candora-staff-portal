import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, Loader2, Mail, XCircle } from 'lucide-react';
import CampaignHero from '@/components/campaign-public/CampaignHero';
import CampaignDonate from '@/components/campaign-public/CampaignDonate';
import CandoraBrandLockup from '@/components/campaign-public/CandoraBrandLockup';
import { CANDORA_BRAND, brandFooterLines } from '@/lib/candoraBrand';
import moment from 'moment';

// A campaign's public page — standalone, no staff sign-in. Supporters read the
// appeal and give by card; everything else in the portal stays behind login.
export default function CampaignPublicPage() {
  const { slug } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-campaign', slug],
    queryFn: async () => (await base44.functions.invoke('getPublicCampaign', { slug })).data,
    retry: false,
  });

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

  const { campaign, raised, giftCount, preview } = data;
  const ended = campaign.end_date && moment(campaign.end_date).endOf('day').isBefore(moment());
  const closed = campaign.is_active === false || ended;
  const paragraphs = String(campaign.story || '').split(/\n{2,}/).filter(Boolean);
  const gift = new URLSearchParams(window.location.search).get('gift');

  return (
    <div className="min-h-screen bg-background">
      {preview && (
        <div className="bg-amber-100 text-amber-900 text-center text-xs py-2 px-4">
          Staff preview — this page is not published yet, so visitors can't open it.
        </div>
      )}

      <CampaignHero campaign={campaign} raised={raised} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <article className="space-y-6">
          {campaign.description && (
            <p className="text-lg text-foreground/90 leading-relaxed">{campaign.description}</p>
          )}

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
              <CampaignDonate campaign={campaign} />
            </>
          )}
        </div>
      </main>

      <footer className="bg-sidebar text-sidebar-foreground border-t border-sidebar-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-wrap items-start justify-between gap-6">
          <CandoraBrandLockup compact />
          <div className="text-xs text-sidebar-foreground/70 space-y-1">
            {brandFooterLines().map((line) => <p key={line}>{line}</p>)}
          </div>
          <p className="text-xs text-sidebar-foreground/50 max-w-xs">
            Gifts are processed securely. Thank you for supporting {CANDORA_BRAND.name}.
          </p>
        </div>
      </footer>
    </div>
  );
}