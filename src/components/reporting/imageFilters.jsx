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