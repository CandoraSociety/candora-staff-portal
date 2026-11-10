// The looks a tablet's welcome screen can wear. 'candora' follows the
// organization's own brand colours; the rest are fixed looks so one room can be
// given its own character without touching the brand settings.
export const SCREEN_BACKGROUNDS = [
  { id: 'candora', label: 'Candora navy & gold', light: false },
  { id: 'navy', label: 'Midnight navy', light: false },
  { id: 'gold', label: 'Warm gold', light: true },
  { id: 'ocean', label: 'Ocean blue', light: false },
  { id: 'forest', label: 'Forest green', light: false },
  { id: 'berry', label: 'Berry', light: false },
  { id: 'light', label: 'Light & airy', light: true },
];

export const screenPreset = (id) => SCREEN_BACKGROUNDS.find((row) => row.id === id) || SCREEN_BACKGROUNDS[0];

// CSS background for one preset, plus whether the background is light (so the
// screen knows to use dark text on it).
export function screenBackground(id, brand) {
  const gold = brand?.primary_color || '#f5be19';
  const navy = brand?.secondary_color || '#0f1f6b';

  switch (id) {
    case 'navy':
      return { css: 'linear-gradient(160deg, #16306e 0%, #0a1440 55%, #050a1e 100%)', light: false };
    case 'gold':
      return { css: `linear-gradient(160deg, ${gold} 0%, #e2a90d 100%)`, light: true };
    case 'ocean':
      return { css: 'linear-gradient(160deg, #0e7490 0%, #083344 100%)', light: false };
    case 'forest':
      return { css: 'linear-gradient(160deg, #166534 0%, #052e16 100%)', light: false };
    case 'berry':
      return { css: 'linear-gradient(160deg, #7f1d4d 0%, #2a0716 100%)', light: false };
    case 'light':
      return { css: 'linear-gradient(160deg, #ffffff 0%, #e8edf7 100%)', light: true };
    default:
      return {
        css: `
          radial-gradient(120% 90% at 50% 0%, ${gold}33 0%, transparent 58%),
          radial-gradient(100% 80% at 10% 100%, ${navy} 0%, transparent 65%),
          linear-gradient(155deg, ${navy} 0%, #0a1440 48%, #060c26 100%)
        `,
        light: false,
      };
  }
}

// Full background for a station's screen — the uploaded photo when there is one,
// otherwise the chosen colour look.
export function screenBackgroundStyle(screen, brand) {
  const theme = screenBackground(screen?.background, brand);
  if (screen?.background_url) {
    return {
      css: `linear-gradient(rgba(6,12,38,0.62), rgba(6,12,38,0.78)), url("${screen.background_url}") center / cover no-repeat`,
      light: false,
    };
  }
  return theme;
}