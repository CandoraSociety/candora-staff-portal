// Shared Microsoft 365 / Outlook mailbox access.
// Used by the Outlook portal and by the AI Email Assistant, so both read the
// same mailbox the same way: the staff member's own connection first, then the
// app's existing directory-level access as a fallback.

export const OUTLOOK_CONNECTOR_ID = '6a43f36f28e8ea04989eb603';

export async function graphRequest(accessToken, path, options: any = {}) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Graph API error ${res.status}: ${errText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// App-only token from the app registration our IT already consented.
// This is how Outlook works when a staff member has not (or cannot) run the
// per-person Microsoft sign-in.
export async function getAppOnlyToken() {
  const tenantId = Deno.env.get('AZURE_TENANT_ID');
  const clientId = Deno.env.get('AZURE_CLIENT_ID');
  const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET');
  if (!tenantId || !clientId || !clientSecret) return null;

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });
  const data = await res.json().catch(() => ({}));
  return data.access_token || null;
}

// Work out which Microsoft 365 mailbox belongs to the signed-in staff member.
export async function resolveMailbox(base44, user, accessToken) {
  const candidates = [];
  const push = (value) => {
    if (value && !candidates.includes(value.toLowerCase())) candidates.push(value.toLowerCase());
  };

  push(user.email);
  try {
    const byUser = await base44.asServiceRole.entities.Employee.filter({ user_id: user.id }, '-created_date', 1);
    push(byUser?.[0]?.email);
  } catch { /* employee record is optional */ }
  try {
    const byEmail = await base44.asServiceRole.entities.Employee.filter({ email: user.email }, '-created_date', 1);
    push(byEmail?.[0]?.email);
  } catch { /* employee record is optional */ }

  for (const address of candidates) {
    try {
      const found = await graphRequest(accessToken, `/users/${encodeURIComponent(address)}?$select=displayName,mail,userPrincipalName`);
      if (found?.mail) return { mailbox: found.mail, profile: found };
    } catch { /* try next candidate */ }
  }

  throw new Error(`No Microsoft 365 mailbox is linked to ${user.email}. Ask IT to confirm your Candora email address.`);
}

// Resolve how to read this person's mailbox.
// Returns { accessToken, basePath, mode, profile } — mode is 'delegated' when
// they connected their own Outlook account, 'app_only' when we fall back to the
// access the app already has — or null when neither is available.
export async function getMailboxAccess(base44, user) {
  let accessToken = null;
  try {
    const connection = await base44.asServiceRole.connectors.getCurrentAppUserConnection(OUTLOOK_CONNECTOR_ID);
    accessToken = connection?.accessToken || null;
  } catch {
    accessToken = null;
  }

  if (accessToken) {
    return { accessToken, basePath: '/me', mode: 'delegated', profile: null };
  }

  const appToken = await getAppOnlyToken();
  if (!appToken) return null;

  const resolved = await resolveMailbox(base44, user, appToken);
  return {
    accessToken: appToken,
    basePath: `/users/${encodeURIComponent(resolved.mailbox)}`,
    mode: 'app_only',
    profile: resolved.profile,
  };
}