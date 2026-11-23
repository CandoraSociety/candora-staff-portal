import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

// Accepts what families actually have on file — (587) 714-2554, 587-714-2554,
// 5877142554 — and returns the form Twilio uses, so a reply always lands on the
// right family's card.
function normalizePhone(raw) {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

// Twilio signs the full URL plus every posted field, sorted by name, so a post
// that did not come from Twilio is rejected instead of appearing as a reply.
async function signatureMatches(url, params, authToken, header) {
  if (!header) return false;
  let payload = url;
  Object.keys(params).sort().forEach((key) => {
    payload += key + params[key];
  });
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expected = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return expected === header;
}

export default async function (req) {
  try {
    const authToken = secrets.get('TWILIO_AUTH_TOKEN');
    if (!authToken) {
      console.error('twilioSmsWebhook: TWILIO_AUTH_TOKEN is not set');
      return new Response('', { status: 500 });
    }

    const form = await req.formData();
    const params = {};
    for (const [key, value] of form.entries()) params[key] = String(value);

    const appUrl = req.headers.get('x-base44-app-url');
    if (!appUrl) {
      console.error('twilioSmsWebhook: missing X-Base44-App-Url header');
      return new Response('', { status: 400 });
    }
    const url = `${appUrl.replace(/\/$/, '')}/functions/twilioSmsWebhook`;

    const signed = await signatureMatches(
      url,
      params,
      authToken,
      req.headers.get('x-twilio-signature')
    );
    if (!signed) {
      console.error('twilioSmsWebhook: signature rejected');
      return new Response('', { status: 403 });
    }

    const phone = normalizePhone(params.From);
    const body = String(params.Body || '').trim();
    if (!phone || !body) {
      // Nothing usable — answer Twilio so it does not retry.
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.GiftShopText.create({
      phone,
      direction: 'in',
      body: body.slice(0, 1000),
      sent_at: new Date().toISOString(),
      twilio_sid: params.MessageSid || '',
    });

    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('twilioSmsWebhook error', error.message);
    return new Response('', { status: 500 });
  }
}