import { useEffect, useRef, useState } from 'react';
import { findSpotlightTarget } from '@/components/training/spotlightTarget';

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, label, [role="button"], [contenteditable="true"]';

// The clickable element in or under a spotlight node: the node itself when it
// takes a click, otherwise its first interactive descendant.
const clickableIn = (el) => (!el ? null : el.matches(INTERACTIVE_SELECTOR) ? el : el.querySelector(INTERACTIVE_SELECTOR));

const centerOf = (el) => {
  const b = el.getBoundingClientRect();
  return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
};

// Plays the slide's action as a cursor while its narration reads: the pointer
// glides to whatever the slide is describing — the click it tells the learner
// to make when there is one, otherwise the spotlight's target — and clicks it.
// Clicks that only switch the view (step.clickTarget) are performed for real,
// so the learner never has to navigate themselves.
export default function useSimulatedCursor({ enabled, step, focus, slideKey }) {
  const [cursor, setCursor] = useState({ visible: false, x: null, y: null, clicking: false });
  const focusRef = useRef(null);
  focusRef.current = focus;
  const lastPos = useRef(null);

  useEffect(() => {
    const timers = [];
    const frames = [];
    const clear = () => { timers.forEach(clearTimeout); frames.forEach(cancelAnimationFrame); };
    if (!enabled || !step) {
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

    const destination = () => {
      // The element this slide's narration describes clicking.
      if (step.clickTarget) {
        const el = clickableIn(findSpotlightTarget({ selector: step.clickTarget }));
        if (el) return { pos: centerOf(el), click: el };
        // Fall through: the view that button opens is already on screen.
      }
      const selector = step.target?.selector;
      const hit = selector ? clickableIn(findSpotlightTarget({ selector })) : null;
      if (hit && focusRef.current?.interactive) return { pos: centerOf(hit), click: null };
      const region = focusRef.current?.rect?.regions?.[0];
      if (!region) return null;
      return { pos: { x: region.left + region.width / 2, y: region.top + region.height / 2 }, click: null };
    };

    const play = (tries) => {
      const dest = destination();
      if (!dest) {
        // The page may still be settling after the slide's navigation.
        if (tries < 16) timers.push(setTimeout(() => play(tries + 1), 250));
        return;
      }
      glide(dest.pos);
      // Arrive, then click the way the narration describes it.
      timers.push(setTimeout(() => {
        if (!dest.click && !focusRef.current?.interactive) return;
        setCursor((c) => ({ ...c, clicking: true }));
        timers.push(setTimeout(() => setCursor((c) => ({ ...c, clicking: false })), 500));
        if (dest.click) dest.click.click();
        // When the click opens the view this slide spotlights, drift over to it.
        if (dest.click) {
          timers.push(setTimeout(() => {
            const region = focusRef.current?.rect?.regions?.[0];
            if (region) glide({ x: region.left + region.width / 2, y: region.top + region.height / 2 });
          }, 1400));
        }
      }, 1150));
    };
    timers.push(setTimeout(() => play(0), 450));
    return clear;
  }, [enabled, slideKey, step?.clickTarget, step?.target?.selector]);

  return cursor;
}