import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { normalizeUser } from '@/lib/userDisplayName';
import { isTestMode, installTestModeInterceptor } from '@/lib/testMode/sandbox';
import normalizeTimestamps from '@/lib/abTimestamps';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// ── Central display-name normalization ──────────────────────────────────────
// Some platform accounts have their built-in full_name created from the email
// prefix (e.g. "graham.currie"), and that field is read-only. Every User
// record and auth result read through this client is normalized to a proper
// display name ("Graham Currie"), so no list, view, or stored value anywhere
// carries the email-prefix name again.
const normalizeResult = (res) =>
  Array.isArray(res) ? res.map(normalizeUser) : normalizeUser(res);

const UserEntity = base44.entities.User;
for (const method of ['list', 'filter', 'get']) {
  const original = UserEntity[method].bind(UserEntity);
  UserEntity[method] = async (...args) => normalizeResult(await original(...args));
}

const originalMe = base44.auth.me.bind(base44.auth);
base44.auth.me = async (...args) => normalizeUser(await originalMe(...args));

// ── Test Mode ──────────────────────────────────────────────────────────────
// When Test Mode is on (in-app toggle), all data layers of this client are
// swapped for the in-memory sandbox: reads return simulated demo records,
// writes and live-service calls are simulated and never reach the backend.
if (isTestMode()) installTestModeInterceptor(base44);

// ── Alberta time ───────────────────────────────────────────────────────────
// created_date / updated_date come back as bare UTC ("…T07:09:29.557000", no
// trailing Z), which browsers read as local time — that is why clocks around
// the app read six hours fast. Stamp them as UTC as the records arrive, so they
// render in Alberta time like everything else. Staff-entered times
// (appointment_date, session_date, start_datetime …) are left untouched: they
// are already Alberta wall clock.
const RECORD_RETURNING_METHODS = new Set([
  'list', 'filter', 'get', 'create', 'bulkCreate', 'update', 'bulkUpdate'
]);
const wrappedEntities = new Map();

const wrapEntity = (entity) =>
  new Proxy(entity, {
    get(target, method, receiver) {
      const value = Reflect.get(target, method, receiver);
      if (typeof method !== 'string' || typeof value !== 'function' || !RECORD_RETURNING_METHODS.has(method)) {
        return value;
      }
      return async (...args) => normalizeTimestamps(await value.apply(target, args));
    }
  });

base44.entities = new Proxy(base44.entities, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (typeof prop !== 'string' || !value || typeof value !== 'object') return value;
    if (!wrappedEntities.has(prop)) wrappedEntities.set(prop, wrapEntity(value));
    return wrappedEntities.get(prop);
  }
});