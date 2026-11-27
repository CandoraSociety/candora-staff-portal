// Kids Gift Shop family email leaves through the staff member's own Candora
// Outlook mailbox whenever one is connected, so it is sent from Candora's own
// Microsoft 365 tenant. A family address that bounces then affects only that
// mailbox, never the app's ability to reach every other family. The app's own
// email service is used when no mailbox is connected, or when the message
// carries an attachment — only the app service can take one straight from
// storage.
import { OUTLOOK_CONNECTOR_ID, graphRequest } from './outlookMail.ts';

async function outlookToken(base44) {
  try {
    const connection = await base44.asServiceRole.connectors.getCurrentAppUserConnection(OUTLOOK_CONNECTOR_ID);
    return connection?.accessToken || null;
  } catch {
    return null;
  }
}

// Sends one family email. Returns { ok, via } — via is 'outlook' when it left
// through a connected mailbox, 'app' when the app's email service carried it.
export async function sendFamilyEmail(base44, { to, subject, html, templateName, variables, fromName, attachment = null }) {
  if (to && html && !attachment?.file_uri) {
    const accessToken = await outlookToken(base44);
    if (accessToken) {
      try {
        await graphRequest(accessToken, '/me/sendMail', {
          method: 'POST',
          body: JSON.stringify({
            message: {
              subject,
              body: { contentType: 'HTML', content: html },
              toRecipients: [{ emailAddress: { address: to } }],
            },
            saveToSentItems: true,
          }),
        });
        return { ok: true, via: 'outlook' };
      } catch (error) {
        console.log(`Outlook send failed for ${to}, falling back to app email:`, error.message);
      }
    }
  }

  try {
    const sent = await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      ...(templateName ? { template_name: templateName, variables } : { subject, html }),
      category: 'transactional',
      from_name: fromName,
      ...(attachment?.file_uri
        ? { attachments: [{ filename: attachment.name || 'attachment', file_url: attachment.file_uri }] }
        : {}),
    });
    if (sent && sent.success === false) {
      return { ok: false, reason: sent.message || `The email could not be sent (${sent.reason || 'refused'}).` };
    }
    return { ok: true, via: 'app' };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const card = (label, value) => `
  <td style="padding:0 6px 14px;vertical-align:top;width:50%;">
    <div style="border:1px solid #dadce7;border-radius:10px;padding:18px 20px;background:#ffffff;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#0a0f29;font-family:Arial,sans-serif;">${escapeHtml(label)}</p>
      <p style="margin:0;font-size:19px;line-height:1.3;font-weight:700;color:#080c21;font-family:Arial,sans-serif;">${escapeHtml(value)}</p>
    </div>
  </td>`;

// The invitation, written out as email-ready HTML so it can leave through a
// mailbox. Same copy and design as the app's own invitation email.
export function inviteEmailHtml({
  guardianName,
  customMessage,
  eventDate,
  eventLocation,
  inviteLink,
  childrenAllowed,
  expiresOn,
  contactEmail,
}) {
  const contact = escapeHtml(contactEmail || 'info@candorasociety.com');
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f9fafb;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;">
  <tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:10px;overflow:hidden;">

      <tr><td style="background:#fccf03;padding:20px 36px;text-align:center;">
        <p style="margin:0;font-size:12px;letter-spacing:4px;text-transform:uppercase;font-weight:700;color:#0a0f29;font-family:Arial,sans-serif;">Candora 360</p>
      </td></tr>

      <tr><td style="background:#fccf03;padding:36px 36px 38px;">
        <p style="margin:0 0 14px;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#0a0f29;font-family:Arial,sans-serif;">Winter Wonderland · Kids Gift Shop</p>
        <h1 style="margin:0 0 16px;font-size:32px;line-height:1.1;font-weight:800;color:#0a0f29;font-family:Arial,sans-serif;">${escapeHtml(guardianName)}, your family is invited to pre-register</h1>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#0a0f29;font-family:Arial,sans-serif;">Choose your shopping time before registration opens to everyone else.</p>
        <p style="margin:0;"><a href="${escapeHtml(inviteLink)}" style="display:inline-block;background:#0a0f29;color:#fccf03;font-size:15px;font-weight:700;text-decoration:none;padding:15px 32px;border-radius:10px;font-family:Arial,sans-serif;">Pre-register my family</a></p>
      </td></tr>

      <tr><td style="padding:36px 36px 6px;">
        <p style="margin:0;font-size:16px;line-height:1.65;color:#080c21;font-family:Arial,sans-serif;">${escapeHtml(customMessage)}</p>
      </td></tr>

      <tr><td style="padding:14px 30px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          ${card('When', eventDate)}
          ${card('Where', eventLocation)}
        </tr></table>
      </td></tr>

      <tr><td style="padding:12px 30px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          ${card('Covers', `Up to ${childrenAllowed} children`)}
          ${card('Pre-registration closes', expiresOn)}
        </tr></table>
      </td></tr>

      <tr><td style="padding:6px 30px 6px;">
        <div style="background:#fffbeb;border-radius:10px;padding:20px;">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#0a0f29;font-family:Arial,sans-serif;">This link works once</p>
          <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#080c21;font-family:Arial,sans-serif;">Your link can be used one time only, so please complete it in one sitting. That is how we make sure these places go to the families we work with, and not to anyone the link is passed on to.</p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#626784;font-family:Arial,sans-serif;">It only opens for the email address or phone number we sent it to. Pre-registration closes on ${escapeHtml(expiresOn)}. After that date the link stops working and registration opens to everyone else.</p>
        </div>
      </td></tr>

      <tr><td style="padding:12px 30px 6px;">
        <div style="background:#fffbeb;border-radius:10px;padding:20px;">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#0a0f29;font-family:Arial,sans-serif;">On the day</p>
          <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#080c21;font-family:Arial,sans-serif;">Come to the Kids Gift Shop registration desk and sign in every child who is participating.</p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#626784;font-family:Arial,sans-serif;">Please arrive within the time slot you book. If your family is not signed in during that slot, we may not be able to fit you in.</p>
        </div>
      </td></tr>

      <tr><td style="padding:24px 36px 0;">
        <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#080c21;font-family:Arial,sans-serif;">Questions, or trouble with the link?</p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#626784;font-family:Arial,sans-serif;">Email us at <a href="mailto:${contact}" style="color:#0a0f29;">${contact}</a> and we will help you get your family registered. If your link has already been used or has closed, we can reopen it for you.</p>
      </td></tr>

      <tr><td style="padding:0 36px 22px;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:#626784;font-family:Arial,sans-serif;">Please do not reply to this email. The inbox is not monitored. If you have any questions or need assistance, email <a href="mailto:${contact}" style="color:#0a0f29;">${contact}</a>.</p>
      </td></tr>

      <tr><td style="background:#fccf03;padding:24px 36px 26px;text-align:center;">
        <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#0a0f29;font-family:Arial,sans-serif;">Candora Society</p>
        <p style="margin:0;font-size:12px;color:#0a0f29;font-family:Arial,sans-serif;">Winter Wonderland · Kids Gift Shop</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}