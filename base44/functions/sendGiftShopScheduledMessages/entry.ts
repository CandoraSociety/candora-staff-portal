import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { messageFamily } from '../../shared/giftShopFamilyMessage.ts';
import { GIFT_SHOP_PROGRAM_NAME } from '../../shared/giftShopInvites.ts';

// A reminder can carry each family's six-digit check-in code. The codes live on
// the family's registrations, so they are read once per run and matched to the
// family by phone number, then by email address.
async function loadCodeLookup(base44) {
  const rows = await base44.asServiceRole.entities.ProgramRegistration.filter({ program_name: GIFT_SHOP_PROGRAM_NAME });
  const byPhone = new Map();
  const byEmail = new Map();
  (rows || []).forEach((row: any) => {
    const code = row.checkin_code;
    if (!code) return;
    const phone = String(row.parent_guardian_phone || row.participant_phone || '').replace(/\D/g, '').slice(-10);
    if (phone.length === 10) byPhone.set(phone, code);
    const email = String(row.parent_guardian_email || row.participant_email || '').trim().toLowerCase();
    if (email) byEmail.set(email, code);
  });

  return (family: any) => {
    const phone = String(family.guardian_phone || '').replace(/\D/g, '').slice(-10);
    if (phone.length === 10 && byPhone.has(phone)) return byPhone.get(phone);
    const email = String(family.guardian_email || '').trim().toLowerCase();
    return byEmail.get(email) || '';
  };
}

// Sends the Kids Gift Shop messages the desk scheduled, once each one's time has
// come. The scheduled workflow calls it every few minutes. It takes no input and
// only ever touches messages staff already wrote and queued, so it cannot be used
// to send anything new.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const now = Date.now();

    const pending = await base44.asServiceRole.entities.GiftShopScheduledMessage.filter(
      { status: 'pending' },
      { sort: 'send_at', limit: 25 },
    );

    const due = (pending.items || []).filter((item: any) => new Date(item.send_at || 0).getTime() <= now);
    const results: any[] = [];
    let codeForFamily: any = null;

    for (const item of due) {
      // Claim it first, so a second run never sends the same message twice.
      await base44.asServiceRole.entities.GiftShopScheduledMessage.update(item.id, { status: 'sending' });

      const families = (item.recipients || []).filter((row: any) => row?.family_key);
      const attachment = item.attachment_url
        ? { name: item.attachment_name || 'attachment', file_uri: item.attachment_url }
        : null;

      if (item.include_checkin_code && !codeForFamily) codeForFamily = await loadCodeLookup(base44);

      const rows: any[] = [];
      // Small batches keep the worker's outbound connections in hand.
      for (let index = 0; index < families.length; index += 3) {
        const batch = families.slice(index, index + 3);
        const settled = await Promise.allSettled(
          batch.map((family: any) => {
            const code = item.include_checkin_code
              ? (family.checkin_code || (codeForFamily ? codeForFamily(family) : ''))
              : '';
            return messageFamily(base44, family, {
              subject: item.subject,
              body: code ? `${item.body}\n\nYour check-in code: ${code}` : item.body,
              attachment,
              sentByName: item.sent_by_name || 'Scheduled message',
            });
          }),
        );
        settled.forEach((outcome, position) => {
          rows.push(outcome.status === 'fulfilled'
            ? outcome.value
            : { family_key: batch[position].family_key, status: 'failed' });
        });
      }

      const sent = rows.filter((row) => row.status === 'sent').length;
      const partial = rows.filter((row) => row.status === 'partial').length;
      const failed = rows.filter((row) => row.status === 'failed').length;
      const summary = `${sent} sent · ${partial} reached one channel · ${failed} failed`;

      await base44.asServiceRole.entities.GiftShopScheduledMessage.update(item.id, {
        status: sent || partial ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
        result_summary: summary,
      });

      results.push({ id: item.id, subject: item.subject, summary });
      console.log(`Gift shop scheduled message sent — ${item.subject}: ${summary}`);
    }

    return Response.json({ due: due.length, results });
  } catch (error) {
    console.log('sendGiftShopScheduledMessages failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}