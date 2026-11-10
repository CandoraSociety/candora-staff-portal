import React from 'react';
import { HandHeart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { screenBackgroundStyle } from '@/lib/kioskScreens';

// The resting screen: the tablet sits here until something is scheduled in its
// room or a staff member sends it something. The message and background are set
// per tablet in Central Registration; with nothing set it follows the
// organization's own brand colours.
export default function KioskIdle({ brand, roomName, screen }) {
  const gold = brand?.primary_color || '#f5be19';
  const navy = brand?.secondary_color || '#0f1f6b';
  const theme = screenBackgroundStyle(screen, brand);
  const custom = (screen?.message || '').trim();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: theme.css }}>
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">
        {brand?.logo_url ? (
          <img
            src={brand.logo_url}
            alt={brand.name}
            className={cn(
              'w-auto object-contain h-64 sm:h-[24rem] lg:h-[28rem] max-w-[88vw]',
              !theme.light && 'drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)]',
            )}
          />
        ) : (
          <div
            className="h-48 w-48 rounded-[2rem] flex items-center justify-center shadow-2xl"
            style={{ backgroundColor: gold }}
          >
            <HandHeart className="h-24 w-24" style={{ color: navy }} />
          </div>
        )}

        <h1
          className={cn(
            'mt-12 font-display font-bold text-5xl sm:text-6xl leading-tight',
            theme.light ? 'text-slate-900' : 'text-white drop-shadow',
          )}
        >
          Welcome to {brand?.name || 'Candora'}
        </h1>

        <div className="mt-8 h-1 w-24 rounded-full" style={{ backgroundColor: theme.light ? navy : gold }} />

        <p
          className={cn(
            'mt-8 text-xl sm:text-2xl max-w-2xl whitespace-pre-line',
            theme.light ? 'text-slate-700' : 'text-white/75',
          )}
        >
          {custom ||
            (roomName
              ? `This is the ${roomName} tablet. Check-in opens here 30 minutes before a class starts.`
              : 'Please speak with the front desk team — they will help you at the counter.')}
        </p>
      </div>
    </div>
  );
}