import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { messageFamily, loadCheckinCodeLookup } from '../../shared/giftShopFamilyMessage.ts';

// Sends one staff-written message to Kids Gift Shop families — by email and by
// text, whichever contact details each family has on file — and keeps a record
// of it so the desk can see the family's message history. Staff must be signed
// in; the public can never trigger a send.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const incoming = Array.isArray(payload.families) ? payload.families : [];
    const subject = String(payload.subject || '').trim();
    const body = String(payload.body || '').trim();
    const attachment = payload.attachment?.file_uri
      ? { name: String(payload.attachment.name || 'attachment'), file_uri: String(payload.attachment.file_uri) }
      : null;

    if (!incoming.length) return Response.json({ error: 'Choose at least one family.' }, { status: 400 });
    if (!subject) return Response.json({ error: 'Add a heading for the message.' }, { status: 400 });
    if (!body) return Response.json({ error: 'Enter the message text.' }, { status: 400 });

    const sentByName = user.full_name || user.email || '';

    const families = incoming
      .map((family: any) => ({
        family_key: String(family?.family_key || '').trim(),
        guardian_name: String(family?.guardian_name || '').trim(),
        guardian_email: String(family?.guardian_email || '').trim(),
        guardian_phone: String(family?.guardian_phone || '').trim(),
      }))
      .filter((family: any) => family.family_key);

    if (!families.length) return Response.json({ error: 'Those families could not be identified.' }, { status: 400 });

    const results: any[] = [];
    // Every message carries the family's check-in code until they arrive.
    const codeForFamily = await loadCheckinCodeLookup(base44);
    // Small batches keep the worker's outbound connections in hand while a
    // whole status group is being messaged.
    for (let index = 0; index < families.length; index += 3) {
      const batch = families.slice(index, index + 3);
      const settled = await Promise.allSettled(
        batch.map((family: any) => messageFamily(base44, family, {
          subject,
          body,
          checkinCode: family.checkin_code || codeForFamily(family),
          attachment,
          sentByName,
        })),
      );
      settled.forEach((outcome, position) => {
        if (outcome.status === 'fulfilled') {
          results.push(outcome.value);
        } else {
          const family: any = batch[position];
          results.push({
            family_key: family.family_key,
            guardian_name: family.guardian_name,
            status: 'failed',
            emailed: false,
            texted: false,
            message: outcome.reason?.message || 'The message could not be sent.',
          });
        }
      });
    }

    const sent = results.filter((row) => row.status === 'sent').length;
    const partial = results.filter((row) => row.status === 'partial').length;
    const failed = results.filter((row) => row.status === 'failed').length;
    console.log(`Gift shop messages: ${sent} sent, ${partial} partial, ${failed} failed`);

    return Response.json({ results, sent_count: sent, partial_count: partial, failed_count: failed });
  } catch (error) {
    console.log('sendGiftShopFamilyMessages failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}