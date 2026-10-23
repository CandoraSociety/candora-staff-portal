import { useEffect, useState } from 'react';
import { findSpotlightTarget } from '@/components/training/spotlightTarget';

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, label, [role="button"], [contenteditable="true"]';

export default function useSpotlightTarget(enabled, target, stepKey) {
  const [focus, setFocus] = useState(null);
  useEffect(() => {
    if (!enabled || !target) return;
    let current = null;
    let frame;
    const measure = () => {
      const element = findSpotlightTarget(target);
      if (element && element !== current) {
        current = element;
        element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      }
      const elements = element ? [element, ...(target.additionalSelectors || []).map(selector => findSpotlightTarget({ selector })).filter(Boolean)] : [];
      const regions = elements.map(node => {
        const bounds = node.getBoundingClientRect();
        return { top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height };
      });
      const top = Math.min(...regions.map(region => region.top));
      const left = Math.min(...regions.map(region => region.left));
      const rect = regions.length ? { top, left,
        width: Math.max(...regions.map(region => region.left + region.width)) - left,
        height: Math.max(...regions.map(region => region.top + region.height)) - top,
        regions,
      } : null;
      // "The highlighted area is live" is only true when something in it takes a click.
      const interactive = elements.some(node => node.matches(INTERACTIVE_SELECTOR) || node.querySelector(INTERACTIVE_SELECTOR));
      setFocus(previous => {
        if (previous?.stepKey === stepKey && previous.interactive === interactive && JSON.stringify(previous.rect) === JSON.stringify(rect)) return previous;
        return { stepKey, rect, interactive };
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    // Keep searching while the slide is open, including delayed data and replaced cards.
    const timer = window.setInterval(schedule, 250);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    return () => {
      window.clearInterval(timer);
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [enabled, target, stepKey]);
  if (!enabled || focus?.stepKey !== stepKey) return null;
  return { rect: focus.rect, interactive: focus.interactive };
}