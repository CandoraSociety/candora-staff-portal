import React from 'react';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/donorConstants';
import { imageFocalStyle, pillarHeadline, pillarShortLabel } from '@/lib/campaignDisplay';

// The causes inside a campaign, each with its own progress and its own giving
// link. A supporter picks one to give to it, or gives to the whole campaign.
export default function CampaignPillars({ campaign, totals = [], selectedPillarId, onSelect }) {
  const pillars = (campaign?.pillars || [])
    .filter((pillar) => pillar.is_active !== false)
    .slice()
    .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));

  if (!campaign?.enable_pillars || pillars.length === 0) return null;

  const raisedFor = (id) => Number(totals.find((row) => (row.pillar_id || '') === id)?.raised) || 0;
  const festive = campaign.seasonal_theme === 'christmas';
  const allSelected = (selectedPillarId || '') === '';

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display font-bold text-xl">
          {festive ? 'Three ways to bring Christmas to your community' : 'Where your gift goes'}
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose a cause below, or give to all of them together.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((pillar) => {
          const raised = raisedFor(pillar.id);
          const goal = Number(pillar.goal_amount) || 0;
          const pct = goal ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
          const selected = selectedPillarId === pillar.id;
          const label = pillarShortLabel(pillar);

          return (
            <article
              key={pillar.id}
              className={`flex flex-col rounded-2xl border overflow-hidden bg-card transition-shadow ${
                selected ? 'ring-2 ring-[#fccf03] border-transparent' : 'hover:shadow-md'
              }`}
            >
              {pillar.image_url && (
                <div className="relative h-44 sm:h-40 bg-muted">
                  <img
                    src={pillar.image_url}
                    alt={pillar.image_alt || ''}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={imageFocalStyle(pillar.image_position)}
                  />
                  {pillar.gift_name && (
                    <span className="absolute left-3 top-3 rounded-full bg-[#0a0f29]/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#fccf03]">
                      {pillar.gift_name}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="font-display font-extrabold text-lg leading-snug">
                  {pillarHeadline(pillar)}
                </h3>
                {(pillar.description || pillar.tagline) && (
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {pillar.description || pillar.tagline}
                  </p>
                )}

                <div className="pt-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-semibold">{formatMoney(raised)} raised</span>
                    {goal > 0 && <span className="text-muted-foreground">of {formatMoney(goal)}</span>}
                  </div>
                  <div className="h-1.5 mt-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-[#fccf03]" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <Button
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  className="w-full mt-auto"
                  onClick={() => onSelect(pillar.id)}
                >
                  {selected ? `Giving to ${label}` : `Give to ${label}`}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <div
        className={`rounded-2xl bg-[#0a0f29] text-white p-6 flex flex-col sm:flex-row sm:items-center gap-4 ${
          allSelected ? 'ring-2 ring-[#fccf03]' : ''
        }`}
      >
        <div className="flex-1 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fccf03]">
            The Gift of Joy, Hope &amp; Belonging
          </p>
          <h3 className="font-display font-extrabold text-xl leading-tight">
            Bring Joy, Hope &amp; Belonging This Christmas
          </h3>
          <p className="text-sm text-white/75">
            One gift shared across every cause, where it is needed most.
          </p>
        </div>
        <Button
          size="sm"
          variant={allSelected ? 'default' : 'secondary'}
          className="sm:w-auto w-full"
          onClick={() => onSelect('')}
        >
          {allSelected ? 'Giving to all three' : 'Give to all three'}
        </Button>
      </div>
    </section>
  );
}