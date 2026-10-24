import { useEffect, useState } from 'react';
import { findSpotlightTarget } from '@/components/training/spotlightTarget';
import { spotlightBounds } from '@/components/training/cursorTarget';

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"], [role="tab"]';

export default function useSpotlightTarget(enabled, target, stepKey) {
  const [focus, setFocus] = useState(null);
  const targetKey = JSON.stringify(target);
  useEffect(() => {
    if (!enabled || !target) return;
    let current = null, frame;
    const measure = () => {
      const element = findSpotlightTarget(target);
      if (element && element !== current) {
        current = element;
        const margin = element.style.scrollMarginTop;
        element.style.scrollMarginTop = '96px';
        element.scrollIntoView({ block: element.getBoundingClientRect().height > window.innerHeight - 160 ? 'start' : 'center', inline: 'nearest', behavior: 'instant' });
        element.style.scrollMarginTop = margin;
      }
      const bounds = element ? spotlightBounds(element) : null;
      const next = { stepKey, targetKey, rect: bounds?.rect || null, point: bounds?.point || null,
        interactive: !!element && (element.matches(INTERACTIVE_SELECTOR) || !!element.querySelector(INTERACTIVE_SELECTOR)) };
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