import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { AB_TIME_ZONE } from '../../shared/abTimeZone.ts';

const OUTLOOK_CONNECTOR_ID = '6a43f36f28e8ea04989eb603';

async function graphRequest(accessToken, path, options = {}) {
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
async function getAppOnlyToken() {
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
async function resolveMailbox(base44, user, accessToken) {
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // Preferred path: the staff member's own Outlook connection (full mail + calendar).
    let accessToken = null;
    let basePath = '/me';
    let mode = 'delegated';
    let mailboxProfile = null;

    try {
      const connection = await base44.asServiceRole.connectors.getCurrentAppUserConnection(OUTLOOK_CONNECTOR_ID);
      accessToken = connection?.accessToken || null;
    } catch {
      accessToken = null;
    }

    // Fallback: read the staff member's own mailbox with the app's existing
    // directory-level access, so Outlook works without another sign-in.
    if (!accessToken) {
      accessToken = await getAppOnlyToken();
      if (!accessToken) {
        return Response.json({ error: 'Outlook is unavailable: no Microsoft credentials are configured for this app.' }, { status: 500 });
      }
      const resolved = await resolveMailbox(base44, user, accessToken);
      basePath = `/users/${encodeURIComponent(resolved.mailbox)}`;
      mailboxProfile = resolved.profile;
      mode = 'app_only';
    }

    switch (action) {
      case 'getProfile': {
        const profile = mode === 'app_only'
          ? mailboxProfile
          : await graphRequest(accessToken, '/me?$select=displayName,mail,userPrincipalName');
        return Response.json({ profile, mode });
      }

      case 'listEmails': {
        const { top = 25, folder = 'inbox' } = body;
        const path = `${basePath}/mailFolders/${folder}/messages?$top=${top}&$select=subject,from,toRecipients,receivedDateTime,bodyPreview,hasAttachments,isRead&$orderby=receivedDateTime desc`;
        const data = await graphRequest(accessToken, path);
        return Response.json({ emails: data.value || [], mode });
      }

      case 'getEmail': {
        const { messageId } = body;
        const data = await graphRequest(accessToken, `${basePath}/messages/${messageId}?$select=subject,from,toRecipients,ccRecipients,receivedDateTime,body,hasAttachments`);
        return Response.json({ email: data, mode });
      }

      case 'markAsRead': {
        const { messageId } = body;
        await graphRequest(accessToken, `${basePath}/messages/${messageId}`, {
          method: 'PATCH',
          body: JSON.stringify({ isRead: true }),
        });
        return Response.json({ success: true, mode });
      }

      case 'sendEmail': {
        const { to, subject, body: emailBody, cc } = body;
        const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean).map(email => ({ emailAddress: { address: email } }));
        const ccRecipients = cc ? (Array.isArray(cc) ? cc : [cc]).filter(Boolean).map(email => ({ emailAddress: { address: email } })) : [];

        // Without Mail.Send granted to the app, compose is saved to the mailbox
        // drafts folder so the staff member sends it from Outlook itself.
        if (mode === 'app_only') {
          await graphRequest(accessToken, `${basePath}/messages`, {
            method: 'POST',
            body: JSON.stringify({
              subject,
              body: { contentType: 'HTML', content: emailBody || '' },
              toRecipients: recipients,
              ccRecipients,
            }),
          });
          return Response.json({ success: true, savedAsDraft: true, mode });
        }

        await graphRequest(accessToken, '/me/sendMail', {
          method: 'POST',
          body: JSON.stringify({
            message: {
              subject,
              body: { contentType: 'HTML', content: emailBody || '' },
              toRecipients: recipients,
              ccRecipients,
            },
            saveToSentItems: true,
          }),
        });
        return Response.json({ success: true, savedAsDraft: false, mode });
      }

      case 'listCalendarEvents': {
        if (mode === 'app_only') {
          return Response.json({ events: [], calendarUnavailable: true, mode });
        }
        const { days = 7 } = body;
        const now = new Date();
        const end = new Date();
        end.setDate(end.getDate() + days);
        const path = `/me/calendarView?startDateTime=${encodeURIComponent(now.toISOString())}&endDateTime=${encodeURIComponent(end.toISOString())}&$top=50&$select=subject,start,end,location,attendees,organizer,bodyPreview&$orderby=start/dateTime`;
        const data = await graphRequest(accessToken, path);
        return Response.json({ events: data.value || [], mode });
      }

      case 'createCalendarEvent': {
        if (mode === 'app_only') {
          return Response.json({ error: 'Calendar is not enabled for this app yet. Ask IT to grant the Calendars.ReadWrite permission.' }, { status: 400 });
        }
        const { subject, start, end, body: eventBody, location } = body;
        const event = {
          subject,
          body: { contentType: 'HTML', content: eventBody || '' },
          start: { dateTime: start, timeZone: AB_TIME_ZONE },
          end: { dateTime: end, timeZone: AB_TIME_ZONE },
          location: location ? { displayName: location } : undefined,
        };
        const data = await graphRequest(accessToken, '/me/events', {
          method: 'POST',
          body: JSON.stringify(event),
        });
        return Response.json({ event: data, mode });
      }

      case 'deleteEmail': {
        const { messageId } = body;
        await graphRequest(accessToken, `${basePath}/messages/${messageId}`, { method: 'DELETE' });
        return Response.json({ success: true, mode });
      }

      default:
        return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});