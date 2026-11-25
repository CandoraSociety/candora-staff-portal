import React from 'react';
import { Gift } from 'lucide-react';
import { CHRISTMAS_ARTWORK } from '@/lib/christmasArtwork';
import GiftCardMessageSections from '@/components/campaign-public/GiftCardMessageSections';

const CANDORA_LOGO = 'https://media.base44.com/images/public/6a249282cb496579542673b7/6d7d8de5b7cf5f4838f9d1df98d171cc_kids-gift-shop-logo.png';

// The live preview of the greeting card a supporter is creating. It shows the
// whole card — artwork, recipient, the message they are writing and what the
// gift makes possible — updating as they type.
//
// A Christmas campaign's own pieces decorate the parts around the artwork: the
// ornament hangs in the message, and the star and bow sit on the gift notice.
export default function GiftCardPreview({ campaign, theme, recipientName, donorName, giftName, message, description, donationName, amount }) {
  const art = theme?.image_url || campaign?.hero_image_url || '';
  const giftWording = String(theme?.message || description || '').trim();
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

        <GiftCardMessageSections
          message={message}
          giftWording={giftWording}
          giftName={giftName}
          donationName={donationName}
          amount={amount}
          christmas={christmas}
          compact
          preview
        />

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