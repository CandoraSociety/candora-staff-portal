import React from 'react';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/donorConstants';
import { Snowflake } from 'lucide-react';

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

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-xl">
          {festive ? 'Three ways to give' : 'Where your gift goes'}
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose a cause below, or give to all of them together.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {pillars.map((pillar) => {
          const raised = raisedFor(pillar.id);
          const goal = Number(pillar.goal_amount) || 0;
          const pct = goal ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
          const selected = selectedPillarId === pillar.id;

          return (
            <div
              key={pillar.id}
              className={`rounded-2xl border overflow-hidden bg-card transition-shadow ${
                selected ? 'ring-2 ring-primary' : 'hover:shadow-md'
              }`}
            >
              {pillar.image_url && (
                <img src={pillar.image_url} alt="" className="h-36 w-full object-cover" />
              )}
              <div className="p-4 space-y-2">
                <h3 className="font-display font-bold leading-tight">{pillar.name}</h3>
                {pillar.tagline && <p className="text-sm text-muted-foreground">{pillar.tagline}</p>}
                {pillar.description && (
                  <p className="text-sm text-foreground/80 line-clamp-3">{pillar.description}</p>
                )}

                <div className="pt-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-semibold">{formatMoney(raised)} raised</span>
                    {goal > 0 && <span className="text-muted-foreground">of {formatMoney(goal)}</span>}
                  </div>
                  <div className="h-1.5 mt-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${festive ? 'bg-destructive' : 'bg-primary'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <Button
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => onSelect(pillar.id)}
                >
                  {selected ? 'Giving to this cause' : `Give to ${pillar.name.split('—')[0].trim()}`}
                </Button>
              </div>
            </div>
          );
        })}

        <div
          className={`rounded-2xl border p-4 bg-sidebar text-sidebar-foreground flex flex-col justify-between gap-3 ${
            selectedPillarId === '' ? 'ring-2 ring-primary' : ''
          }`}
        >
          <div className="space-y-2">
            <Snowflake className="w-5 h-5 text-sidebar-primary" />
            <h3 className="font-display font-bold leading-tight">
              {festive ? 'Joy, Hope & Belonging' : 'The whole campaign'}
            </h3>
            <p className="text-sm text-sidebar-foreground/80">
              One gift shared across every cause, where it is needed most.
            </p>
          </div>
          <Button
            size="sm"
            variant={selectedPillarId === '' ? 'default' : 'secondary'}
            className="w-full"
            onClick={() => onSelect('')}
          >
            Give to all of it
          </Button>
        </div>
      </div>
    </section>
  );
}