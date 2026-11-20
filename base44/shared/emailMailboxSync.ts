import { graphRequest, getMailboxAccess } from './outlookMail.ts';

const FIELDS = 'id,conversationId,subject,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,body,bodyPreview,isDraft';
const HEADERS = { Prefer: 'outlook.body-content-type="text"' };

function textBody(msg) {
  const content = msg.body?.content || msg.bodyPreview || '';
  if (String(msg.body?.contentType).toLowerCase() !== 'html') return content;
  return content.replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(?:p|div|tr|li|h[1-6])>/gi, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
}

function toRecord(user, msg, direction) {
  const from = msg.from?.emailAddress || {};
  const addresses = (list) => (list || []).map((r) => r.emailAddress?.address || r.emailAddress?.name).filter(Boolean).join(', ');
  const cc = addresses(msg.ccRecipients);
  const raw = textBody(msg).trim();
  return {
    owner_email: user.email, external_id: msg.id, thread_id: msg.conversationId || msg.id,
    thread_subject: msg.subject || '(no subject)', subject: msg.subject || '(no subject)',
    from_name: from.name || from.address || '', from_email: from.address || '',
    recipients: [addresses(msg.toRecipients), cc ? `Cc: ${cc}` : ''].filter(Boolean).join('; '),
    direction, received_at: (direction === 'outbound' ? msg.sentDateTime : msg.receivedDateTime) || msg.receivedDateTime || '',
    // The stored field has a hard size limit; long newsletters and threads are
    // trimmed here and marked so the analysis knows the text is incomplete.
    body_text: raw.length > 8000 ? `${raw.slice(0, 8000)}\n[message body truncated]` : raw,
    source: 'outlook', is_demo: false,
  };
}

async function storeMessages(base44, user, records) {
  const deduped = [...new Map(records.filter((m) => m.external_id).map((m) => [m.external_id, m])).values()];
  let imported = 0;
  let updated = 0;
  for (let offset = 0; offset < deduped.length; offset += 400) {
    const batch = deduped.slice(offset, offset + 400);
    const page = await base44.entities.EmailMessage.filter(
      { owner_email: user.email, external_id: { $in: batch.map((m) => m.external_id) } }, { limit: 500 }
    );
    const existing = new Map(page.items.map((m) => [m.external_id, m]));
    const fresh = batch.filter((m) => !existing.has(m.external_id));
    const changes = batch.flatMap((m) => {
      const prior = existing.get(m.external_id);
      if (!prior || !Object.keys(m).some((key) => prior[key] !== m[key])) return [];
      return [{ id: prior.id, ...m, analysis_state: 'not_analyzed' }];
    });
    if (fresh.length) await base44.entities.EmailMessage.bulkCreate(fresh.map((m) => ({ ...m, analysis_state: 'not_analyzed' })));
    if (changes.length) await base44.entities.EmailMessage.bulkUpdate(changes);
    imported += fresh.length;
    updated += changes.length;
  }
  return { imported, updated, scanned: deduped.length, skipped: deduped.length - imported - updated };
}

// How far back the assistant reads the mailbox.
const WINDOW_DAYS = 14;
const FOLDERS = [
  { id: 'inbox', direction: 'inbound', cap: 300 },
  { id: 'sentitems', direction: 'outbound', cap: 200 },
];

async function listSince(access, folder, since) {
  const messages = [];
  let path = `${access.basePath}/mailFolders/${folder.id}/messages?$filter=${encodeURIComponent(`receivedDateTime ge ${since}`)}&$select=${FIELDS}&$top=50&$orderby=receivedDateTime desc`;
  while (path && messages.length < folder.cap) {
    const data = await graphRequest(access.accessToken, path, { headers: HEADERS, signal: AbortSignal.timeout(25000) });
    messages.push(...(data?.value || []));
    const next = data?.['@odata.nextLink'];
    if (next && !next.startsWith('https://graph.microsoft.com/v1.0/')) throw new Error('Unexpected mailbox continuation.');
    path = next ? next.slice('https://graph.microsoft.com/v1.0'.length) : '';
  }
  return messages.slice(0, folder.cap);
}

export async function syncRecentMail(base44, user) {
  const access = await getMailboxAccess(base44, user);
  if (!access) return { connected: false, error: 'Outlook is not connected for your account yet.' };
  const profile = access.profile || await graphRequest(access.accessToken, `${access.basePath}?$select=mail,userPrincipalName`);
  const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString();
  const folders = await Promise.allSettled(FOLDERS.map((folder) => listSince(access, folder, since)));
  if (folders[0].status === 'rejected') throw folders[0].reason;
  const records = folders.flatMap((result, index) => result.status === 'fulfilled'
    ? result.value.filter((m) => !m.isDraft).map((m) => toRecord(user, m, FOLDERS[index].direction)) : []);
  const stored = await storeMessages(base44, user, records);
  return { connected: true, mode: access.mode, mailbox: profile?.mail || profile?.userPrincipalName || '',
    window_days: WINDOW_DAYS, ...stored,
    warnings: folders[1].status === 'rejected' ? ['Sent mail could not be refreshed.'] : [], synced_at: new Date().toISOString() };
}

export async function refreshEmailThreads(base44, user, threadIds) {
  if (!threadIds.length) return { failed: [], incomplete: [] };
  const access = await getMailboxAccess(base44, user);
  if (!access) return { failed: threadIds, incomplete: [] };
  const profile = access.profile || await graphRequest(access.accessToken, `${access.basePath}?$select=mail,userPrincipalName`);
  const mailbox = String(profile?.mail || profile?.userPrincipalName || user.email).toLowerCase();
  const results = await Promise.allSettled(threadIds.map(async (threadId) => {
    const filter = `receivedDateTime ge 1900-01-01T00:00:00Z and conversationId eq '${threadId.replace(/'/g, "''")}' and isDraft eq false`;
    let path = `${access.basePath}/messages?$filter=${encodeURIComponent(filter)}&$select=${FIELDS}&$top=50&$orderby=receivedDateTime desc`;
    const messages = [];
    for (let page = 0; path && page < 2; page++) {
      const data = await graphRequest(access.accessToken, path, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
      messages.push(...(data?.value || []));
      const next = data?.['@odata.nextLink'];
      if (next && !next.startsWith('https://graph.microsoft.com/v1.0/')) throw new Error('Unexpected mailbox continuation.');
      path = next ? next.slice('https://graph.microsoft.com/v1.0'.length) : '';
    }
    if (!messages.length) throw new Error('Conversation could not be refreshed.');
    return { threadId, incomplete: !!path, records: messages.map((msg) => toRecord(user, msg,
      String(msg.from?.emailAddress?.address || '').toLowerCase() === mailbox ? 'outbound' : 'inbound')) };
  }));
  const succeeded = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  await storeMessages(base44, user, succeeded.flatMap((r) => r.records));
  return {
    failed: results.flatMap((r, index) => r.status === 'rejected' ? [threadIds[index]] : []),
    incomplete: succeeded.filter((r) => r.incomplete).map((r) => r.threadId),
  };
}