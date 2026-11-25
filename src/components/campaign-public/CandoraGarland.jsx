import React from 'react';

// Candora's own Christmas garland artwork, laid across the top of the page or
// hung down its side. Staff upload the approved asset in the campaign's
// Photography & artwork tab; until one is supplied nothing is drawn, so the
// page never falls back to generic red-and-green decoration.
export default function CandoraGarland({ campaign, variant = 'top', className = '' }) {
  const url = variant === 'side'
    ? campaign?.garland_vertical_url
    : campaign?.garland_horizontal_url;

  if (!url) return null;

  if (variant === 'side') {
    return (
      <img
        src={url}
        alt=""
        aria-hidden="true"
        className={`pointer-events-none select-none object-contain object-top ${className}`}
      />
    );
  }

  // The horizontal artwork is drawn on a white sheet, so it sits on a white band
  // instead of being laid over a dark header.
  return (
    <div className={`pointer-events-none select-none overflow-hidden bg-white ${className}`}>
      <img
        src={url}
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover object-center"
      />
    </div>
  );
}