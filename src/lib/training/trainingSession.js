// Shared Training Mode session helpers — used by the Training pill and the
// dashboard's Staff Training catalog so both launch sessions identically.
export const SESSION_KEY = "candora-training-session";

export function readSession() {
  try {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

// Start (or switch to) a Training Mode session for a module and reload, so
// the Training pill pins to that module and auto-launches the guided tour.
export function startTrainingSession(moduleKey) {
  if (!moduleKey) return;
  try {
    sessionStorage.setItem("candora-test-mode", "1");
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ portal: moduleKey, autoStart: true, startedAt: Date.now() }));
  } catch { /* ignore */ }
  window.location.reload();
}