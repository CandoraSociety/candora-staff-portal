// External Reception portal — a kiosk sign-in that is deliberately not tied to
// an app user. Whoever is at the front desk enters their name and the desk PIN,
// and the name travels with them for the rest of the browser tab.
const SESSION_KEY = 'reception_portal_session';

export const RECEPTION_PORTAL_PIN = '5011';

export function getReceptionPortalSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function startReceptionPortalSession(name) {
  const session = { name: name.trim(), started_at: new Date().toISOString() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function endReceptionPortalSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isReceptionPortalRoute(pathname = window.location.pathname) {
  return pathname.startsWith('/reception-portal');
}