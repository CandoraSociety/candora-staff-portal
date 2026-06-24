export const IMAGE_FILTERS = {
  none: { label: 'Original', css: 'none' },
  grayscale: { label: 'B&W', css: 'grayscale(100%)' },
  sepia: { label: 'Sepia', css: 'sepia(100%)' },
  vintage: { label: 'Vintage', css: 'sepia(50%) contrast(1.2) brightness(0.9)' },
  warm: { label: 'Warm', css: 'sepia(30%) saturate(1.4) hue-rotate(-10deg)' },
  cool: { label: 'Cool', css: 'hue-rotate(180deg) saturate(1.2)' },
  dramatic: { label: 'Dramatic', css: 'contrast(1.4) saturate(1.3) brightness(0.95)' },
  fade: { label: 'Faded', css: 'contrast(0.85) brightness(1.1) saturate(0.7)' },
  vivid: { label: 'Vivid', css: 'saturate(1.6) contrast(1.1)' },
  invert: { label: 'Inverted', css: 'invert(100%)' },
};

export function getFilterCss(filterKey) {
  return IMAGE_FILTERS[filterKey]?.css || 'none';
}

/**
 * Builds a left-to-right fading gradient ribbon from Candora brand colors.
 * Colors are spread across the first 70% then fade to transparent on the right.
 */
export function ribbonGradient(branding) {
  const colors = [branding?.primary_color, branding?.accent_color, branding?.secondary_color].filter(Boolean);
  if (colors.length === 0) return 'linear-gradient(90deg, #1a2744, #2b2de8, transparent)';
  if (colors.length === 1) return `linear-gradient(90deg, ${colors[0]}, transparent)`;
  const stops = colors.map((c, i) => `${c} ${(i / (colors.length - 1)) * 70}%`).join(', ');
  return `linear-gradient(90deg, ${stops}, transparent 100%)`;
}