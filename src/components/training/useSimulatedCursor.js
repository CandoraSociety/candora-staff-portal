import { useEffect, useRef, useState } from 'react';
import { findSpotlightTarget } from '@/components/training/spotlightTarget';

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, label, [role="button"], [contenteditable="true"]';
const GLIDE_MS = 1000;

const clickableIn = (el) => (!el ? null : el.matches(INTERACTIVE_SELECTOR) ? el : el.querySelector(INTERACTIVE_SELECTOR));
const centerOf = (el) => {
  const b = el.getBoundingClientRect();
  return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
};

// The ordered places this slide's narration points at: step.cursorPath when
// the slide names its own stops, otherwise the click it describes
// (clickTarget, performed for real) followed by the spotlight's own selectors —
// never the auto-highlighted sidebar tab, which is orientation, not the
// action being narrated.
const buildStops = (step) => {
  if (step?.cursorPath?.length) return step.cursorPath.map((selector) => ({ selector }));
  const stops = [];
  const seen = new Set();
  const add = (selector, click) => {
    if (!selector || seen.has(selector)) return;
    seen.add(selector);
    stops.push({ selector, click });
  };
  add(step?.clickTarget, true);
  add(step?.target?.selector, false);
  (step?.target?.additionalSelectors || []).forEach((selector) => add(selector, false));
  return stops;
};

// One stop is exactly the element the slide names — nothing more. The cursor
// never guesses at a control that merely happens to live inside a highlighted
// section; a click ripple shows only when the element itself is the control
// the narration describes acting on.
const resolveStop = (stop) => {
  const el = findSpotlightTarget({ selector: stop.selector });
  if (!el) return null;
  return {
    point: centerOf(el),
    pulse: el.matches(INTERACTIVE_SELECTOR),
    click: stop.click ? clickableIn(el) || el : null,
  };
};

// Plays the slide's action as a cursor while its narration reads: the pointer
// glides from stop to stop, clicking each control the narration describes
// acting on, and performing view-switching clicks (step.clickTarget) for real
// so the learner never has to navigate themselves. Reports the stop the
// narration is currently on so the spotlight can follow along.
export default function useSimulatedCursor({ enabled, step, slideKey, narrationMs }) {
  const [cursor, setCursor] = useState({ visible: false, x: null, y: null, clicking: false });
  const [activeSelector, setActiveSelector] = useState(null);
  const lastPos = useRef(null);
  const narrationRef = useRef(null);
  narrationRef.current = narrationMs || null;

  useEffect(() => {
    const timers = [];
    const frames = [];
    const clear = () => { timers.forEach(clearTimeout); frames.forEach(cancelAnimationFrame); };
    const stops = buildStops(step);
    if (!enabled || !step || !stops.length) {
      lastPos.current = null;
      setCursor({ visible: false, x: null, y: null, clicking: false });
      setActiveSelector(null);
      return clear;
    }

    const glide = (pos) => {
      const from = lastPos.current || { x: window.innerWidth / 2, y: window.innerHeight * 0.6 };
      lastPos.current = pos;
      setCursor((c) => ({ ...c, visible: true, x: c.visible ? c.x : from.x, y: c.visible ? c.y : from.y }));
      // Move on the next frame so the glide transition always runs.
      frames.push(requestAnimationFrame(() =>
        frames.push(requestAnimationFrame(() => setCursor((c) => ({ ...c, x: pos.x, y: pos.y }))))
      ));
    };

    const pulse = () => {
      setCursor((c) => ({ ...c, clicking: true }));
      timers.push(setTimeout(() => setCursor((c) => ({ ...c, clicking: false })), 500));
    };

    // Pace the stops along the narration: one stop every few seconds,
    // stretched to fill the audio's length when it is known.
    const spacing = () => {
      const span = narrationRef.current;
      if (!span) return 2400;
      return Math.min(9000, Math.max(1600, (span - 2000) / (stops.length * 2 + 1)));
    };

    let clicked = false;
    const visit = (si, tries) => {
      if (si >= stops.length) return;
      const stop = stops[si];
      const resolved = resolveStop(stop);
      if (!resolved) {
        // The page may still be settling after the slide's navigation, or
        // waiting for an earlier stop's click to open this one.
        if (tries < 20) timers.push(setTimeout(() => visit(si, tries + 1), 350));
        else visit(si + 1, 0);
        return;
      }
      setActiveSelector(stop.selector);
      glide(resolved.point);
      timers.push(setTimeout(() => {
        const doClick = !!resolved.click && !clicked;
        if (resolved.pulse || doClick) pulse();
        if (doClick) { clicked = true; resolved.click.click(); }
        timers.push(setTimeout(() => visit(si + 1, 0), doClick ? 600 : spacing()));
      }, GLIDE_MS));
    };
    visit(0, 0);
    return clear;
  }, [enabled, slideKey, step?.clickTarget, step?.target?.selector, step?.cursorPath?.join('|')]);

  return { ...cursor, activeSelector };
}