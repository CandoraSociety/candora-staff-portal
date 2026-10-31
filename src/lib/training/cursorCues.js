import { PATHWAYS_JOURNEY_CUES, PATHWAYS_OVERVIEW_CUES, PATHWAYS_ASSESSMENT_CUES, PATHWAYS_WORKSHOPS_CUES } from '@/lib/training/pathwaysCursorCues';
import { COMMON_CURSOR_CUES } from '@/lib/training/commonCursorCues';

const MODULE_CUE_MAPS = {
  pathways_journey: PATHWAYS_JOURNEY_CUES,
  pathways_journey_part2: PATHWAYS_JOURNEY_CUES,
  pathways: PATHWAYS_OVERVIEW_CUES,
  pathways_assessment: PATHWAYS_ASSESSMENT_CUES,
  pathways_workshops: PATHWAYS_WORKSHOPS_CUES,
};

const normalise = (text) => String(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
// Anchor positions are estimated from the spoken script, not evenly distributed
// stops. The media clock controls progression, including buffering and pause.
// A cue can also declare a fixed seconds value when word timings are available.
export function cueProgress(body, phrase) {
  if (typeof phrase === 'number') return phrase;
  const text = normalise(body), anchor = normalise(phrase);
  const offset = text.indexOf(anchor);
  if (offset < 0) return null; // Never send an unmatched cue to an invented time.
  const words = (part) => part.split(/\s+/).filter(Boolean).length;
  return words(text.slice(0, offset)) / Math.max(1, words(text));
}

export function getCursorScript(moduleKey, step) {
  const authored = (MODULE_CUE_MAPS[moduleKey] || COMMON_CURSOR_CUES[moduleKey] || {})[step?.title];
  const primary = step?.target ? { selector: step.target.selector, text: step.target.text } : null;
  const fallback = step?.clickTarget
    ? [{ at: 0, target: { selector: step.clickTarget }, click: true, after: primary }]
    : primary ? [{ at: 0, target: primary }] : [];
  const clientId = step?.routeFallback?.match(/^\/pathways\/client\/(demo-[^/]+)$/)?.[1];
  const scoped = (target) => target ? { ...target, ...(clientId ? { scope: `[data-tour-client="${clientId}"]` } : {}) } : null;
  return {
    cleanup: authored?.cleanup || null,
    setup: (authored?.setup || []).map(name => scoped({ selector: `[data-tour="${name}"]` })),
    cues: (authored?.cues || fallback).map(cue => ({ ...cue, progress: cueProgress(step.body, cue.at), target: scoped(cue.target), after: scoped(cue.after) }))
      .filter(cue => cue.progress !== null).sort((a, b) => a.progress - b.progress),
  };
}