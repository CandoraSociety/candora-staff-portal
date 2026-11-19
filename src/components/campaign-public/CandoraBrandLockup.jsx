import React from 'react';
import { CANDORA_BRAND } from '@/lib/candoraBrand';

// Public branding uses the saved CANDORA name and official circle logo only.
export default function CandoraBrandLockup({ compact = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={CANDORA_BRAND.logoUrl}
        alt="Candora logo"
        className={`object-contain ${compact ? 'h-9 w-9' : 'h-11 w-11 sm:h-14 sm:w-14'}`}
      />
      <div className={`font-display font-extrabold uppercase tracking-[0.18em] text-sidebar-primary ${compact ? 'text-xs' : 'text-sm'}`}>
        {CANDORA_BRAND.name}
      </div>
    </div>
  );
}