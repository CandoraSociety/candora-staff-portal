import React from 'react';
import { Hand } from 'lucide-react';
import { programLabel } from '@/lib/kioskPrograms';

// Shown while a class is running in this room: the whole screen is the button,
// so a student only has to touch it to reach the check-in list.
export default function KioskCheckInWelcome({ brand, prompt, onStart }) {
  const gold = brand?.primary_color || '#f5be19';
  const navy = brand?.secondary_color || '#0f1f6b';

  return (
    <button
      type="button"
      onClick={onStart}
      className="w-full min-h-screen flex flex-col items-center justify-center px-8 py-16 text-center cursor-pointer"
      style={{
        background: `
          radial-gradient(120% 90% at 50% 0%, ${gold}33 0%, transparent 58%),
          radial-gradient(100% 80% at 10% 100%, ${navy} 0%, transparent 65%),
          linear-gradient(155deg, ${navy} 0%, #0a1440 48%, #060c26 100%)
        `,
      }}
    >
      {brand?.logo_url ? (
        <img
          src={brand.logo_url}
          alt={brand.name}
          className="w-auto object-contain h-40 sm:h-56 max-w-[70vw] drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
        />
      ) : null}

      <h1 className="mt-10 text-white font-display font-bold text-5xl sm:text-6xl leading-tight drop-shadow">
        Welcome to {programLabel(prompt.program)}
      </h1>

      <p className="mt-4 text-white/85 text-2xl sm:text-3xl font-semibold">{prompt.course_name}</p>

      <div className="mt-10 h-1 w-24 rounded-full" style={{ backgroundColor: gold }} />

      <div className="mt-10 flex items-center gap-4">
        <Hand className="h-9 w-9 animate-pulse" style={{ color: gold }} />
        <p className="text-white font-bold text-3xl sm:text-4xl">Touch the screen to check in</p>
      </div>
    </button>
  );
}