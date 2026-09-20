import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { normalizeUser } from '@/lib/userDisplayName';

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