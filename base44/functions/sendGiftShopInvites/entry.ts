import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { syncParticipantToCentralDb } from '../../shared/centralDbSync.ts';

// Creates one private pre-registration invitation per family in an uploaded
// list and emails each family their own single-use link. Staff must be signed
// in; the public can never trigger a send.
const FALLBACK_APP_URL = 'https://candora-360.base44.app';
const CONTACT_EMAIL = 'info@candorasociety.com';

const DEFAULT_MESSAGE =
  'Our Kids Gift Shop is back for Winter Wonderland, and as one of the families we work with, yours is invited to choose a shopping time before registration opens to everyone else. Pick a time that works for you, tell us who each child is shopping for, and we will have their name tag waiting at the door.';

const newToken = () => crypto.randomUUID().replace(/[^a-zA-Z0-9]/g, '');

// The list carries one guardian name per family — split it for the Central
// Database, which keeps a first and last name separately.
function splitName(full: string) {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first_name: parts[0] || '', last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

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
    const inviteIds = Array.isArray(body.invite_ids) ? body.invite_ids.filter(Boolean) : [];
    if (!families.length && !inviteIds.length) {
      return Response.json({ error: 'No families or invitations were supplied.' }, { status: 400 });
    }

    const appUrl = (req.headers.get('X-Base44-App-Url') || FALLBACK_APP_URL).replace(/\/+$/, '');
    const expiresOn = body.expires_on ? String(body.expires_on) : null;
    const expiresAt = expiresOn ? new Date(`${expiresOn}T23:59:59`).toISOString() : null;
    const message = String(body.message || '').trim() || DEFAULT_MESSAGE;

    const results = [];
    const seen = new Set();

    // Two ways in: a fresh list, where each family gets a new link, or
    // invitations already in the list, where the existing link is reused and
    // only the email goes out.
    const queue: any[] = [];
    if (inviteIds.length) {
      const found = await Promise.all(
        inviteIds.map((id: string) => base44.asServiceRole.entities.GiftShopInvite.get(id).catch(() => null)),
      );
      for (const invite of found) {
        if (!invite) continue;
        const closed = invite.status !== 'invited'
          || (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now());
        if (closed) {
          results.push({
            guardian_name: invite.guardian_name,
            guardian_email: invite.guardian_email || '',
            status: 'skipped',
            message: 'This invitation is no longer open.',
          });
          continue;
        }
        const allowed = Number(invite.children_allowed);
        queue.push({
          existing: invite,
          name: String(invite.guardian_name || '').trim(),
          email: String(invite.guardian_email || '').trim(),
          phone: String(invite.guardian_phone || '').trim(),
          childrenAllowed: allowed > 0 ? Math.min(6, allowed) : 3,
          token: invite.token,
        });
      }
    } else {
      for (const family of families) {
        const requested = Number(family?.children_allowed);
        queue.push({
          existing: null,
          name: String(family?.guardian_name || '').trim(),
          email: String(family?.guardian_email || '').trim(),
          phone: String(family?.guardian_phone || '').trim(),
          childrenAllowed: requested > 0 ? Math.min(6, requested) : 3,
          token: null,
        });
      }
    }

    for (const entry of queue) {
      const { existing, name, email, phone, childrenAllowed } = entry;

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

      const token = existing?.token || newToken();
      const link = `${appUrl}/functions/giftShopInviteForm?token=${token}`;

      let invite: any = existing || null;
      if (!existing) {
        try {
          invite = await base44.asServiceRole.entities.GiftShopInvite.create({
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
      }

      // A family from a fresh list is linked to their Central Database profile,
      // or has one opened for them. Invitations already in the list were linked
      // when they were created, so they are left as they are.
      let central: any = null;
      if (!existing) {
        const person = splitName(name);
        try {
          central = await syncParticipantToCentralDb(base44, {
            program: 'kids_gift_shop',
            linkedId: invite.id,
            indicator: 'Invited to the Kids Gift Shop pre-registration (Winter Wonderland).',
            personal: {
              first_name: person.first_name,
              last_name: person.last_name,
              email: email || null,
              phone: phone || null,
            },
          });
          if (central?.rc_client_id) {
            await base44.asServiceRole.entities.GiftShopInvite.update(invite.id, {
              rc_client_id: central.rc_client_id,
              central_db_status: central.status,
            });
          }
        } catch (error) {
          console.log(`Central Database link failed for ${name}:`, error.message);
        }
      }

      if (!email) {
        results.push({
          guardian_name: name,
          guardian_email: '',
          guardian_phone: phone,
          status: 'no_email',
          link,
          central_db_status: central?.status || null,
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
            expires_on: formatDate(existing?.expires_at ? existing.expires_at.slice(0, 10) : expiresOn),
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
            central_db_status: central?.status || null,
            message: sent.message || `The email could not be sent (${sent.reason || 'refused'}). Copy the link and send it yourself.`,
          });
        } else {
          if (existing) {
            await base44.asServiceRole.entities.GiftShopInvite.update(existing.id, { sent_via: 'email' });
          }
          results.push({ guardian_name: name, guardian_email: email, status: 'sent', link, central_db_status: central?.status || null });
        }
      } catch (error) {
        console.log(`Invitation email failed for ${email}:`, error.message);
        results.push({
          guardian_name: name,
          guardian_email: email,
          status: 'failed',
          link,
          central_db_status: central?.status || null,
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