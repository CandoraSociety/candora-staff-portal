import React from 'react';
import { Gift } from 'lucide-react';

const CANDORA_LOGO = 'https://media.base44.com/images/public/6a249282cb496579542673b7/6d7d8de5b7cf5f4838f9d1df98d171cc_kids-gift-shop-logo.png';

// The live preview of the greeting card a supporter is creating. It shows the
// whole card — artwork, recipient, the message they are writing and what the
// gift makes possible — updating as they type.
export default function GiftCardPreview({ campaign, theme, recipientName, donorName, giftName, message, description, amount }) {
  const art = theme?.image_url || campaign?.hero_image_url || '';
  // The emblem this card design carries, set into the corner of its artwork.
  const motif = theme?.motif_url || '';
  const motifDark = !!theme?.motif_dark;
  const greeting = String(message || '').trim() || theme?.message || '';
  const giftDescription = String(description || '').trim();
  const donationName = String(giftName || theme?.name || '').trim();

  return (
    <div className="rounded-2xl border-2 border-[#fccf03] overflow-hidden bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b">
        <img src={CANDORA_LOGO} alt="Candora Society" className="h-6 w-auto" />
        <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Candora</span>
      </div>

      <div className="relative aspect-[16/10] bg-[#0a0f29]">
        {art && <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f29]/95 via-[#0a0f29]/35 to-transparent" />
        {motif && (
          <span
            className={`absolute right-2 top-2 block h-10 w-10 overflow-hidden rounded-lg ring-1 ring-[#fccf03]/70 ${
              motifDark ? 'bg-[#0a0f29]' : 'bg-white'
            }`}
          >
            <img src={motif} alt="" className="h-full w-full object-cover" />
          </span>
        )}
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
        <div className="space-y-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Message in the card
          </p>
          {greeting ? (
            <p className="text-sm italic leading-relaxed whitespace-pre-line text-foreground/90">
              {greeting}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Your message will appear here as you write it.
            </p>
          )}
        </div>

        <div className="rounded-lg bg-[#0a0f29] px-3 py-2 text-white">
          <p className="text-[11px] leading-relaxed">
            {`A donation${Number(amount) > 0 ? ` of $${Number(amount).toLocaleString('en-CA')}` : ''}`}
            {donationName ? (
              <> — <span className="font-bold text-[#fccf03]">{donationName}</span> —</>
            ) : null}
            {' has been made to Candora Society as a gift to you.'}
          </p>
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