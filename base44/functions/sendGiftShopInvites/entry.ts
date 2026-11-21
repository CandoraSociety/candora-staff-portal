import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Creates one private pre-registration invitation per family in an uploaded
// list and emails each family their own single-use link. Staff must be signed
// in; the public can never trigger a send.
const FALLBACK_APP_URL = 'https://candora-360.base44.app';
const CONTACT_EMAIL = 'info@candorasociety.com';

const DEFAULT_MESSAGE =
  'Our Kids Gift Shop is back for Winter Wonderland, and as one of the families we work with, yours is invited to choose a shopping time before registration opens to everyone else. Pick a time that works for you, tell us who each child is shopping for, and we will have their name tag waiting at the door.';

const newToken = () => crypto.randomUUID().replace(/[^a-zA-Z0-9]/g, '');

function formatDate(value) {
  if (!value) return 'the date shown in this email';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const families = Array.isArray(body.families) ? body.families : [];
    if (!families.length) {
      return Response.json({ error: 'No families were in the list.' }, { status: 400 });
    }

    const appUrl = (req.headers.get('X-Base44-App-Url') || FALLBACK_APP_URL).replace(/\/+$/, '');
    const expiresOn = body.expires_on ? String(body.expires_on) : null;
    const expiresAt = expiresOn ? new Date(`${expiresOn}T23:59:59`).toISOString() : null;
    const message = String(body.message || '').trim() || DEFAULT_MESSAGE;

    const results = [];
    const seen = new Set();

    for (const family of families) {
      const name = String(family?.guardian_name || '').trim();
      const email = String(family?.guardian_email || '').trim();
      const phone = String(family?.guardian_phone || '').trim();
      const requested = Number(family?.children_allowed);
      const childrenAllowed = requested > 0 ? Math.min(6, requested) : 3;

      if (!name || (!email && !phone)) {
        results.push({
          guardian_name: name,
          guardian_email: email,
          status: 'skipped',
          message: 'Needs a guardian name and an email address or phone number.',
        });
        continue;
      }

      const emailKey = email.toLowerCase();
      if (emailKey && seen.has(emailKey)) {
        results.push({ guardian_name: name, guardian_email: email, status: 'skipped', message: 'The same email address appears twice in this list.' });
        continue;
      }
      if (emailKey) seen.add(emailKey);

      const token = newToken();
      const link = `${appUrl}/gift-shop-invite?token=${token}`;

      try {
        await base44.asServiceRole.entities.GiftShopInvite.create({
          token,
          guardian_name: name,
          guardian_email: email || null,
          guardian_phone: phone || null,
          children_allowed: childrenAllowed,
          status: 'invited',
          expires_at: expiresAt,
          sent_via: email ? 'email' : 'other',
          created_by_name: user.full_name || user.email || '',
        });
      } catch (error) {
        console.log(`Invitation record failed for ${name}:`, error.message);
        results.push({ guardian_name: name, guardian_email: email, status: 'failed', message: `Could not save the invitation: ${error.message}` });
        continue;
      }

      if (!email) {
        results.push({
          guardian_name: name,
          guardian_email: '',
          guardian_phone: phone,
          status: 'no_email',
          link,
          message: 'No email address on file. Send this link by text or print it for the family.',
        });
        continue;
      }

      try {
        const sent = await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          template_name: 'GiftShopPreRegistrationInvite',
          variables: {
            guardian_name: name,
            children_allowed: String(childrenAllowed),
            expires_on: formatDate(expiresOn),
            custom_message: message,
            invite_link: link,
            contact_email: CONTACT_EMAIL,
          },
          category: 'transactional',
          from_name: 'Candora 360',
        });

        if (sent && sent.success === false) {
          results.push({
            guardian_name: name,
            guardian_email: email,
            status: 'failed',
            link,
            message: sent.message || `The email could not be sent (${sent.reason || 'refused'}). Copy the link and send it yourself.`,
          });
        } else {
          results.push({ guardian_name: name, guardian_email: email, status: 'sent', link });
        }
      } catch (error) {
        console.log(`Invitation email failed for ${email}:`, error.message);
        results.push({
          guardian_name: name,
          guardian_email: email,
          status: 'failed',
          link,
          message: `${error.message} Copy the link and send it yourself.`,
        });
      }
    }

    const counts = results.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});

    console.log(`Gift shop invitations: ${counts.sent || 0} sent, ${counts.failed || 0} failed, ${counts.no_email || 0} without email`);

    return Response.json({
      results,
      sent_count: counts.sent || 0,
      failed_count: counts.failed || 0,
      no_email_count: counts.no_email || 0,
      skipped_count: counts.skipped || 0,
    });
  } catch (error) {
    console.log('sendGiftShopInvites failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});