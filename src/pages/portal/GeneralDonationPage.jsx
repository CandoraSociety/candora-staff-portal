import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, Loader2, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CampaignDonate from '@/components/campaign-public/CampaignDonate';
import CampaignsDirectory from '@/components/campaign-public/CampaignsDirectory';

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

  const gift = new URLSearchParams(window.location.search).get('gift');
  const general = data?.general;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-10 sm:pb-12 space-y-8">
          <div className="flex items-center gap-3">
            <img
              src="https://media.base44.com/images/public/6a249282cb496579542673b7/418f6d576_logo.png"
              alt="Candora"
              className="h-10 w-auto"
            />
            <div className="text-sm font-semibold tracking-wide text-sidebar-foreground/80">Candora Society</div>
          </div>

          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold leading-tight">Make a donation</h1>
            <p className="text-base text-sidebar-foreground/85">
              {general?.tagline || 'Your gift supports our programs and the people who count on them.'}
            </p>
          </div>
        </div>
      </header>

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
          <Tabs defaultValue="give">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="give">Give now</TabsTrigger>
              <TabsTrigger value="campaigns">
                Campaigns{data?.campaigns?.length ? ` (${data.campaigns.length})` : ''}
              </TabsTrigger>
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
              <CampaignsDirectory campaigns={data?.campaigns || []} />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <footer className="border-t bg-sidebar text-sidebar-foreground">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="https://media.base44.com/images/public/6a249282cb496579542673b7/418f6d576_logo.png"
              alt="Candora"
              className="h-8 w-auto"
            />
            <span className="text-sm text-sidebar-foreground/70">Candora Society</span>
          </div>
          <p className="text-xs text-sidebar-foreground/50">
            Gifts are processed securely. Thank you for supporting our community.
          </p>
        </div>
      </footer>
    </div>
  );
}