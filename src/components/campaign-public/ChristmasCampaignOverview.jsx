import React from 'react';
import ChristmasIntro from '@/components/campaign-public/ChristmasIntro';
import ChristmasPillarCard from '@/components/campaign-public/ChristmasPillarCard';
import { raisedForPillar } from '@/lib/christmasCampaign';

export default function ChristmasCampaignOverview({ campaign, pillars, onGive }) {
  return (
    <article className="min-w-0 space-y-9">
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
              onGive={onGive}
            />
          ))}
        </div>
      </section>
      <section className="space-y-3">
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
      </section>
    </article>
  );
}