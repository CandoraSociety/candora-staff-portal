import { useEffect, useState } from 'react';
import { findSpotlightTargets } from '@/components/training/spotlightTarget';
import { spotlightBounds } from '@/components/training/cursorTarget';

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"], [role="tab"]';

function unionRect(rects) {
  if (!rects.length) return null;
  const left = Math.min(...rects.map(r => r.left));
  const top = Math.min(...rects.map(r => r.top));
  const right = Math.max(...rects.map(r => r.left + r.width));
  const bottom = Math.max(...rects.map(r => r.top + r.height));
  return { left, top, width: right - left, height: bottom - top };
}

export default function useSpotlightTarget(enabled, target, stepKey) {
  const [focus, setFocus] = useState(null);
  const targetKey = JSON.stringify(target);
  useEffect(() => {
    if (!enabled || !target) return;
    let current = null, frame;
    const measure = () => {
      const elements = findSpotlightTargets(target);
      const first = elements[0] || null;
      if (first && first !== current) {
        current = first;
        const margin = first.style.scrollMarginTop;
        first.style.scrollMarginTop = '96px';
        first.scrollIntoView({ block: first.getBoundingClientRect().height > window.innerHeight - 160 ? 'start' : 'center', inline: 'nearest', behavior: 'instant' });
        first.style.scrollMarginTop = margin;
      }
      const bounds = elements.map(spotlightBounds).filter(Boolean);
      const regions = bounds.map(bound => bound.rect);
      const rect = unionRect(regions);
      const point = rect
        ? { x: rect.left + Math.min(rect.width / 2, 200), y: rect.top + Math.min(rect.height / 2, 40) }
        : null;
      const next = { stepKey, targetKey, rect, point, regions,
        interactive: !!first && (first.matches(INTERACTIVE_SELECTOR) || !!first.querySelector(INTERACTIVE_SELECTOR)) };
      setFocus(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    measure();
    const timer = window.setInterval(schedule, 100);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    return () => {
      window.clearInterval(timer);
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [enabled, targetKey, stepKey]);
  return enabled && focus?.stepKey === stepKey && focus?.targetKey === targetKey ? focus : null;
}