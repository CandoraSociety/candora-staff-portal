import { useEffect, useState } from 'react';
import { findSpotlightTarget } from '@/components/training/spotlightTarget';

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
      const bounds = element?.getBoundingClientRect();
      const rect = bounds ? { top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height } : null;
      setFocus(previous => {
        if (previous?.stepKey === stepKey && JSON.stringify(previous.rect) === JSON.stringify(rect)) return previous;
        return { stepKey, rect };
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
  return enabled && focus?.stepKey === stepKey ? focus.rect : null;
}