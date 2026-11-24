import React from 'react';
import { Gift } from 'lucide-react';

// The live preview of the greeting card a supporter is creating. It shows
// exactly what the recipient will see, updating as they type.
export default function GiftCardPreview({ campaign, theme, recipientName, donorName, giftName, message }) {
  const art = theme?.image_url || campaign?.hero_image_url || '';
  const greeting = String(message || '').trim() || theme?.message || '';

  return (
    <div className="rounded-2xl border-2 border-[#fccf03] overflow-hidden bg-card shadow-sm">
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