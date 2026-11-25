import React from 'react';
import { formatMoney } from '@/lib/donorConstants';
import { CHRISTMAS_HEADLINE, CHRISTMAS_INTRO } from '@/lib/christmasCampaign';
import { CHRISTMAS_ARTWORK } from '@/lib/christmasArtwork';

// Section A of the campaigns page: a compact Christmas header. It carries the
// campaign's shared identity and hands straight over to the three causes, so it
// never pushes them below the fold and never links to another campaign page.
// The wreath is set into the header itself, on the navy, with its white sheet
// screened away.
export default function ChristmasIntro({ campaign, raised = 0 }) {
  const goal = Number(campaign.goal_amount) || 0;
  const pct = goal ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  return (
    <header className="relative overflow-hidden rounded-3xl bg-[#0a0f29] text-white">
      <img
        src={CHRISTMAS_ARTWORK.wreath}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 top-1/2 hidden w-40 -translate-y-1/2 mix-blend-screen sm:block"
      />

      <div className="relative max-w-3xl space-y-3 px-5 py-7 sm:px-8 sm:py-9 lg:pr-36">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#fccf03]">
          Candora Christmas
        </p>
        <h2 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          {CHRISTMAS_HEADLINE}
        </h2>
        <p className="text-sm leading-relaxed text-white/80 sm:text-base">{CHRISTMAS_INTRO}</p>

        {goal > 0 && (
          <div className="max-w-sm pt-1">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-semibold text-[#fccf03]">{formatMoney(raised)} raised</span>
              <span className="text-white/50">of {formatMoney(goal)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-[#fccf03]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-[#fccf03]" />
    </header>
  );
}