import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

// The Candora number that texts are sent from. It is a Twilio number on the
// organization's own account, so replies land in the same place as calls.
const DEFAULT_FROM = '+15877142554';

// Accepts what staff actually type — (587) 714-2554, 587-714-2554, 5877142554 —
// and returns the international form Twilio requires, or null if it is unusable.
function normalizePhone(raw) {
  const digits = String(raw || '').replace(/[^\d+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+')) return /^\+\d{8,15}$/.test(digits) ? digits : null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, body, mediaUrl } = await req.json().catch(() => ({}));
    const phone = normalizePhone(to);
    if (!phone) {
      return Response.json({ error: 'A phone number is required, including the area code.' }, { status: 400 });
    }
    const message = String(body || '').trim();
    if (!message) {
      return Response.json({ error: 'The text message cannot be empty.' }, { status: 400 });
    }

    const accountSid = secrets.get('TWILIO_ACCOUNT_SID');
    const authToken = secrets.get('TWILIO_AUTH_TOKEN');
    const from = DEFAULT_FROM;

    // An optional attachment — the CANDORA contact card rides along with the
    // first text a family receives, so they can save the number as CANDORA.
    const media = String(mediaUrl || '').trim();
    if (media && !/^https:\/\/\S+$/i.test(media)) {
      return Response.json({ error: 'The attachment link must be a public https address.' }, { status: 400 });
    }

    const form = new URLSearchParams({ To: phone, From: from, Body: message });
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
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const reason = data?.message || `Twilio rejected the message (${res.status})`;
      console.error('sendSms failed', { status: res.status, code: data?.code, reason, to: phone });
      return Response.json({ error: reason, code: data?.code || null }, { status: 502 });
    }

    return Response.json({
      ok: true,
      sid: data.sid,
      to: data.to,
      from: data.from,
      status: data.status,
      sent_by: user.email,
    });
  } catch (error) {
    console.error('sendSms error', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}