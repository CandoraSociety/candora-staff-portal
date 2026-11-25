import { secrets } from 'base44:runtime';

// The Candora number texts are sent from — the same Twilio number the gift shop
// desk texts families from, so every reply lands in one place.
export const GIFT_SHOP_SMS_FROM = '+15877142554';

// Accepts what families and staff type — (587) 714-2554, 587-714-2554,
// 5877142554 — and returns the international form Twilio requires, or null.
export function normalizeSmsPhone(raw) {
  const digits = String(raw || '').replace(/[^\d+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+')) return /^\+\d{8,15}$/.test(digits) ? digits : null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

// Every text the Kids Gift Shop sends opens with the guardian's name.
export function greetText(name, body) {
  const message = String(body || '').trim();
  if (!message) return message;
  if (/^hi\b/i.test(message)) return message;
  const first = String(name || '').trim().split(/\s+/)[0];
  return `Hi ${first || 'there'},\n\n${message}`;
}

// Sends one text. It never throws: a text that could not go out is reported
// back, so the caller can carry on with the email and still tell staff what
// happened to the family.
export async function sendGiftShopText(rawPhone, body, mediaUrl = '') {
  const to = normalizeSmsPhone(rawPhone);
  if (!to) return { ok: false, reason: 'no_phone' };

  const message = String(body || '').trim();
  if (!message) return { ok: false, reason: 'empty' };

  try {
    const accountSid = secrets.get('TWILIO_ACCOUNT_SID');
    const authToken = secrets.get('TWILIO_AUTH_TOKEN');

    const form = new URLSearchParams({ To: to, From: GIFT_SHOP_SMS_FROM, Body: message });
    // A picture rides with the message when one is given, so the card itself
    // arrives in the text instead of a link to it.
    const media = String(mediaUrl || '').trim();
    if (media) form.append('MediaUrl', media);
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
        signal: AbortSignal.timeout(15000),
      },
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.log('Gift shop text failed:', res.status, data?.code, data?.message);
      return { ok: false, reason: data?.message || `Twilio rejected the message (${res.status})` };
    }
    return { ok: true, sid: data.sid };
  } catch (error) {
    console.log('Gift shop text error:', error.message);
    return { ok: false, reason: error.message };
  }
}