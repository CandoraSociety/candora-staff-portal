import React, { useEffect, useRef, useState } from 'react';
import CampaignDonate from '@/components/campaign-public/CampaignDonate';
import ChristmasCampaignOverview from '@/components/campaign-public/ChristmasCampaignOverview';
import ChristmasGifting from '@/components/campaign-public/ChristmasGifting';
import ChristmasCombinedGiving from '@/components/campaign-public/ChristmasCombinedGiving';
import ChristmasInfo from '@/components/campaign-public/ChristmasInfo';
import CandoraGarland from '@/components/campaign-public/CandoraGarland';
import { pillarShortLabel } from '@/lib/campaignDisplay';
import { activePillars } from '@/lib/christmasCampaign';

// The whole Christmas appeal on one page: the shared introduction, the three
// causes with their own photographs and giving buttons, the Christmas gifting
// feature, combined giving and the short answers. A supporter can start a gift
// from any card without leaving the page.
export default function ChristmasCampaignShowcase({ campaign, initialPillarId = '' }) {
  const pillars = activePillars(campaign);
  const validInitial = pillars.some((pillar) => pillar.id === initialPillarId)
    ? initialPillarId
    : '';

  const [pillarId, setPillarId] = useState(validInitial);
  const [tierId, setTierId] = useState('');
  const givingRef = useRef(null);

  // A pillar's own link lands with that cause already chosen and its giving box
  // in view, so a shared link never needs the campaign page first.
  useEffect(() => {
    if (!validInitial) return;
    window.setTimeout(() => {
      givingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }, [validInitial]);

  const openGiving = (nextPillarId = '', nextTierId = '') => {
    setPillarId(nextPillarId);
    setTierId(nextTierId);
    window.setTimeout(() => {
      givingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const selected = pillars.find((pillar) => pillar.id === pillarId);

  return (
    <div className="relative space-y-9">
      <CandoraGarland
        campaign={campaign}
        variant="top"
        className="mx-auto block w-full max-w-4xl"
      />

      <div className="space-y-9 lg:grid lg:grid-cols-[minmax(0,1.75fr)_minmax(340px,1fr)] lg:items-start lg:gap-x-14 lg:gap-y-9 lg:space-y-0">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <ChristmasCampaignOverview campaign={campaign} pillars={pillars} onGive={openGiving} />
        </div>

        <aside
          ref={givingRef}
          className="min-w-0 scroll-mt-4 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:row-span-2"
          aria-label="Make your gift"
        >
          <CampaignDonate
            campaign={campaign}
            pillarId={pillarId}
            initialTierId={tierId}
            onSelectPillar={(nextId) => {
              setPillarId(nextId);
              setTierId('');
            }}
            heading={selected ? `Give to ${pillarShortLabel(selected)}` : 'Give to the Christmas campaign'}
            subheading={
              selected
                ? 'Choose an amount, or give one of your own.'
                : 'Choose a cause above, or give to all three together.'
            }
            returnPath="/donate"
          />
        </aside>

        <div className="min-w-0 space-y-9 lg:col-start-1 lg:row-start-2">
          {campaign.enable_gifting && (
            <ChristmasGifting campaign={campaign} onAddGift={() => openGiving(pillarId)} />
          )}
          <ChristmasCombinedGiving onGiveAll={() => openGiving('')} />
          <ChristmasInfo campaign={campaign} />
        </div>
      </div>

      <CandoraGarland
        campaign={campaign}
        variant="side"
        className="absolute right-0 top-0 hidden w-24 xl:block"
      />
    </div>
  );
}