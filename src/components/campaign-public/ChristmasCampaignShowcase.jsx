import React, { useEffect, useRef, useState } from 'react';
import CampaignDonate from '@/components/campaign-public/CampaignDonate';
import ChristmasIntro from '@/components/campaign-public/ChristmasIntro';
import ChristmasPillarCard from '@/components/campaign-public/ChristmasPillarCard';
import ChristmasGifting from '@/components/campaign-public/ChristmasGifting';
import ChristmasCombinedGiving from '@/components/campaign-public/ChristmasCombinedGiving';
import ChristmasInfo from '@/components/campaign-public/ChristmasInfo';
import { pillarShortLabel } from '@/lib/campaignDisplay';
import { activePillars, raisedForPillar } from '@/lib/christmasCampaign';

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
    <div className="space-y-9">
      <ChristmasIntro campaign={campaign} raised={campaign.raised} />

      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-extrabold">Three ways to make a difference</h2>
          <p className="text-sm text-muted-foreground">
            Each one is its own gift. Choose where you would like to help.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map((pillar) => (
            <ChristmasPillarCard
              key={pillar.id}
              campaign={campaign}
              pillar={pillar}
              raised={raisedForPillar(campaign, pillar.id)}
              onGive={openGiving}
            />
          ))}
        </div>
      </section>

      <section
        ref={givingRef}
        className="grid scroll-mt-4 gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start"
      >
        <div className="space-y-3 lg:sticky lg:top-6">
          <h2 className="font-display text-xl font-extrabold">Make your gift</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Choose a cause above, pick one of its amounts or give one of your own. Every gift helps,
            and gifts of any size are appreciated.
          </p>
          <ul className="space-y-1.5 text-sm text-foreground/80">
            <li>Secure card payment — your card details stay with Stripe.</li>
            <li>Guest gifts welcome; no account needed.</li>
            <li>Add a Christmas card and send your gift in someone’s honour.</li>
          </ul>
        </div>

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
      </section>

      {campaign.enable_gifting && (
        <ChristmasGifting campaign={campaign} onAddGift={() => openGiving(pillarId)} />
      )}

      <ChristmasCombinedGiving onGiveAll={() => openGiving('')} />

      <ChristmasInfo campaign={campaign} />
    </div>
  );
}