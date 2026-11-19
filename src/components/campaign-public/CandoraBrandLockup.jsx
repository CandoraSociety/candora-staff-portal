import React from 'react';
import { CANDORA_BRAND } from '@/lib/candoraBrand';

const CANDORA_LOGO = 'https://media.base44.com/images/public/6a249282cb496579542673b7/418f6d576_logo.png';

// The organization's brand lockup as it appears on public pages — the Candora
// lighthouse mark on a light tile beside the name and what we do.
export default function CandoraBrandLockup({ compact = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`rounded-xl bg-white p-1.5 shadow-sm ${compact ? '' : 'sm:p-2'}`}>
        <img
          src={CANDORA_LOGO}
          alt="Candora Society"
          className={compact ? 'h-8 w-auto' : 'h-9 w-auto sm:h-11'}
        />
      </div>
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