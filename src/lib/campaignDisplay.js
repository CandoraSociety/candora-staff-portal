// Small helpers shared by the public campaign page and its staff panels, so a
// pillar's approved headline and gift name read the same everywhere.
export function pillarShortLabel(pillar) {
  const name = String(pillar?.name || '').trim();
  return name.split('—')[0].trim() || name || 'this cause';
}

// The approved headline for a pillar. Falls back to the short label for
// campaigns that have not set one.
export function pillarHeadline(pillar) {
  return String(pillar?.headline || '').trim() || pillarShortLabel(pillar);
}

// Where a photo's focal point sits when the frame crops it.
const POSITIONS = {
  top: '50% 0%',
  center: '50% 50%',
  bottom: '50% 100%',
};

export function imageFocalStyle(position) {
  return { objectPosition: POSITIONS[position] || POSITIONS.center };
}

// The gift name for the cause a supporter chose, e.g. The Gift of Joy.
export function giftNameForPillar(pillar) {
  return String(pillar?.gift_name || '').trim();
}