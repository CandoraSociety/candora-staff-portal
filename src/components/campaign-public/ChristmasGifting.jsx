import React from 'react';
import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Section C: charitable Christmas gifting. It is a feature of every gift on this
// page, never a campaign of its own, so it shows an example card and points back
// to the giving panel.
export default function ChristmasGifting({ campaign, onAddGift }) {
  const example = (campaign.ecard_themes || [])[0];

  return (
    <section className="grid gap-6 rounded-3xl border border-[#fccf03]/50 bg-[#fdfaf0] p-6 sm:p-8 md:grid-cols-[1.25fr_1fr] md:items-center">
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0a0f29]/60">
          Charitable Christmas gifting
        </p>
        <h2 className="font-display text-2xl font-extrabold leading-tight">
          Make your donation a Christmas gift.
        </h2>
        <p className="text-sm leading-relaxed text-foreground/80">
          Give someone special a meaningful Christmas gift by making a donation in their honour.
          Personalize a Christmas card that celebrates your gift and the difference it helps make.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Available with a gift to Joy, Hope or Belonging. Choose a card, write your message and pick
          the day it arrives.
        </p>
        <Button
          variant="outline"
          className="border-[#0a0f29]/20 bg-white hover:bg-white/80"
          onClick={onAddGift}
        >
          <Gift className="h-4 w-4" />
          Add a Christmas card to my gift
        </Button>
      </div>

      {example && (
        <figure className="mx-auto w-full max-w-xs">
          <div className="rotate-[-1.5deg] overflow-hidden rounded-xl border bg-white p-2 shadow-lg">
            {example.image_url && (
              <img
                src={example.image_url}
                alt={example.name ? `Christmas card: ${example.name}` : 'Candora Christmas card'}
                className="h-44 w-full rounded-lg object-cover"
              />
            )}
            <figcaption className="space-y-1 px-1 pb-1 pt-2">
              <p className="font-display text-sm font-bold text-[#0a0f29]">
                {example.name || 'A Candora Christmas card'}
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {example.message || 'Your gift, given in someone’s honour.'}
              </p>
              <p className="pt-1 text-[10px] uppercase tracking-[0.16em] text-[#0a0f29]/50">
                Candora Society
              </p>
            </figcaption>
          </div>
        </figure>
      )}
    </section>
  );
}