import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMoney, tierAmountLabel } from '@/lib/donorConstants';
import { imageFocalStyle, pillarHeadline, pillarShortLabel } from '@/lib/campaignDisplay';
import { pillarMeta, pillarTiers, sponsorshipLine } from '@/lib/christmasCampaign';

// One of the three Christmas causes. Each card carries its own photograph,
// approved headline and giving amounts, and starts a gift right here on the
// page — no parent campaign page to visit first.
const TONES = {
  gold: { bar: 'bg-[#fccf03]', chip: 'bg-[#fccf03]/20 text-[#0a0f29]', hover: 'hover:border-[#fccf03]' },
  blue: { bar: 'bg-[#2b4c9b]', chip: 'bg-[#2b4c9b]/10 text-[#16306b]', hover: 'hover:border-[#2b4c9b]' },
  evergreen: { bar: 'bg-[#14603f]', chip: 'bg-[#14603f]/10 text-[#0d4630]', hover: 'hover:border-[#14603f]' },
};

export default function ChristmasPillarCard({ campaign, pillar, raised = 0, onGive }) {
  const [open, setOpen] = useState(false);
  const meta = pillarMeta(pillar);
  const tone = TONES[meta.tone] || TONES.gold;
  const tiers = pillarTiers(campaign, pillar);
  const sponsor = sponsorshipLine(campaign, pillar);
  const goal = Number(pillar.goal_amount) || 0;
  const pct = goal ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  return (
    <article
      id={`pillar-${pillar.id}`}
      className={`flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg ${tone.hover}`}
    >
      <div className={`h-1.5 ${tone.bar}`} />

      {pillar.image_url ? (
        <div className="relative aspect-[4/3] bg-muted">
          <img
            src={pillar.image_url}
            alt={pillar.image_alt || ''}
            className="absolute inset-0 h-full w-full object-cover"
            style={imageFocalStyle(pillar.image_position)}
          />
        </div>
      ) : (
        <div className="relative flex aspect-[4/3] flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#0a0f29] to-[#1d2a52] px-4 text-center">
          <span className="font-display text-lg font-extrabold text-[#fccf03]">
            {pillarShortLabel(pillar)}
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-white/50">
            Photograph to come
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${tone.chip}`}>
            {pillarShortLabel(pillar)}
          </span>
          {pillar.gift_name && (
            <span className="text-[11px] text-muted-foreground">{pillar.gift_name}</span>
          )}
        </div>

        <h3 className="font-display text-xl font-extrabold leading-snug">
          {pillarHeadline(pillar)}
        </h3>

        <p className="text-sm leading-relaxed text-foreground/80">
          {pillar.description || pillar.tagline}
        </p>

        {sponsor && (
          <p className="font-display text-lg font-extrabold text-[#0a0f29]">{sponsor}</p>
        )}

        {goal > 0 && (
          <div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-semibold">{formatMoney(raised)} raised</span>
              <span className="text-muted-foreground">of {formatMoney(goal)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[#fccf03]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {tiers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tiers.map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => onGive(pillar.id, tier.id)}
                className="rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted/70"
                title={tier.name}
              >
                {tierAmountLabel(tier)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto space-y-2 pt-2">
          <Button
            className="w-full bg-[#0a0f29] font-medium text-white hover:bg-[#0a0f29]/90"
            onClick={() => onGive(pillar.id)}
          >
            {meta.cta}
          </Button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {open ? 'Less about this gift' : 'What your gift makes possible'}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {open && (
          <div className="space-y-2 rounded-xl bg-muted/50 p-3">
            <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-foreground/80">
              {meta.impact.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              These are examples of what gifts to this area make possible. Gifts support the work as
              a whole rather than one restricted program.
            </p>
            {campaign.slug && (
              <Link
                to={`/campaign/${campaign.slug}?pillar=${encodeURIComponent(pillar.id)}`}
                className="inline-block text-xs font-medium underline"
              >
                Full campaign details
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  );
}