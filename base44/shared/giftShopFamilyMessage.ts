// One staff-written Kids Gift Shop message to one family — by email and by text,
// whichever contact details the family has on file — and the record of it that
// keeps the family's message history. Shared by the immediate send and the
// scheduled send, so both behave the same way and both leave the same trail.
import { greetText, sendGiftShopText } from './giftShopSms.ts';
import { GIFT_SHOP_PROGRAM_NAME, slotLabel } from './giftShopInvites.ts';
import { GIFT_SHOP_EVENT_DATE, giftSummary } from './giftShopCheckin.ts';
import { loadGiftShopEvent } from './giftShopEvent.ts';
import { sendFamilyEmail } from './giftShopMail.ts';

const phoneOf = (value) => String(value || '').replace(/\D/g, '').slice(-10);
const nameOf = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const emailOf = (value) => String(value || '').trim().toLowerCase();

// The family's own registrations, matched as closely as possible: their name on
// the number, then their name on the email address, and only then the number or
// address on its own. Read once and reused, so a whole send is one lookup.
export async function loadFamilyRowsLookup(base44) {
  const rows = await base44.asServiceRole.entities.ProgramRegistration.filter({ program_name: GIFT_SHOP_PROGRAM_NAME });
  const byPhoneName = new Map();
  const byEmailName = new Map();
  const byPhone = new Map();
  const byEmail = new Map();

  const remember = (map, key, row) => {
    if (!key) return;
    const bucket = map.get(key) || [];
    bucket.push(row);
    map.set(key, bucket);
  };

  (rows || []).forEach((row) => {
    const phone = phoneOf(row.parent_guardian_phone || row.participant_phone);
    const name = nameOf(row.parent_guardian_name || row.participant_name);
    const email = emailOf(row.parent_guardian_email || row.participant_email);
    if (phone.length === 10) {
      remember(byPhone, phone, row);
      if (name) remember(byPhoneName, `${phone}|${name}`, row);
    }
    if (email) {
      remember(byEmail, email, row);
      if (name) remember(byEmailName, `${email}|${name}`, row);
    }
  });

  return (family) => {
    const phone = phoneOf(family.guardian_phone);
    const name = nameOf(family.guardian_name);
    const email = emailOf(family.guardian_email);
    return (phone.length === 10 && name && byPhoneName.get(`${phone}|${name}`))
      || (email && name && byEmailName.get(`${email}|${name}`))
      || (phone.length === 10 && byPhone.get(phone))
      || (email && byEmail.get(email))
      || [];
  };
}

// Every family's six-digit check-in code travels with each message until the
// family has arrived and been checked in.
export async function loadCheckinCodeLookup(base44) {
  const rowsFor = await loadFamilyRowsLookup(base44);

  return (family) => {
    const rows = rowsFor(family);
    const codes = new Set(rows.map((row) => row.checkin_code).filter(Boolean));
    // Once the family is checked in the code has done its job.
    const pending = rows.some((row) => row.checked_in !== true);
    // Only a family with one single code is used — anything shared between
    // families stays silent rather than sending the wrong code.
    return pending && codes.size === 1 ? [...codes][0] : '';
  };
}

// What a family registered for — the date, their shopping time and each child
// with who their gifts are for — so a reminder can carry their own details.
// Stays empty once the family has arrived, and whenever a contact detail is
// shared by more than one family, so nobody is sent another family's children.
export async function loadFamilyDetailsLookup(base44) {
  const rowsFor = await loadFamilyRowsLookup(base44);
  // The event's own date, so a message sent after next year's setup carries the
  // new day rather than the one the shop used to run on.
  const event = await loadGiftShopEvent(base44);

  return (family) => {
    const rows = rowsFor(family);
    if (!rows.length) return null;
    if (new Set(rows.map((row) => nameOf(row.parent_guardian_name || row.participant_name))).size > 1) return null;
    if (!rows.some((row) => row.checked_in !== true)) return null;
    return {
      event_date: event.event_date,
      time_label: slotLabel(rows[0].time_slot),
      children: rows.map((row) => ({
        name: row.child_name || row.participant_name || 'Child',
        gifts: giftSummary(row),
      })),
    };
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

// The family's own registration, one labelled item per line — the date, their
// shopping time, and each registered child with who their gifts are for.
const detailLines = (details) => {
  const children = details.children.map(
    (child) => `${child.name}${child.gifts ? ` — ${child.gifts}` : ''}`,
  );
  return [
    ['Date', details.event_date || GIFT_SHOP_EVENT_DATE],
    ['Time', details.time_label],
    ['Registered Children', children.join('; ')],
  ].filter(([, value]) => value);
};

const detailsHtml = (details) => `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
          <tr><td style="background:#f9fafb;border:1px solid #dadce7;border-radius:10px;padding:14px 16px;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:#626784;font-family:Arial,sans-serif;">Your registration</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${detailLines(details).map(([label, value]) => `<tr>
                <td valign="top" style="padding:3px 10px 3px 0;font-size:15px;line-height:1.5;color:#626784;font-family:Inter,Arial,sans-serif;white-space:nowrap;">${escapeHtml(label)}:</td>
                <td valign="top" style="padding:3px 0;font-size:15px;line-height:1.5;color:#080c21;font-family:Inter,Arial,sans-serif;"><strong>${escapeHtml(value)}</strong></td>
              </tr>`).join('')}
            </table>
          </td></tr>
        </table>`;

// The same details for the text message — one item per line.
const detailsText = (details) => [
  'Your registration:',
  ...detailLines(details).map(([label, value]) => `${label}: ${value}`),
].join('\n');

export function emailHtml({ guardianName, subject, body, attachmentName, checkinCode, details }) {
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
        ${details ? detailsHtml(details) : ''}
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
export async function messageFamily(base44, family, { subject, body, attachment, sentByName, checkinCode, familyDetails }) {
  const code = String(checkinCode || '').trim();
  const details = familyDetails && (familyDetails.children || []).length ? familyDetails : null;
  const familyKey = String(family.family_key || '').trim();
  const name = String(family.guardian_name || '').trim();
  const email = String(family.guardian_email || '').trim();
  const phone = String(family.guardian_phone || '').trim();

  let emailed = false;
  let texted = false;
  let failure = null;

  if (email) {
    const html = emailHtml({ guardianName: name, subject, body, attachmentName: attachment?.name, checkinCode: code, details });
    const sent = await sendFamilyEmail(base44, {
      to: email,
      subject,
      html,
      fromName: FROM_NAME,
      attachment,
    });
    if (sent.ok) emailed = true;
    else failure = sent.reason;
  }

  if (phone) {
    const parts = [subject, body];
    if (details) parts.push(detailsText(details));
    if (code) parts.push(`${CODE_REMINDER} ${code}`);
    const text = await sendGiftShopText(phone, greetText(name, parts.join('\n\n')));
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