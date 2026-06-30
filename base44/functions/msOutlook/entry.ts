import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(OUTLOOK_CONNECTOR_ID);

    switch (action) {
      case 'getProfile': {
        const profile = await graphRequest(accessToken, '/me?$select=displayName,mail,userPrincipalName');
        return Response.json({ profile });
      }

      case 'listEmails': {
        const { top = 25, folder = 'inbox' } = body;
        const path = `/me/mailFolders/${folder}/messages?$top=${top}&$select=subject,from,toRecipients,receivedDateTime,bodyPreview,hasAttachments,isRead&$orderby=receivedDateTime desc`;
        const data = await graphRequest(accessToken, path);
        return Response.json({ emails: data.value || [] });
      }

      case 'getEmail': {
        const { messageId } = body;
        const data = await graphRequest(accessToken, `/me/messages/${messageId}?$select=subject,from,toRecipients,ccRecipients,receivedDateTime,body,hasAttachments`);
        return Response.json({ email: data });
      }

      case 'sendEmail': {
        const { to, subject, body: emailBody, cc } = body;
        const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean).map(email => ({ emailAddress: { address: email } }));
        const ccRecipients = cc ? (Array.isArray(cc) ? cc : [cc]).filter(Boolean).map(email => ({ emailAddress: { address: email } })) : [];
        const message = {
          message: {
            subject,
            body: { contentType: 'HTML', content: emailBody || '' },
            toRecipients: recipients,
            ccRecipients,
          },
          saveToSentItems: true,
        };
        await graphRequest(accessToken, '/me/sendMail', {
          method: 'POST',
          body: JSON.stringify(message),
        });
        return Response.json({ success: true });
      }

      case 'listCalendarEvents': {
        const { days = 7 } = body;
        const now = new Date();
        const end = new Date();
        end.setDate(end.getDate() + days);
        const path = `/me/calendarView?startDateTime=${encodeURIComponent(now.toISOString())}&endDateTime=${encodeURIComponent(end.toISOString())}&$top=50&$select=subject,start,end,location,attendees,organizer,bodyPreview&$orderby=start/dateTime`;
        const data = await graphRequest(accessToken, path);
        return Response.json({ events: data.value || [] });
      }

      case 'createCalendarEvent': {
        const { subject, start, end, body: eventBody, location } = body;
        const event = {
          subject,
          body: { contentType: 'HTML', content: eventBody || '' },
          start: { dateTime: start, timeZone: 'America/Edmonton' },
          end: { dateTime: end, timeZone: 'America/Edmonton' },
          location: location ? { displayName: location } : undefined,
        };
        const data = await graphRequest(accessToken, '/me/events', {
          method: 'POST',
          body: JSON.stringify(event),
        });
        return Response.json({ event: data });
      }

      case 'deleteEmail': {
        const { messageId } = body;
        await graphRequest(accessToken, `/me/messages/${messageId}`, { method: 'DELETE' });
        return Response.json({ success: true });
      }

      default:
        return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});