import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { graphRequest, getMailboxAccess } from '../../shared/outlookMail.ts';

const INBOX_LIMIT = 25;
const SENT_LIMIT = 10;
const BODY_LIMIT = 4000;

function htmlToText(html) {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function messageToRecord(user, msg, direction) {
  const from = msg.from?.emailAddress || {};
  const recipients = (msg.toRecipients || [])
    .map((r) => r.emailAddress?.address || r.emailAddress?.name)
    .filter(Boolean)
    .join(', ');
  const rawBody = msg.body?.contentType === 'html'
    ? htmlToText(msg.body.content)
    : (msg.body?.content || '');
  const bodyText = (rawBody || msg.bodyPreview || '').slice(0, BODY_LIMIT);
  const subject = msg.subject || '(no subject)';

  return {
    owner_email: user.email,
    external_id: msg.id,
    thread_id: msg.conversationId || msg.id,
    thread_subject: subject,
    subject,
    from_name: from.name || from.address || '',
    from_email: from.address || '',
    recipients,
    direction,
    received_at: msg.receivedDateTime || new Date().toISOString(),
    body_text: bodyText,
    source: 'outlook',
    is_demo: false,
    analysis_state: 'not_analyzed',
  };
}

async function fetchFolder(accessToken, basePath, folder, top) {
  const path = `${basePath}/mailFolders/${folder}/messages?$top=${top}`
    + '&$select=id,conversationId,subject,from,toRecipients,receivedDateTime,body,bodyPreview'
    + '&$orderby=receivedDateTime desc';
  const data = await graphRequest(accessToken, path, {
    headers: { Prefer: 'outlook.body-content-type="text"' },
  });
  return data?.value || [];
}

// Pulls the signed-in employee's own recent mail into their assistant.
// Works with their personal Outlook connection, and with the access the app's
// Microsoft 365 setup already has, so it is useful even before every mailbox
// permission is in place.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let access = null;
    try {
      access = await getMailboxAccess(base44, user);
    } catch (error) {
      return Response.json({ connected: false, error: error.message }, { status: 200 });
    }
    if (!access) {
      return Response.json({
        connected: false,
        error: 'Outlook is not connected for your account yet.',
      }, { status: 200 });
    }

    const [inbox, sent] = await Promise.all([
      fetchFolder(access.accessToken, access.basePath, 'inbox', INBOX_LIMIT),
      fetchFolder(access.accessToken, access.basePath, 'sentitems', SENT_LIMIT).catch(() => []),
    ]);

    // One record per message, even when a message appears in both folders.
    const byId = new Map();
    inbox.forEach((m) => {
      const record = messageToRecord(user, m, 'inbound');
      if (record.external_id) byId.set(record.external_id, record);
    });
    sent.forEach((m) => {
      const record = messageToRecord(user, m, 'outbound');
      if (record.external_id && !byId.has(record.external_id)) byId.set(record.external_id, record);
    });
    const records = Array.from(byId.values());

    const ids = records.map((r) => r.external_id);
    const existing = ids.length
      ? await base44.entities.EmailMessage.filter({ owner_email: user.email, external_id: { $in: ids } })
      : [];
    const known = new Set((existing || []).map((r) => r.external_id));
    const fresh = records.filter((r) => !known.has(r.external_id));

    if (fresh.length) await base44.entities.EmailMessage.bulkCreate(fresh);

    return Response.json({
      connected: true,
      mode: access.mode,
      mailbox: access.profile?.mail || null,
      scanned: records.length,
      imported: fresh.length,
      skipped: records.length - fresh.length,
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    console.log('emailAssistantSyncOutlook failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});