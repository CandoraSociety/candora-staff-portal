// Job Lab participant session — per browser tab (sessionStorage) by design,
// so a kiosk tab closes cleanly. Isolated from the staff app's own auth.
const KEY = 'joblab_session';

export function readSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSession(session) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}