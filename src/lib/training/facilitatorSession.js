// ── Facilitated training sessions ─────────────────────────────────────────
// A facilitator starts a session from the Training Hub: the portal opens in
// Test Mode with the guided tour in presentation mode, plus a talking-points
// panel — all without creating a TrainingProgress record for the facilitator
// (their own learner progress is never touched).

const FACILITATOR_SESSION_KEY = "candora-facilitator-session";

export const readFacilitatorSession = () => {
  try {
    const s = sessionStorage.getItem(FACILITATOR_SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

// Turn on Test Mode and land on the module's portal. The page reloads (via the
// assign) so the sandbox interceptor picks up immediately.
export const startFacilitatedSession = (module) => {
  try {
    sessionStorage.setItem("candora-test-mode", "1");
    sessionStorage.setItem(FACILITATOR_SESSION_KEY, JSON.stringify({ portal: module.key, startedAt: Date.now() }));
  } catch { /* ignore */ }
  window.location.assign(module.path);
};

export const endFacilitatedSession = () => {
  try {
    sessionStorage.removeItem(FACILITATOR_SESSION_KEY);
    sessionStorage.removeItem("candora-test-mode");
    sessionStorage.removeItem("candora-training-session");
  } catch { /* ignore */ }
  window.location.reload();
};