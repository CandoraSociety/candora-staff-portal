import React from 'react';
import { HandHeart } from 'lucide-react';

// The resting screen: the tablet sits here until reception sends it something.
// Background is built from the organization's own brand colours so the tablet
// always matches the rest of the building.
export default function KioskIdle({ brand, programLabel }) {
  const gold = brand?.primary_color || '#f5be19';
  const navy = brand?.secondary_color || '#0f1f6b';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `
          radial-gradient(120% 90% at 50% 0%, ${gold}33 0%, transparent 58%),
          radial-gradient(100% 80% at 10% 100%, ${navy} 0%, transparent 65%),
          linear-gradient(155deg, ${navy} 0%, #0a1440 48%, #060c26 100%)
        `,
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">
        {brand?.logo_url ? (
          <img
            src={brand.logo_url}
            alt={brand.name}
            className="w-auto object-contain h-64 sm:h-[24rem] lg:h-[28rem] max-w-[88vw] drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
          />
        ) : (
          <div
            className="h-48 w-48 rounded-[2rem] flex items-center justify-center shadow-2xl"
            style={{ backgroundColor: gold }}
          >
            <HandHeart className="h-24 w-24" style={{ color: navy }} />
          </div>
        )}

        <h1 className="mt-12 text-white font-display font-bold text-5xl sm:text-6xl leading-tight drop-shadow">
          Welcome to {brand?.name || 'Candora'}
        </h1>

        <div className="mt-8 h-1 w-24 rounded-full" style={{ backgroundColor: gold }} />

        {programLabel ? (
          <>
            <p className="mt-8 text-white font-semibold text-2xl sm:text-3xl">{programLabel} sign-in</p>
            <p className="mt-3 text-white/70 text-xl max-w-2xl">
              This tablet will ask for your details when sign-in opens. Your facilitator will let you know.
            </p>
          </>
        ) : (
          <p className="mt-8 text-white/70 text-xl sm:text-2xl max-w-2xl">
            Please speak with the reception team — they will help you at the counter.
          </p>
        )}
      </div>
    </div>
  );
}