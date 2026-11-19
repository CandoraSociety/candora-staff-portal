import React from 'react';
import { formatMoney } from '@/lib/donorConstants';

// The top of a campaign's public page: photo, name, tagline and progress.
export default function CampaignHero({ campaign, raised }) {
  const goal = Number(campaign.goal_amount) || 0;
  const pct = goal ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  return (
    <header className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
      {campaign.hero_image_url && (
        <img src={campaign.hero_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/85 to-sidebar/50" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-12 sm:pb-16">
        <div className="flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/6a249282cb496579542673b7/418f6d576_logo.png"
            alt="Candora"
            className="h-10 w-auto"
          />
          <div className="text-sm font-semibold tracking-wide text-sidebar-foreground/80">Candora Society</div>
        </div>

        <div className="mt-10 max-w-2xl space-y-4">
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold leading-tight">{campaign.name}</h1>
          {campaign.tagline && (
            <p className="text-base sm:text-lg text-sidebar-foreground/85">{campaign.tagline}</p>
          )}

          <div className="pt-2 max-w-md">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-xl font-display font-bold text-sidebar-primary">{formatMoney(raised)} raised</span>
              {goal > 0 && <span className="text-sidebar-foreground/70">of {formatMoney(goal)}</span>}
            </div>
            <div className="h-2.5 mt-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-sidebar-primary" style={{ width: `${pct}%` }} />
            </div>
            {goal > 0 && (
              <p className="text-xs text-sidebar-foreground/60 mt-1.5">{pct}% of the goal</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}