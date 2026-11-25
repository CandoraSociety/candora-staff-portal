import React from 'react';
import { Gift } from 'lucide-react';

const CANDORA_LOGO = 'https://media.base44.com/images/public/6a249282cb496579542673b7/6d7d8de5b7cf5f4838f9d1df98d171cc_kids-gift-shop-logo.png';

// The live preview of the greeting card a supporter is creating. It shows
// exactly what the recipient will see, updating as they type.
export default function GiftCardPreview({ campaign, theme, recipientName, donorName, giftName, message, description }) {
  const art = theme?.image_url || campaign?.hero_image_url || '';
  const greeting = String(message || '').trim() || theme?.message || '';
  const giftDescription = String(description || '').trim();

  return (
    <div className="rounded-2xl border-2 border-[#fccf03] overflow-hidden bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-card">
        <img src={CANDORA_LOGO} alt="Candora Society" className="h-6 w-auto" />
        <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Candora</span>
      </div>
      <div className="relative h-36 bg-[#0a0f29]">
        {art && <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f29]/95 via-[#0a0f29]/40 to-transparent" />
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
      <div className="p-4 space-y-2">
        {greeting ? (
          <p className="text-sm italic leading-relaxed whitespace-pre-line line-clamp-5">{greeting}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Your message will appear here.</p>
        )}
        {giftDescription && (
          <div className="rounded-lg border border-[#fccf03]/50 bg-[#fccf03]/10 p-2.5 space-y-1">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#0a0f29]/70">
              {giftName || 'Your gift'}
            </p>
            <p className="text-[11px] leading-relaxed text-foreground/90 line-clamp-4">
              {giftDescription}
            </p>
          </div>
        )}
        <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5" /> {campaign?.name || 'Candora'}
          </span>
          <span>{donorName?.trim() ? `from ${donorName.trim()}` : 'from a friend'}</span>
        </div>
      </div>
    </div>
  );
}