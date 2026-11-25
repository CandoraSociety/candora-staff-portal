import React, { useState } from 'react';
import CampaignPublicPage from '@/pages/portal/CampaignPublicPage';
import CampaignsDirectory from '@/components/campaign-public/CampaignsDirectory';
import GeneralDonationHeader from '@/components/campaign-public/GeneralDonationHeader';
import GeneralDonationContent from '@/components/campaign-public/GeneralDonationContent';
import DonationFooter from '@/components/campaign-public/DonationFooter';
import DonationTabBar from '@/components/campaign-public/DonationTabBar';
import { findChristmasCampaign } from '@/lib/christmasCampaign';

// The public donation portal once its campaigns have loaded: one tab for the
// campaigns still accepting gifts, one for a gift to the general fund.
export default function DonationPortal({ data }) {
  const params = new URLSearchParams(window.location.search);
  const gift = params.get('gift');
  const campaigns = data?.campaigns || [];
  const featured =
    campaigns.find((campaign) => campaign.slug === 'christmas-2026') ||
    findChristmasCampaign(campaigns);

  const [tab, setTab] = useState(() =>
    ['general', 'give'].includes(params.get('tab'))
      ? 'give'
      : params.get('campaign') || params.get('pillar') || featured
        ? 'campaigns'
        : 'give'
  );
  const [slug, setSlug] = useState(() => params.get('campaign') || featured?.slug || '');

  const selected = campaigns.find((campaign) => campaign.slug === slug) || featured;
  const others = campaigns.filter((campaign) => campaign.id !== selected?.id);

  return (
    <div className="min-h-screen bg-background">
      <nav aria-label="Donation options" className="bg-sidebar text-sidebar-foreground border-t-4 border-primary">
        <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-3">
          <DonationTabBar
            tab={tab}
            onChange={setTab}
            campaigns={campaigns}
            activeSlug={selected?.slug || ''}
            onSelectCampaign={(nextSlug) => {
              setSlug(nextSlug);
              setTab('campaigns');
            }}
          />
        </div>
      </nav>

      {tab === 'campaigns' ? (
        selected ? (
          <CampaignPublicPage key={selected.slug} campaignSlug={selected.slug} returnPath="/donate">
            {others.length > 0 && (
              <section className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 pb-10">
                <CampaignsDirectory campaigns={others} />
              </section>
            )}
          </CampaignPublicPage>
        ) : (
          <main className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-10">
            <CampaignsDirectory campaigns={campaigns} />
          </main>
        )
      ) : (
        <>
          <GeneralDonationHeader general={data?.general} />
          <main className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-8">
            <GeneralDonationContent general={data?.general} gift={gift} />
          </main>
          <DonationFooter />
        </>
      )}
    </div>
  );
}