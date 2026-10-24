import { useEffect, useMemo, useState } from 'react';
import { findSpotlightTarget } from '@/components/training/spotlightTarget';
import { activateTourControl, spotlightBounds } from '@/components/training/cursorTarget';
import { getCursorScript } from '@/lib/training/cursorCues';

export default function useSimulatedCursor({ enabled, step, slideKey, moduleKey, audioRef }) {
  const script = useMemo(() => getCursorScript(moduleKey, step), [moduleKey, step]);
  const [state, setState] = useState(null);
  useEffect(() => {
    if (!enabled) return;
    let setupIndex = 0, cueIndex = -1, enteredAt = 0, lastTime = 0, pulseUntil = 0;
    const clicked = new Set();
    const publish = (data) => setState(previous => {
      const next = { slideKey, ...data };
      return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
    });
    const tick = () => {
      // Prepare only explicitly named views, never arbitrary descendants.
      if (setupIndex < script.setup.length) {
        const control = findSpotlightTarget(script.setup[setupIndex]);
        if (activateTourControl(control)) setupIndex += 1;
        publish({ ready: false, activeTarget: null, visible: false });
        return;
      }
      const audio = audioRef.current;
      const time = audio?.currentTime || 0;
      if (time < lastTime) { clicked.clear(); cueIndex = -1; }
      lastTime = time;
      const duration = Number.isFinite(audio?.duration) ? audio.duration : 0;
      const running = !!audio && !audio.paused && !audio.ended;
      // No independent movement timer: a paused or buffering narration cannot
      // silently run the next action. Seeking/replaying derives the same cue.
      let nextIndex = 0;
      if (duration) script.cues.forEach((cue, i) => {
        if (time >= (cue.seconds ?? cue.progress * duration)) nextIndex = i;
      });
      if (cueIndex !== nextIndex) { cueIndex = nextIndex; enteredAt = time; }
      const cue = script.cues[cueIndex];
      if (!cue) { publish({ ready: true, activeTarget: null, visible: false }); return; }
      const element = findSpotlightTarget(cue.target);
      const after = clicked.has(cueIndex) && cue.after;
      const activeTarget = after || cue.target;
      // Each authored click runs once, rather than only the first click on a slide.
      if (running && cue.click && !clicked.has(cueIndex) && element && spotlightBounds(element) && time - enteredAt >= 0.9) {
        if (activateTourControl(element)) { clicked.add(cueIndex); pulseUntil = time + 0.5; }
      }
      publish({ ready: true, activeTarget, visible: !!audio && (time > 0 || running), clicking: running && time < pulseUntil });
    };
    tick();
    const timer = window.setInterval(tick, 80);
    return () => {
      window.clearInterval(timer);
      if (script.cleanup) activateTourControl(findSpotlightTarget(script.cleanup));
    };
  }, [enabled, slideKey, script, audioRef]);
  if (!enabled || state?.slideKey !== slideKey) return { ready: !enabled, activeTarget: null, visible: false };
  return state;
}