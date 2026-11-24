// One staff-written Kids Gift Shop message to one family — by email and by text,
// whichever contact details the family has on file — and the record of it that
// keeps the family's message history. Shared by the immediate send and the
// scheduled send, so both behave the same way and both leave the same trail.
import { sendGiftShopText } from './giftShopSms.ts';

const BRAND_LOGO = 'https://media.base44.com/images/public/6a249282cb496579542673b7/c7fbd36e2_logo.png';
const CONTACT_EMAIL = 'info@candorasociety.com';

const escapeHtml = (value) => String(value || '').replace(/[&<>"]/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}[char]));

const firstNameOf = (name) => String(name || '').trim().split(/\s+/)[0] || 'there';

export function emailHtml({ guardianName, subject, body, attachmentName }) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f9fafb;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:24px 12px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #dadce7;border-radius:10px;overflow:hidden;font-family:Inter,Arial,sans-serif;">
      <tr><td style="background:#fccf03;padding:14px 28px;">
        <img src="${BRAND_LOGO}" alt="Candora 360" style="height:36px;display:block;border:0;" />
      </td></tr>
      <tr><td style="padding:26px 28px 8px;">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:#626784;font-family:Arial,sans-serif;">Kids Gift Shop</p>
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#0a0f29;font-family:Nunito,Arial,sans-serif;">${escapeHtml(subject)}</h1>
        <p style="margin:0 0 14px;font-size:15px;color:#080c21;">Hi ${escapeHtml(firstNameOf(guardianName))},</p>
        <div style="font-size:15px;line-height:1.6;color:#080c21;white-space:pre-wrap;">${escapeHtml(body)}</div>
        ${attachmentName ? `<p style="margin:18px 0 0;font-size:14px;color:#626784;">Attached: ${escapeHtml(attachmentName)}</p>` : ''}
      </td></tr>
      <tr><td style="padding:16px 28px 22px;border-top:1px solid #dadce7;margin-top:20px;">
        <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#626784;font-family:Arial,sans-serif;">
          Candora 360 · Kids Gift Shop · ${CONTACT_EMAIL}
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// One family, both channels. A family with only a phone number is reached by
// text alone; a family with only an email is reached by email alone. The family
// is { family_key, guardian_name, guardian_email, guardian_phone }.
export async function messageFamily(base44, family, { subject, body, attachment, sentByName }) {
  const familyKey = String(family.family_key || '').trim();
  const name = String(family.guardian_name || '').trim();
  const email = String(family.guardian_email || '').trim();
  const phone = String(family.guardian_phone || '').trim();

  let emailed = false;
  let texted = false;
  let failure = null;

  if (email) {
    try {
      const sent = await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject,
        html: emailHtml({ guardianName: name, subject, body, attachmentName: attachment?.name }),
        category: 'transactional',
        from_name: 'Candora 360',
        ...(attachment?.file_uri
          ? { attachments: [{ filename: attachment.name || 'attachment', file_url: attachment.file_uri }] }
          : {}),
      });
      if (sent && sent.success === false) {
        failure = sent.message || `The email could not be sent (${sent.reason || 'refused'}).`;
      } else {
        emailed = true;
      }
    } catch (error) {
      console.log(`Gift shop message email failed for ${email}:`, error.message);
      failure = error.message;
    }
  }

  if (phone) {
    const text = await sendGiftShopText(phone, `${subject}\n\n${body}`);
    if (text.ok) texted = true;
    else if (!emailed) failure = text.reason || 'The text could not be sent.';
  }

  const status = emailed && texted ? 'sent' : emailed || texted ? 'partial' : 'failed';

  try {
    await base44.asServiceRole.entities.GiftShopMessage.create({
      family_key: familyKey,
      guardian_name: name,
      subject,
      body,
      attachment_name: attachment?.name || null,
      attachment_url: attachment?.file_uri || null,
      emailed,
      texted,
      status,
      failure_reason: failure || null,
      sent_at: new Date().toISOString(),
      sent_by_name: sentByName,
    });
  } catch (error) {
    console.log(`Gift shop message record failed for ${name}:`, error.message);
  }

  return {
    family_key: familyKey,
    guardian_name: name,
    guardian_email: email,
    guardian_phone: phone,
    emailed,
    texted,
    status,
    message: failure,
  };
}