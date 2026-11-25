import React from 'react';
import { CHRISTMAS_ARTWORK } from '@/lib/christmasArtwork';
import { formatMoneyExact } from '@/lib/donorConstants';

// Personal text and the design's fixed gift wording are deliberately separate.
export default function GiftCardMessageSections({ message, giftWording, giftName, donationName, amount, christmas, compact = false, preview = false }) {
  const personalMessage = String(message || '').trim();
  const wording = String(giftWording || '').trim();
  return (
    <>
      {(personalMessage || preview) && (
        <div data-card-section="donor-message" className={`relative overflow-hidden rounded-xl bg-primary-foreground text-card ${compact ? 'px-3 py-2 pr-12' : 'px-4 py-3 pr-16'}`}>
          <p className={`font-semibold uppercase tracking-[0.16em] text-primary ${compact ? 'text-[9px]' : 'text-[10px]'}`}>A message for you</p>
          <p className={`mt-1 whitespace-pre-wrap break-words leading-relaxed ${compact ? 'text-[11px]' : 'text-sm'} ${personalMessage ? '' : 'italic opacity-60'}`}>
            {personalMessage || 'Your personal message will appear here.'}
          </p>
          {christmas && <img src={CHRISTMAS_ARTWORK.bow} alt="" aria-hidden="true" className={`pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 mix-blend-screen ${compact ? 'w-11' : 'w-14'}`} />}
        </div>
      )}
      {(wording || donationName || Number(amount) > 0) && (
        <div data-card-section="gift-wording" className={`rounded-xl border border-primary/50 bg-primary/10 space-y-2 ${compact ? 'p-2.5' : 'p-4'}`}>
          <p className={`font-semibold uppercase tracking-[0.16em] text-primary-foreground/70 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>{giftName || 'A gift to you'}</p>
          {wording && <p className={`whitespace-pre-wrap break-words leading-relaxed text-foreground/90 ${compact ? 'text-[11px]' : 'text-sm'}`}>{wording}</p>}
          {(donationName || Number(amount) > 0) && (
            <div data-card-section="donation-selection" className="border-t border-primary/30 pt-2">
              <p className={`uppercase tracking-wide text-muted-foreground ${compact ? 'text-[9px]' : 'text-[10px]'}`}>Donation selected</p>
              <p className={`mt-1 font-bold text-primary-foreground ${compact ? 'text-xs' : 'text-base'}`}>
                {donationName || 'Donation'}{Number(amount) > 0 && <> · {formatMoneyExact(amount)} CAD</>}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}