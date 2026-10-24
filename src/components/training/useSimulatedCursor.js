import { useEffect, useRef, useState } from 'react';
import { findSpotlightTarget } from '@/components/training/spotlightTarget';

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, label, [role="button"], [contenteditable="true"]';
const GLIDE_MS = 1000;

const clickableIn = (el) => (!el ? null : el.matches(INTERACTIVE_SELECTOR) ? el : el.querySelector(INTERACTIVE_SELECTOR));
const centerOf = (el) => {
  const b = el.getBoundingClientRect();
  return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
};
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

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

// One stop resolves to the points the cursor visits in turn: the element
// itself (a section is a place to point at first), then the control inside it
// that the narration describes acting on.
const resolveStop = (stop) => {
  const el = findSpotlightTarget({ selector: stop.selector });
  if (!el) return null;
  const b = el.getBoundingClientRect();
  const center = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  const hit = clickableIn(el);
  const hitPos = hit ? centerOf(hit) : null;
  const points = [];
  if (b.width > 260 || b.height > 140) points.push({ pos: center, pulse: false });
  if (hitPos && (!points.length || distance(points[0].pos, hitPos) > 14)) points.push({ pos: hitPos, pulse: true });
  if (!points.length) points.push({ pos: center, pulse: !!hit });
  return { points, click: stop.click ? hit || el : null };
};

// Plays the slide's action as a cursor while its narration reads: the pointer
// glides from stop to stop — a section, then the control inside it, then the
// next selector the slide spotlights — clicking each control the narration
// describes acting on, and performing view-switching clicks (step.clickTarget)
// for real so the learner never has to navigate themselves.
export default function useSimulatedCursor({ enabled, step, slideKey, narrationMs }) {
  const [cursor, setCursor] = useState({ visible: false, x: null, y: null, clicking: false });
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
    const visit = (si, pi, tries) => {
      if (si >= stops.length) return;
      const resolved = resolveStop(stops[si]);
      if (!resolved) {
        // The page may still be settling after the slide's navigation, or
        // waiting for an earlier stop's click to open this one.
        if (tries < 20) timers.push(setTimeout(() => visit(si, pi, tries + 1), 350));
        else visit(si + 1, 0, 0);
        return;
      }
      const point = resolved.points[pi];
      if (!point) { visit(si + 1, 0, 0); return; }
      if (!lastPos.current || distance(lastPos.current, point.pos) > 12) glide(point.pos);
      timers.push(setTimeout(() => {
        const doClick = !!resolved.click && !clicked;
        if (point.pulse || doClick) pulse();
        if (doClick) { clicked = true; resolved.click.click(); }
        const nextDelay = doClick ? 600 : spacing();
        timers.push(setTimeout(() => {
          if (pi + 1 < resolved.points.length) visit(si, pi + 1, 0);
          else visit(si + 1, 0, 0);
        }, nextDelay));
      }, GLIDE_MS));
    };
    visit(0, 0, 0);
    return clear;
  }, [enabled, slideKey, step?.clickTarget, step?.target?.selector, step?.cursorPath?.join('|')]);

  return cursor;
}