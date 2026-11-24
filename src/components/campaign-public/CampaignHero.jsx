import React from 'react';
import { ExternalLink } from 'lucide-react';
import { formatMoney } from '@/lib/donorConstants';
import { imageFocalStyle } from '@/lib/campaignDisplay';
import CandoraBrandLockup from '@/components/campaign-public/CandoraBrandLockup';
import CandoraGarland from '@/components/campaign-public/CandoraGarland';

// The top of a campaign's public page: photo, name, tagline and progress, with
// Candora's seasonal artwork over it where staff have supplied it.
export default function CampaignHero({ campaign, raised }) {
  const goal = Number(campaign.goal_amount) || 0;
  const pct = goal ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const heroAlt = campaign.hero_image_alt || '';

  return (
    <header className="relative overflow-hidden bg-[#0a0f29] text-white">
      {campaign.hero_image_url && (
        <img
          src={campaign.hero_image_url}
          alt={heroAlt}
          className="absolute inset-0 h-full w-full object-cover"
          style={imageFocalStyle(campaign.hero_image_position)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f29] via-[#0a0f29]/85 to-[#0a0f29]/30" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0f29] to-transparent" />

      <CandoraGarland campaign={campaign} variant="top" className="absolute inset-x-0 top-0 h-20 sm:h-24" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-12 sm:pb-16">
        <div className="flex items-start justify-between gap-4">
          <CandoraBrandLockup />
          <a
            href="https://www.candora.ca"
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20 sm:text-sm"
          >
            <ExternalLink className="w-4 h-4" /> Visit candora.ca
          </a>
        </div>

        <div className="mt-10 max-w-2xl space-y-4">
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold leading-tight">{campaign.name}</h1>
          {campaign.tagline && (
            <p className="text-base sm:text-lg text-white/80">{campaign.tagline}</p>
          )}

          <div className="pt-2 max-w-md">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-xl font-display font-bold text-[#fccf03]">{formatMoney(raised)} raised</span>
              {goal > 0 && <span className="text-white/60">of {formatMoney(goal)}</span>}
            </div>
            <div className="h-2.5 mt-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-[#fccf03]" style={{ width: `${pct}%` }} />
            </div>
            {goal > 0 && (
              <p className="text-xs text-white/50 mt-1.5">{pct}% of the goal</p>
            )}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 bg-[#fccf03]" />
    </header>
  );
}