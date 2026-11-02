// ── Facilitator resources ─────────────────────────────────────────────────
// What the room needs before a session starts, and the extra material that
// belongs to each section of a module — kept out of the sidebar component so
// the same lists can be used by the briefing prompt and the run-sheet.

import { getFacilitatorGuide } from "@/lib/training/facilitatorGuide";
import { PATHWAYS_HANDOUTS } from "@/lib/training/pathwaysHandouts";

const PATHWAYS_MODULES = new Set([
  "pathways",
  "pathways_journey",
  "pathways_journey_part2",
  "pathways_assessment",
  "pathways_service_nav",
  "pathways_workshops",
]);

export const isPathwaysModule = (moduleKey) => PATHWAYS_MODULES.has(String(moduleKey || ""));

export const getModuleObjectives = (module) => getFacilitatorGuide(module?.key)?.objectives || [];

export const getModuleTips = (module) => getFacilitatorGuide(module?.key)?.tips || [];

// Handouts are printed from the day's plan, so they only exist while a plan is
// driving the session — a single module run has nothing to print from. The
// attendee agenda is built from any plan; the Pathways reference card and
// practice worksheet only make sense in a Pathways session.
export const getRoomHandouts = (module, plan) => {
  if (!plan) return [];
  return isPathwaysModule(module?.key) ? PATHWAYS_HANDOUTS : [PATHWAYS_HANDOUTS[0]];
};

// The start-of-session briefing: hand out what participants need, then get the
// room ready. Order matters — handouts first, screens last.
export const getBriefingItems = (module, plan) => {
  const items = [];
  const handouts = getRoomHandouts(module, plan);

  if (handouts.length) {
    items.push({
      id: "handouts",
      label: "Hand out the printed materials for the day",
      detail: handouts.map(h => h.title).join(" · "),
    });
  } else {
    items.push({
      id: "materials",
      label: "Hand out anything printed for this session",
      detail: "Agenda, reference card, worksheet — or ask the room who still needs a copy.",
    });
  }
  if (module?.tasks?.length) {
    items.push({
      id: "practice",
      label: "A practice worksheet and a pen at every seat",
      detail: "Participants fill these in during the hands-on part, not during the tour.",
    });
  }
  items.push({
    id: "signin",
    label: "Every participant signed in on their own device",
    detail: "They follow along in their own account; the tour is watched on the big screen.",
  });
  items.push({
    id: "screen",
    label: "Projector connected, with this window on it",
    detail: "Your own facilitator sidebar stays on your laptop, never on the projector.",
  });
  items.push({
    id: "testmode",
    label: "Test Mode is on — demo data only",
    detail: "Say it out loud at the start: nothing they click in this session touches real records.",
  });

  const objectives = getModuleObjectives(module);
  if (objectives.length) {
    items.push({
      id: "objectives",
      label: "Read the session objectives to the room",
      detail: objectives[0],
    });
  }
  return items;
};

// A section's own talking point plus the one screen it lives on. Sections with
// no written guidance still get the slide's own text, so the panel is never
// empty while the room watches.
export const getSectionNote = (module, step) => {
  const guide = getFacilitatorGuide(module?.key);
  return guide?.stepNotes?.[step?.title]
    || step?.body
    || "Follow the words on the slide and keep the pace moving.";
};

export const getPracticeNote = (module, task) => {
  const guide = getFacilitatorGuide(module?.key);
  return guide?.practiceNotes?.[task?.id] || task?.body || "";
};