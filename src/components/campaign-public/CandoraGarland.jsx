import React from 'react';

// Candora's own Christmas garland artwork — the horizontal piece laid above the
// appeal and the vertical piece hung down the side of the page. Staff upload the
// approved asset in the campaign's Photography & artwork tab; until one is
// supplied nothing is drawn, so the page never falls back to generic
// red-and-green decoration.
//
// Both pieces are drawn on a white sheet, so they are always shown whole — never
// cropped to a strip and never stretched — on the page's own light surface,
// where the white sheet blends away instead of sitting as a white block.
export default function CandoraGarland({ campaign, variant = 'top', className = '' }) {
  const url = variant === 'side'
    ? campaign?.garland_vertical_url
    : campaign?.garland_horizontal_url;

  if (!url) return null;

  return (
    <div className={`pointer-events-none flex select-none justify-center ${className}`}>
      <img
        src={url}
        alt=""
        aria-hidden="true"
        className="h-full w-auto max-w-full object-contain mix-blend-multiply"
      />
    </div>
  );
}