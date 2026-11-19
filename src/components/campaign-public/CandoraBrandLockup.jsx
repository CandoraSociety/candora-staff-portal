import React from 'react';
import { CANDORA_BRAND } from '@/lib/candoraBrand';

// The organization's real logo — the same Candora circle mark the staff portal
// uses in its sidebar and on its sign-in screen.
const CANDORA_LOGO = 'https://media.base44.com/images/public/6a249282cb496579542673b7/c6b242905_Candoracirclelogo_noanniversary.png';

// The organization's brand lockup as it appears on public pages — the Candora
// circle logo beside the name and what we do.
export default function CandoraBrandLockup({ compact = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={CANDORA_LOGO}
        alt="Candora Society"
        className={`object-contain ${compact ? 'h-9 w-9' : 'h-11 w-11 sm:h-14 sm:w-14'}`}
      />
      <div className="leading-tight">
        <div className={`font-display font-extrabold uppercase tracking-[0.18em] text-sidebar-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
          {CANDORA_BRAND.name}
        </div>
        <div className={`text-sidebar-foreground/70 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {CANDORA_BRAND.tagline}
        </div>
      </div>
    </div>
  );
}