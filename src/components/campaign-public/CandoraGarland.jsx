import React from 'react';

// Candora's own Christmas garland artwork, laid across the top of the page or
// hung down its side. Staff upload the approved asset in the campaign's
// Photography & artwork tab; until one is supplied nothing is drawn, so the
// page never falls back to generic red-and-green decoration.
//
// The artwork is drawn on a white sheet, so it is multiplied onto the page's
// light background — the sheet drops out and only the greenery shows.
export default function CandoraGarland({ campaign, variant = 'top', className = '' }) {
  const url = variant === 'side'
    ? campaign?.garland_vertical_url
    : campaign?.garland_horizontal_url;

  if (!url) return null;

  return (
    <img
      src={url}
      alt=""
      aria-hidden="true"
      className={`pointer-events-none select-none h-auto mix-blend-multiply ${className}`}
    />
  );
}