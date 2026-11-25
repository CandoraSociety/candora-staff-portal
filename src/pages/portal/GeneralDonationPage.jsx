import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, Loader2, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CampaignDonate from '@/components/campaign-public/CampaignDonate';
import CampaignsDirectory from '@/components/campaign-public/CampaignsDirectory';
import CandoraBrandLockup from '@/components/campaign-public/CandoraBrandLockup';
import CandoraGarland from '@/components/campaign-public/CandoraGarland';
import { CANDORA_BRAND, brandFooterLines } from '@/lib/candoraBrand';
import { findChristmasCampaign } from '@/lib/christmasCampaign';

// The organization's general donation page — standalone and public. One tab
// takes a gift to the general fund (preset amounts or one of the supporter's
// choosing), the other shows every campaign that is still open and the giving
// options each one offers.
export default function GeneralDonationPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['general-donations'],
    queryFn: async () => (await base44.functions.invoke('getGeneralDonations', {})).data,
    retry: false,
  });

  const params = new URLSearchParams(window.location.search);
  const gift = params.get('gift');
  const campaignParam = params.get('campaign');
  const pillarParam = params.get('pillar') || '';
  const general = data?.general;
  // While the Christmas appeal is running, the page opens on it: the three
  // causes are the first thing a visitor sees, not a tab they have to find.
  const christmasCampaign = findChristmasCampaign(data?.campaigns || []);
  const christmasOpen = !!christmasCampaign;
  const defaultTab = campaignParam || pillarParam || christmasOpen ? 'campaigns' : 'give';

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-sidebar text-sidebar-foreground border-t-4 border-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-10 sm:pb-12 space-y-8">
          <CandoraBrandLockup />

          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold leading-tight">Make a donation</h1>
            <div className="h-1 w-16 rounded-full bg-primary" />
            <p className="text-base text-sidebar-foreground/85">
              {general?.tagline || 'Your gift supports our programs and the people who count on them.'}
            </p>
          </div>
        </div>
      </header>

      <div className="relative">
        <CandoraGarland
          campaign={christmasCampaign}
          variant="side"
          className="hidden xl:block absolute right-2 top-0 h-[26rem]"
        />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="py-20 text-center space-y-2">
            <XCircle className="w-8 h-8 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-display font-bold">Donations aren't available right now</h2>
            <p className="text-sm text-muted-foreground">Please try again in a moment.</p>
          </div>
        ) : (
          <Tabs defaultValue={defaultTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="campaigns">
                Campaigns{data?.campaigns?.length ? ` (${data.campaigns.length})` : ''}
              </TabsTrigger>
              <TabsTrigger value="give">Give now</TabsTrigger>
            </TabsList>

            <TabsContent value="give" className="mt-6">
              {gift === 'success' ? (
                <div className="rounded-2xl border bg-card p-8 text-center space-y-3 max-w-md mx-auto">
                  <div className="h-14 w-14 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
                    <Heart className="w-7 h-7" />
                  </div>
                  <h2 className="font-display font-bold text-lg">Thank you for your gift</h2>
                  <p className="text-sm text-muted-foreground">
                    {general?.thank_you_message || 'Your gift has been received — thank you for standing with us.'}
                  </p>
                  <a className="text-sm underline inline-block" href="/donate">Give again</a>
                </div>
              ) : general ? (
                <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
                  <article className="space-y-4">
                    {general.description && (
                      <p className="text-lg text-foreground/90 leading-relaxed">{general.description}</p>
                    )}
                    <div className="rounded-xl border bg-card p-4">
                      <p className="text-2xl font-display font-bold">100%</p>
                      <p className="text-sm text-muted-foreground">of every gift goes to the work</p>
                    </div>
                    {gift === 'cancelled' && (
                      <p className="text-sm rounded-lg border bg-card px-3 py-2 text-muted-foreground">
                        Your gift wasn't completed — nothing was charged.
                      </p>
                    )}
                  </article>

                  <div className="lg:sticky lg:top-6">
                    <CampaignDonate
                      campaign={general}
                      heading="Give today"
                      subheading="Choose an amount, or give one of your own."
                      returnPath="/donate"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border bg-card p-10 text-center space-y-2">
                  <Heart className="w-6 h-6 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    General giving isn't set up yet. Please check the campaigns tab, or contact us to give.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="campaigns" className="mt-6">
              <CampaignsDirectory
                campaigns={data?.campaigns || []}
                initialPillarId={pillarParam}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
      </div>

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