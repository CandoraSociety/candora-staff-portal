import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { code, document_ref } = await req.json();
    if (!code || !document_ref) {
      return Response.json({ error: 'Verification code and document reference are required' }, { status: 400 });
    }

    const profiles = await base44.entities.ESignatureProfile.filter({ user_id: user.id });
    const profile = profiles[0];
    if (!profile || !profile.auth_hash) {
      return Response.json({ error: 'No e-signature set up yet. Set up your e-signature from the E-Signature tab first.' }, { status: 400 });
    }

    const hash = await sha256Hex(`${profile.auth_salt}:${code}`);
    if (hash !== profile.auth_hash) {
      return Response.json({ verified: false, error: 'Incorrect PIN/password' }, { status: 401 });
    }

    // Signer display name comes from the Employee file (first + last name),
    // not the login-account name which can be email-derived ("graham.currie")
    let properName = profile.user_name || user.full_name || '';
    try {
      const employees = await base44.entities.Employee.list(500);
      const emp = employees.find((e) => !e.is_deleted && (e.email || '').toLowerCase() === (user.email || '').toLowerCase());
      if (emp) properName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || properName;
      if (profile.user_name !== properName) {
        await base44.entities.ESignatureProfile.update(profile.id, { user_name: properName });
      }
    } catch {}

    const forwarded = req.headers.get('x-forwarded-for') || '';
    const ip = (forwarded.split(',')[0] || req.headers.get('cf-connecting-ip') || 'unknown').trim();

    // Candora is in Mountain Time (America/Edmonton) — stamp signatures in local MT, not UTC
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Edmonton',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZoneName: 'short',
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value || '';
    const timestampUtc = `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')} ${get('timeZoneName')}`;
    const generatedId = `TX-${Math.floor(10000 + Math.random() * 90000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

    const log = await base44.entities.ESignatureLog.create({
      document_ref,
      signed_by: properName,
      signed_by_email: profile.user_email || user.email || '',
      timestamp_utc: timestampUtc,
      ip_address: ip,
      verification_status: profile.auth_type === 'password' ? 'Password Verified' : 'PIN Verified',
      auth_type: profile.auth_type || 'pin',
      generated_id: generatedId,
    });

    return Response.json({ verified: true, log });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}