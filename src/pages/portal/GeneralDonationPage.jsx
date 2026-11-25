import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CampaignPublicPage from '@/pages/portal/CampaignPublicPage';
import CampaignsDirectory from '@/components/campaign-public/CampaignsDirectory';
import GeneralDonationHeader from '@/components/campaign-public/GeneralDonationHeader';
import GeneralDonationContent from '@/components/campaign-public/GeneralDonationContent';
import DonationFooter from '@/components/campaign-public/DonationFooter';
import { findChristmasCampaign } from '@/lib/christmasCampaign';

export default function GeneralDonationPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['general-donations'],
    queryFn: async () => (await base44.functions.invoke('getGeneralDonations', {})).data,
    retry: false,
  });
  const params = new URLSearchParams(window.location.search);
  const campaigns = data?.campaigns || [];
  const featured = campaigns.find((campaign) => campaign.slug === 'christmas-2026') || findChristmasCampaign(campaigns);
  const others = campaigns.filter((campaign) => campaign.id !== featured?.id);
  const defaultTab = ['general', 'give'].includes(params.get('tab')) ? 'give'
    : params.get('campaign') || params.get('pillar') || featured ? 'campaigns' : 'give';

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (isError) return <div className="min-h-screen flex flex-col items-center justify-center gap-2 bg-background"><XCircle className="w-8 h-8 text-muted-foreground" /><h1 className="text-xl font-display font-bold">Donations aren't available right now</h1><p className="text-sm text-muted-foreground">Please try again in a moment.</p></div>;

  return (
    <Tabs defaultValue={defaultTab} className="min-h-screen bg-background">
      <nav aria-label="Donation options" className="bg-sidebar text-sidebar-foreground border-t-4 border-primary">
        <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-3">
          <TabsList><TabsTrigger value="campaigns">Campaigns</TabsTrigger><TabsTrigger value="give">General Donations</TabsTrigger></TabsList>
        </div>
      </nav>
      <TabsContent value="campaigns" className="mt-0">
        {featured ? <CampaignPublicPage campaignSlug={featured.slug} returnPath="/donate">
          {others.length > 0 && <section className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 pb-10"><CampaignsDirectory campaigns={others} /></section>}
        </CampaignPublicPage> : <main className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-10"><CampaignsDirectory campaigns={campaigns} /></main>}
      </TabsContent>
      <TabsContent value="give" className="mt-0">
        <GeneralDonationHeader general={data?.general} />
        <main className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-8"><GeneralDonationContent general={data?.general} gift={params.get('gift')} /></main>
        <DonationFooter />
      </TabsContent>
    </Tabs>
  );
}