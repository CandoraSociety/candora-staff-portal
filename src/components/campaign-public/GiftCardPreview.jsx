import React from 'react';
import { Gift } from 'lucide-react';
import { CHRISTMAS_ARTWORK } from '@/lib/christmasArtwork';

const CANDORA_LOGO = 'https://media.base44.com/images/public/6a249282cb496579542673b7/6d7d8de5b7cf5f4838f9d1df98d171cc_kids-gift-shop-logo.png';

// The live preview of the greeting card a supporter is creating. It shows the
// whole card — artwork, recipient, the message they are writing and what the
// gift makes possible — updating as they type.
//
// A Christmas campaign's own pieces decorate the parts around the artwork: the
// ornament hangs in the message, and the star and bow sit on the gift notice.
export default function GiftCardPreview({ campaign, theme, recipientName, donorName, giftName, message, description, amount }) {
  const art = theme?.image_url || campaign?.hero_image_url || '';
  const greeting = String(message || '').trim() || theme?.message || '';
  const giftDescription = String(description || '').trim();
  const christmas = campaign?.seasonal_theme === 'christmas';

  return (
    <div className="rounded-2xl border-2 border-[#fccf03] overflow-hidden bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b">
        <img src={CANDORA_LOGO} alt="Candora Society" className="h-6 w-auto" />
        <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Candora</span>
      </div>

      <div className="relative aspect-[16/10] bg-[#0a0f29]">
        {art && <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f29]/95 via-[#0a0f29]/35 to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-3 text-white">
          {giftName && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#fccf03]">
              {giftName}
            </span>
          )}
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/70">A gift for</span>
          <span className="font-display font-bold text-lg leading-tight">
            {recipientName?.trim() || 'Someone special'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="relative pr-10">
          <p className="font-script text-[32px] leading-none text-[#0a0f29]">Merry Christmas!</p>
          <img
            src={CHRISTMAS_ARTWORK.ornament}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -top-1 right-0 w-9 mix-blend-multiply"
          />
        </div>

        <div className="relative overflow-hidden rounded-lg bg-[#0a0f29] px-3 py-2 pr-12 text-white">
          <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#fccf03]">
            {christmas && (
              <img
                src={CHRISTMAS_ARTWORK.star}
                alt=""
                aria-hidden="true"
                className="h-3 w-3 object-cover mix-blend-screen"
              />
            )}
            A gift to you
          </p>
          <p className="mt-1 whitespace-pre-line text-[11px] leading-relaxed">
            {greeting || 'A gift has been made in your honour, to bring a little joy this season.'}
          </p>
          {christmas && (
            <img
              src={CHRISTMAS_ARTWORK.bow}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-0.5 top-1/2 w-11 -translate-y-1/2 mix-blend-screen"
            />
          )}
        </div>

        {giftDescription && (
          <div className="rounded-lg border border-[#fccf03]/50 bg-[#fccf03]/10 p-2.5 space-y-1">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#0a0f29]/70">
              {giftName || 'Your gift'}
            </p>
            <p className="text-[11px] leading-relaxed text-foreground/90">{giftDescription}</p>
          </div>
        )}

        <div className="pt-2 border-t flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 min-w-0">
            <Gift className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{campaign?.name || 'Candora'}</span>
          </span>
          <span className="shrink-0">{donorName?.trim() ? `from ${donorName.trim()}` : 'from a friend'}</span>
        </div>
      </div>
    </div>
  );
}