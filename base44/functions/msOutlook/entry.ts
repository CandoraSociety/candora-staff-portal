import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { AB_TIME_ZONE } from '../../shared/abTimeZone.ts';
import { OUTLOOK_CONNECTOR_ID, graphRequest, getAppOnlyToken, resolveMailbox } from '../../shared/outlookMail.ts';

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
        const { days = 7 } = body;
        const now = new Date();
        const end = new Date();
        end.setDate(end.getDate() + days);
        const path = `${basePath}/calendarView?startDateTime=${encodeURIComponent(now.toISOString())}&endDateTime=${encodeURIComponent(end.toISOString())}&$top=50&$select=subject,start,end,location,attendees,organizer,bodyPreview&$orderby=start/dateTime`;
        // Without Calendars.Read on the app registration the call comes back 403 —
        // show the "waiting on IT" note instead of an error.
        try {
          const data = await graphRequest(accessToken, path);
          return Response.json({ events: data.value || [], mode });
        } catch (error) {
          if (String(error.message).includes('403')) {
            return Response.json({ events: [], calendarUnavailable: true, mode });
          }
          throw error;
        }
      }

      case 'createCalendarEvent': {
        const { subject, start, end, body: eventBody, location } = body;
        const event = {
          subject,
          body: { contentType: 'HTML', content: eventBody || '' },
          start: { dateTime: start, timeZone: AB_TIME_ZONE },
          end: { dateTime: end, timeZone: AB_TIME_ZONE },
          location: location ? { displayName: location } : undefined,
        };
        try {
          const data = await graphRequest(accessToken, `${basePath}/events`, {
            method: 'POST',
            body: JSON.stringify(event),
          });
          return Response.json({ event: data, mode });
        } catch (error) {
          if (String(error.message).includes('403')) {
            return Response.json({ error: 'Calendar is not enabled for this app yet. Ask IT to grant the Calendars.ReadWrite permission.' }, { status: 400 });
          }
          throw error;
        }
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