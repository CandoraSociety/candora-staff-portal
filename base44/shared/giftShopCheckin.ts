// Shared server-side logic for the Kids Gift Shop check-in code: the six-digit
// code every registering family receives by email, the confirmation email it
// travels in, and the lookup the check-in desk uses on the day. Kept in one
// place so the invitation form, the general form and the front desk all issue
// codes the same way.
import { slotLabel, GIFT_SHOP_PROGRAM_NAME } from './giftShopInvites.ts';

export const GIFT_SHOP_EVENT_DATE = 'Saturday, December 12th';
export const GIFT_SHOP_EVENT_LOCATION = 'Riverview Crossing Shopping Centre';
export const GIFT_SHOP_CONTACT_EMAIL = 'info@candorasociety.com';

const AGE_LABELS = { '0-5': 'Ages 0–5', '6-16': 'Ages 6–16' };

const RECIPIENT_LABELS = {
  mother: 'Mother',
  father: 'Father',
  grandmother: 'Grandmother',
  grandfather: 'Grandfather',
  aunt: 'Aunt',
  uncle: 'Uncle',
  caregiver: 'Caregiver',
  other: 'Other',
};

const isLive = (row) => !['declined', 'withdrawn'].includes(row.status);

// Six digits, never starting the family off with a leading zero problem: the
// code is stored and compared as a string throughout.
export function newCheckinCode() {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return String(buffer[0] % 1000000).padStart(6, '0');
}

export async function loadGiftShopRows(base44) {
  const rows = await base44.entities.ProgramRegistration.filter({ program_name: GIFT_SHOP_PROGRAM_NAME });
  return (rows || []).filter(row => row.program_name === GIFT_SHOP_PROGRAM_NAME);
}

// Every registration that shares a code is one family — a code opens the whole
// family's registration, so siblings are checked in together.
export async function familyRowsForCode(base44, code) {
  if (!code) return [];
  const rows = await loadGiftShopRows(base44);
  return rows.filter(row => row.checkin_code === code && isLive(row));
}

// One code for the whole family: a family that already has one keeps it, so a
// code sent by email is never replaced under them.
export async function stampFamilyCode(base44, rows) {
  const existing = rows.map(row => row.checkin_code).find(Boolean);
  if (existing && rows.every(row => row.checkin_code === existing)) return existing;

  const taken = new Set((await loadGiftShopRows(base44)).map(row => row.checkin_code).filter(Boolean));
  let code = newCheckinCode();
  while (taken.has(code)) code = newCheckinCode();

  const ids = rows.map(row => row.id).filter(Boolean);
  if (ids.length) {
    await base44.entities.ProgramRegistration.bulkUpdate(ids.map(id => ({ id, checkin_code: code })));
  }
  return code;
}

// "2 gifts (Mother, Father)" — the same wording the name tags use.
const giftSummary = (reg) => {
  const count = Number(reg.gift_count) === 2 ? 2 : 1;
  const describe = (gender, recipient) => {
    const who = RECIPIENT_LABELS[recipient] || '';
    const short = gender === 'female' ? 'F' : gender === 'male' ? 'M' : '';
    if (!who) return short;
    return recipient === 'caregiver' ? `${who} (${short})` : who;
  };
  const gifts = [describe(reg.gift_1_gender, reg.gift_1_recipient)];
  if (count === 2) gifts.push(describe(reg.gift_2_gender, reg.gift_2_recipient));
  const filled = gifts.filter(Boolean);
  return `${count} gift${count > 1 ? 's' : ''}${filled.length ? ` (${filled.join(', ')})` : ''}`;
};

// What the family's phone sees once their code is accepted: who is registered,
// for which shopping time, and what each child is shopping for.
export function familyView(rows) {
  const first = rows[0] || {};
  return {
    guardian_name: first.parent_guardian_name || '',
    time_slot: first.time_slot || '',
    time_label: slotLabel(first.time_slot),
    children: rows.map(row => ({
      name: row.child_name || row.participant_name || 'Child',
      age: AGE_LABELS[row.child_age_band] || '',
      gifts: giftSummary(row),
      checked_in: Boolean(row.checked_in),
    })),
    checked_in_count: rows.filter(row => row.checked_in).length,
  };
}

// A family that has just finished a registration form: their rows are loaded
// from the ids the form returned, stamped with one code, and emailed their
// confirmation. The code comes back for the success page.
export async function confirmFamilyRegistration(base44, registrationIds) {
  const ids = (registrationIds || []).filter(Boolean);
  if (!ids.length) return { checkin_code: null };
  const rows = await base44.entities.ProgramRegistration.filter({ id: { $in: ids } });
  const result = await sendRegistrationConfirmation(base44, rows || []);
  return { checkin_code: result.checkin_code };
}

// Stamps the family's code if they do not have one yet, then emails them the
// code with what they registered for. A failed send never blocks a
// registration — the code is still on the record and can be read out at the desk.
export async function sendRegistrationConfirmation(base44, rows) {
  const list = (rows || []).filter(Boolean);
  if (!list.length) return { sent: false, reason: 'no_rows', checkin_code: null };

  const first = list[0];
  const code = await stampFamilyCode(base44, list);
  const email = String(first.parent_guardian_email || first.participant_email || '').trim();
  if (!email) return { sent: false, reason: 'no_email', checkin_code: code };

  const details = list
    .map(row => [
      row.child_name || row.participant_name || 'Child',
      AGE_LABELS[row.child_age_band] || 'age not recorded',
      giftSummary(row),
    ].join(' — '))
    .join(' · ');

  try {
    const sent = await base44.integrations.Core.SendEmail({
      to: email,
      template_name: 'GiftShopRegistrationConfirmation',
      variables: {
        guardian_name: first.parent_guardian_name || 'there',
        checkin_code: code,
        registration_details: details,
        time_label: slotLabel(first.time_slot),
        event_date: GIFT_SHOP_EVENT_DATE,
        event_location: GIFT_SHOP_EVENT_LOCATION,
        contact_email: GIFT_SHOP_CONTACT_EMAIL,
      },
      category: 'transactional',
      from_name: 'Candora 360',
    });

    if (sent && sent.success === false) {
      return { sent: false, reason: sent.reason || 'refused', checkin_code: code };
    }

    await base44.entities.ProgramRegistration.bulkUpdate(
      list.filter(row => row.id).map(row => ({ id: row.id, confirmation_sent_at: new Date().toISOString() })),
    );
    return { sent: true, checkin_code: code, reason: null };
  } catch (error) {
    console.log('Gift shop confirmation email failed:', error.message);
    return { sent: false, reason: error.message, checkin_code: code };
  }
}