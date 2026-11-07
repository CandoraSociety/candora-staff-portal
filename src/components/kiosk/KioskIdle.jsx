import React from 'react';
import { HandHeart } from 'lucide-react';

// The resting screen: a welcome, and a quiet way for staff to re-point the
// tablet at a different station.
export default function KioskIdle({ brand, stationName, onChangeTablet }) {
  return (
    <div className="min-h-screen bg-sidebar flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {brand?.logo_url ? (
          <img src={brand.logo_url} alt={brand.name} className="h-20 w-auto object-contain" />
        ) : (
          <div className="h-20 w-20 rounded-3xl bg-sidebar-primary flex items-center justify-center">
            <HandHeart className="h-9 w-9 text-sidebar-primary-foreground" />
          </div>
        )}
        <h1 className="mt-8 text-sidebar-foreground font-display font-bold text-4xl sm:text-5xl leading-tight">
          Welcome to {brand?.name || 'Candora'}
        </h1>
        <p className="mt-4 text-sidebar-foreground/70 text-xl max-w-xl">
          Please speak with the reception team — they will help you at the counter.
        </p>
      </div>
      <div className="px-6 py-4 flex items-center justify-between text-sidebar-foreground/40 text-xs">
        <span>{stationName}</span>
        <button onClick={onChangeTablet} className="underline hover:text-sidebar-foreground/70">Change this tablet</button>
      </div>
    </div>
  );
}