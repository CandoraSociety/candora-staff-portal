import { secrets } from "base44:runtime";

// Test greeting spoken to callers while the global Candora phone system is being built.
const TEST_MESSAGE = "Thank you for calling Candora Society. This is a test of our new telephone system.";

function buildTwiML() {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    "<Response><Say voice=\"Polly.Joanna\">" + TEST_MESSAGE + "</Say></Response>"
  );
}

// Validates Twilio's X-Twilio-Signature: base64(HMAC-SHA1(authToken, url + sorted key/value pairs)).
async function isValidTwilioSignature(url, params, signature, authToken) {
  if (!signature || !authToken) return false;
  const data = url + Object.keys(params).sort().map((key) => key + params[key]).join("");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(authToken), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  let binary = "";
  for (const byte of new Uint8Array(mac)) binary += String.fromCharCode(byte);
  return btoa(binary) === signature;
}

export default async function(req) {
  try {
    const authToken = secrets.get("TWILIO_AUTH_TOKEN");
    const body = await req.text();
    const params = {};
    new URLSearchParams(body).forEach((value, key) => { params[key] = value; });
    const signature = req.headers.get("x-twilio-signature") || "";

    const valid = await isValidTwilioSignature(req.url, params, signature, authToken);
    if (!valid) {
      return Response.json({ error: "Invalid Twilio signature" }, { status: 403 });
    }

    return new Response(buildTwiML(), {
      status: 200,
      headers: { "Content-Type": "application/xml" }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}