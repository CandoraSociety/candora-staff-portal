// One staff-written Kids Gift Shop message to one family — by email and by text,
// whichever contact details the family has on file — and the record of it that
// keeps the family's message history. Shared by the immediate send and the
// scheduled send, so both behave the same way and both leave the same trail.
import { sendGiftShopText } from './giftShopSms.ts';
import { GIFT_SHOP_PROGRAM_NAME } from './giftShopInvites.ts';

// Every family's six-digit check-in code travels with each message until the
// family has arrived and been checked in. The codes live on the family's
// registrations, so they are read once and matched to the family by phone
// number, then by email address.
export async function loadCheckinCodeLookup(base44) {
  const rows = await base44.asServiceRole.entities.ProgramRegistration.filter({ program_name: GIFT_SHOP_PROGRAM_NAME });
  const byPhone = new Map();
  const byEmail = new Map();

  // A family may hold several registrations under one contact. One code is
  // enough, and the reminder keeps going out while any child is still expected.
  const remember = (map, key, row) => {
    if (!key) return;
    const existing = map.get(key) || { code: '', pending: false };
    if (!existing.code && row.checkin_code) existing.code = row.checkin_code;
    if (row.checked_in !== true) existing.pending = true;
    map.set(key, existing);
  };

  (rows || []).forEach((row) => {
    if (!row.checkin_code) return;
    const phone = String(row.parent_guardian_phone || row.participant_phone || '').replace(/\D/g, '').slice(-10);
    if (phone.length === 10) remember(byPhone, phone, row);
    const email = String(row.parent_guardian_email || row.participant_email || '').trim().toLowerCase();
    if (email) remember(byEmail, email, row);
  });

  return (family) => {
    const phone = String(family.guardian_phone || '').replace(/\D/g, '').slice(-10);
    const entry = (phone.length === 10 && byPhone.get(phone))
      || byEmail.get(String(family.guardian_email || '').trim().toLowerCase());
    // Once the family is checked in the code has done its job.
    return entry && entry.pending ? entry.code : '';
  };
}

const CODE_REMINDER = 'Reminder - Your Check-In code when you arrive at Kids Gift Shop is';

const BRAND_LOGO = 'https://base44.app/api/apps/6a249282cb496579542673b7/files/mp/public/6a249282cb496579542673b7/6d7d8de5b7cf5f4838f9d1df98d171cc_kids-gift-shop-logo.png';
const FROM_NAME = 'CANDORA - Kids Gift Shop';
const CONTACT_EMAIL = 'info@candorasociety.com';

const escapeHtml = (value) => String(value || '').replace(/[&<>"]/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}[char]));

const firstNameOf = (name) => String(name || '').trim().split(/\s+/)[0] || 'there';

// The check-in reminder sits in its own highlighted block under the message, so
// it never reads as another paragraph of the message itself.
const codeReminderHtml = (code) => `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
          <tr><td style="background:#fffaeb;border:1px solid #fccf03;border-radius:10px;padding:14px 16px;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:#626784;font-family:Arial,sans-serif;">Reminder</p>
            <p style="margin:0;font-size:15px;line-height:1.5;color:#080c21;font-family:Inter,Arial,sans-serif;">
              Your Check-In code when you arrive at Kids Gift Shop is
              <strong style="font-size:20px;letter-spacing:.08em;color:#0a0f29;">${escapeHtml(code)}</strong>
            </p>
          </td></tr>
        </table>`;

export function emailHtml({ guardianName, subject, body, attachmentName, checkinCode }) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f9fafb;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:24px 12px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #dadce7;border-radius:10px;overflow:hidden;font-family:Inter,Arial,sans-serif;">
      <tr><td style="background:#fccf03;padding:14px 28px;">
        <img src="${BRAND_LOGO}" alt="CANDORA - Kids Gift Shop" style="height:44px;display:block;border:0;border-radius:6px;" />
      </td></tr>
      <tr><td style="padding:26px 28px 8px;">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:#626784;font-family:Arial,sans-serif;">Kids Gift Shop</p>
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#0a0f29;font-family:Nunito,Arial,sans-serif;">${escapeHtml(subject)}</h1>
        <p style="margin:0 0 14px;font-size:15px;color:#080c21;">Hi ${escapeHtml(firstNameOf(guardianName))},</p>
        <div style="font-size:15px;line-height:1.6;color:#080c21;white-space:pre-wrap;">${escapeHtml(body)}</div>
        ${checkinCode ? codeReminderHtml(checkinCode) : ''}
        ${attachmentName ? `<p style="margin:18px 0 0;font-size:14px;color:#626784;">Attached: ${escapeHtml(attachmentName)}</p>` : ''}
      </td></tr>
      <tr><td style="padding:16px 28px 22px;border-top:1px solid #dadce7;margin-top:20px;">
        <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#626784;font-family:Arial,sans-serif;">
          Please do not reply to this email. The inbox is not monitored. If you have any questions or need assistance, email ${CONTACT_EMAIL}.
        </p>
        <p style="margin:8px 0 0;font-size:12px;line-height:1.6;color:#626784;font-family:Arial,sans-serif;">
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
export async function messageFamily(base44, family, { subject, body, attachment, sentByName, checkinCode }) {
  const code = String(checkinCode || '').trim();
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
        html: emailHtml({ guardianName: name, subject, body, attachmentName: attachment?.name, checkinCode: code }),
        category: 'transactional',
        from_name: FROM_NAME,
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
    const text = await sendGiftShopText(
      phone,
      code ? `${subject}\n\n${body}\n\n${CODE_REMINDER} ${code}` : `${subject}\n\n${body}`,
    );
    if (text.ok) texted = true;
    // Keep the reason even when the email worked, so staff can see why a family
    // was only reached on one channel.
    else failure = failure || text.reason || 'The text could not be sent.';
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