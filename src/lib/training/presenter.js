// ── Presentation screen ────────────────────────────────────────────────────
// A second, clean window for the screen plugged into the facilitator's device.
// Like a projector in presentation mode: it shows the app, its sidebar and the
// training window — never the facilitator sidebar, notes, or any other window.
// The facilitator's window publishes what is on screen; this one follows it.

const KEY = "candora-presentation";
const PARAM = "present";
const FLAG = "candora-presenter";

// The flag is kept for the life of the window so in-app navigation (which
// rewrites the URL) never drops the window out of presentation mode.
export const isPresenterWindow = () => {
  try {
    if (sessionStorage.getItem(FLAG) === "1") return true;
    const on = new URLSearchParams(window.location.search).get(PARAM) === "1";
    if (on) sessionStorage.setItem(FLAG, "1");
    return on;
  } catch {
    return false;
  }
};

export const readPresentation = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
};

export const publishPresentation = (state) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, ts: Date.now() }));
  } catch { /* storage full or blocked — the screen simply keeps the last slide */ }
};

export const subscribePresentation = (cb) => {
  const onStorage = (e) => {
    if (e.key === KEY) cb(readPresentation());
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
};

// Opens the presentation window at the facilitator's current page, so the
// screen starts on the same part of the app they are teaching from.
export const openPresenterWindow = () => {
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, "1");
  const width = Math.min(1440, Math.round(window.screen?.availWidth || 1440));
  const height = Math.min(900, Math.round(window.screen?.availHeight || 900));
  return window.open(url.toString(), "candora-presenter", `popup=yes,width=${width},height=${height}`);
};