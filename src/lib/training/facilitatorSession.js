// ── Facilitated training sessions ─────────────────────────────────────────
// A facilitator starts a session from the Training Hub: the portal opens in
// Test Mode with the guided tour in presentation mode, a facilitator sidebar
// beside it and a briefing checklist — all without creating a TrainingProgress
// record for the facilitator (their own learner progress is never touched).

import { stripComputed } from "@/lib/training/planTimeline";

const FACILITATOR_SESSION_KEY = "candora-facilitator-session";
const LEARNER_SESSION_KEY = "candora-training-session";

export const readFacilitatorSession = () => {
  try {
    const s = sessionStorage.getItem(FACILITATOR_SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

const writeSession = (session) => {
  try { sessionStorage.setItem(FACILITATOR_SESSION_KEY, JSON.stringify(session)); } catch { /* ignore */ }
};

// Only what the sidebar needs from a training-day plan.
const planSnapshot = (plan) => (plan ? {
  id: plan.id,
  title: plan.title || "Training day",
  plan_date: plan.plan_date || "",
  audience: plan.audience || "",
  start_time: plan.start_time || "09:00",
  summary: plan.summary || "",
  blocks: stripComputed(plan.blocks || []),
  follow_up: (plan.follow_up || []).filter(f => f.module_key),
} : null);

// Start facilitating a module. Passing the training-day plan the module belongs
// to keeps the day's agenda in the facilitator sidebar for the whole session.
export const startFacilitatedSession = (module, { plan = null, blockIndex = 0 } = {}) => {
  try {
    sessionStorage.setItem("candora-test-mode", "1");
    // A learner session left over from earlier must not take the screen back.
    sessionStorage.removeItem(LEARNER_SESSION_KEY);
  } catch { /* ignore */ }
  writeSession({
    portal: module.key,
    startedAt: Date.now(),
    blockIndex,
    plan: planSnapshot(plan),
  });
  window.location.assign(module.path);
};

// Move the running session onto another module of the same day.
export const goToFacilitatorBlock = (module, blockIndex = 0) => {
  const current = readFacilitatorSession();
  writeSession({ ...(current || {}), portal: module.key, blockIndex, startedAt: current?.startedAt || Date.now() });
  // The room was briefed at the start of the day — later blocks don't re-ask.
  markBriefed(module.key);
  window.location.assign(module.path);
};

// Was the room briefing already shown for this session? It is a start-of-day
// prompt, so it appears once per module per browser tab.
export const wasBriefed = (moduleKey) => {
  try { return sessionStorage.getItem(`candora-facilitator-briefed-${moduleKey}`) === "1"; } catch { return true; }
};

export const markBriefed = (moduleKey) => {
  try { sessionStorage.setItem(`candora-facilitator-briefed-${moduleKey}`, "1"); } catch { /* ignore */ }
};

const BRIEFING_PREFIX = "candora-facilitator-briefed-";

export const endFacilitatedSession = () => {
  try {
    sessionStorage.removeItem(FACILITATOR_SESSION_KEY);
    sessionStorage.removeItem("candora-test-mode");
    sessionStorage.removeItem(LEARNER_SESSION_KEY);
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(BRIEFING_PREFIX))
      .forEach(k => sessionStorage.removeItem(k));
  } catch { /* ignore */ }
  window.location.reload();
};