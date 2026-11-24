// Shared server-side logic for the Kids Gift Shop check-in code: the six-digit
// code every registering family receives by email, the confirmation email it
// travels in, and the lookup the check-in desk uses on the day. Kept in one
// place so the invitation form, the general form and the front desk all issue
// codes the same way.
import { slotLabel, GIFT_SHOP_PROGRAM_NAME } from './giftShopInvites.ts';
import { greetText, sendGiftShopText } from './giftShopSms.ts';

// The date and venue come from the event setup wizard's record, so starting
// next year's event updates them everywhere. These are the fallbacks used
// before any setup has been saved.
import { DEFAULT_EVENT_DATE, DEFAULT_EVENT_LOCATION, loadGiftShopEvent } from './giftShopEvent.ts';

export const GIFT_SHOP_EVENT_DATE = DEFAULT_EVENT_DATE;
export const GIFT_SHOP_EVENT_LOCATION = DEFAULT_EVENT_LOCATION;
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

// The code printed as the QR on one child's name tag. It only ever exists on
// that sticker, so scanning it can never be forged.
export function newElfCode() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
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
export const giftSummary = (reg) => {
  const count = Number(reg.gift_count) === 2 ? 2 : 1;
  const describe = (gender, recipient) => {
    const who = RECIPIENT_LABELS[recipient] || '';
    const short = gender === 'female' ? 'F' : gender === 'male' ? 'M' : '';
    if (!who) return short;
    // Only Other and Caregiver keep a gender; a named relative already says it.
    return recipient === 'caregiver' || recipient === 'other' ? `${who} (${short})` : who;
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
    guardian_phone: first.parent_guardian_phone || '',
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

const FAILURE_WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 12;

const cleanCode = (value) => String(value || '').replace(/\D/g, '').slice(0, 6);

export async function findDeskSession(base44, token) {
  if (!token) return null;
  const sessions = await base44.entities.GiftShopDeskSession.filter({ token });
  return (sessions || [])[0] || null;
}

// The lookup a family's phone makes at the desk: the desk's own session token
// is checked first, then the six-digit code. A short code is only safe while it
// cannot be guessed through, so repeated misses on one desk are locked out for
// a few minutes.
export async function deskLookup(base44, { sessionToken, code }) {
  if (!sessionToken) {
    return {
      ok: false,
      status: 400,
      message: 'This page only works from the QR code at the Kids Gift Shop check-in desk. Please scan it with your phone camera, or ask a volunteer for help.',
    };
  }
  const session = await findDeskSession(base44, sessionToken);
  if (!session || session.status !== 'active') {
    return { ok: false, status: 410, message: 'This check-in desk is not open. Please ask a volunteer for help.' };
  }

  const cleaned = cleanCode(code);
  if (cleaned.length !== 6) {
    return { ok: false, status: 400, message: 'Enter the six-digit code from your confirmation email.' };
  }

  const lastFailure = session.last_failed_at ? new Date(session.last_failed_at).getTime() : 0;
  const recentFailures = Date.now() - lastFailure < FAILURE_WINDOW_MS ? Number(session.failed_lookups) || 0 : 0;
  if (recentFailures >= MAX_FAILURES) {
    return { ok: false, status: 429, message: 'Too many tries at this desk. Please ask a volunteer for help.' };
  }

  const rows = await familyRowsForCode(base44, cleaned);
  if (!rows.length) {
    await base44.entities.GiftShopDeskSession.update(session.id, {
      failed_lookups: recentFailures + 1,
      last_failed_at: new Date().toISOString(),
    });
    return {
      ok: false,
      status: 404,
      message: 'We could not find a registration with that code. Check the code in your confirmation email and try again.',
    };
  }

  return { ok: true, session, code: cleaned, rows, family: familyView(rows) };
}

// The family types their own name. It is written to their registrations (so it
// is the name on the parent or guardian tag) and to the desk session, which is
// what makes the desk computer print the tag.
export async function deskSubmit(base44, { sessionToken, code, guardianName, guardianPhone }) {
  const lookup = await deskLookup(base44, { sessionToken, code });
  if (!lookup.ok) return lookup;

  const name = String(guardianName || '').trim();
  if (!name) {
    return {
      ok: false,
      status: 400,
      message: 'Enter your name as you would like it on your name tag.',
      family: lookup.family,
    };
  }

  // The number is how the desk reaches the adult while the child is shopping.
  // It stays on the family's record and is never printed on a name tag.
  const phone = String(guardianPhone || '').trim();
  if (phone.replace(/\D/g, '').length < 7) {
    return {
      ok: false,
      status: 400,
      message: 'Enter a phone number we can reach you at while your child is shopping.',
      family: lookup.family,
    };
  }

  // Checking in on the phone is the same as checking in at the desk: every
  // child who is not signed in yet is signed in now, in the order the families
  // actually arrive, so their tags carry their order number.
  const stampedAt = new Date().toISOString();
  const all = await loadGiftShopRows(base44);
  let nextSequence = all.reduce((max, row) => Math.max(max, row.check_in_sequence || 0), 0);

  const patches = lookup.rows.map(row => {
    const patch = { parent_guardian_name: name, parent_guardian_phone: phone };
    if (!row.elf_token) patch.elf_token = newElfCode();
    if (!row.checked_in) {
      nextSequence += 1;
      patch.checked_in = true;
      patch.checked_in_at = stampedAt;
      patch.check_in_sequence = nextSequence;
    }
    return { id: row.id, ...patch };
  });
  await base44.entities.ProgramRegistration.bulkUpdate(patches);
  const rows = lookup.rows.map(row => ({ ...row, ...patches.find(patch => patch.id === row.id) }));

  await base44.entities.GiftShopDeskSession.update(lookup.session.id, {
    arrival_guardian_name: name,
    arrival_code: lookup.code,
    arrival_registration_ids: lookup.rows.map(row => row.id),
    arrival_at: new Date().toISOString(),
    printed_at: null,
    failed_lookups: 0,
    last_failed_at: null,
  });

  return { ok: true, rows, family: familyView(rows) };
}

// A family that has just finished a registration form: their rows are loaded
// from the ids the form returned, stamped with one code, and emailed their
// confirmation. The code comes back for the success page.
export async function confirmFamilyRegistration(base44, registrationIds) {
  const ids = (registrationIds || []).filter(Boolean);
  if (!ids.length) return { checkin_code: null };
  const rows = await base44.entities.ProgramRegistration.filter({ id: { $in: ids } });
  const result = await sendRegistrationConfirmation(base44, rows || []);
  return { checkin_code: result.checkin_code, emailed: result.emailed, texted: result.texted };
}

// Stamps the family's code if they do not have one yet, then sends them the
// code with what they registered for — by email and by text. A family with no
// email address is reached by text alone. A failed send never blocks a
// registration — the code is still on the record and can be read out at the desk.
export async function sendRegistrationConfirmation(base44, rows) {
  const list = (rows || []).filter(Boolean);
  if (!list.length) return { sent: false, reason: 'no_rows', checkin_code: null };

  const first = list[0];
  const code = await stampFamilyCode(base44, list);
  const email = String(first.parent_guardian_email || first.participant_email || '').trim();
  const phone = String(first.parent_guardian_phone || first.participant_phone || '').trim();
  const event = await loadGiftShopEvent(base44);

  const details = list
    .map(row => [
      row.child_name || row.participant_name || 'Child',
      AGE_LABELS[row.child_age_band] || 'age not recorded',
      giftSummary(row),
    ].join(' — '))
    .join(' · ');

  let emailed = false;
  let texted = false;
  let reason = null;

  if (email) {
    try {
      const sent = await base44.integrations.Core.SendEmail({
        to: email,
        template_name: 'GiftShopRegistrationConfirmation',
        variables: {
          guardian_name: first.parent_guardian_name || 'there',
          checkin_code: code,
          registration_details: details,
          time_label: slotLabel(first.time_slot),
          event_date: event.event_date,
          event_location: event.event_location,
          contact_email: GIFT_SHOP_CONTACT_EMAIL,
        },
        category: 'transactional',
        from_name: 'CANDORA - Kids Gift Shop',
      });

      if (sent && sent.success === false) reason = sent.reason || 'refused';
      else emailed = true;
    } catch (error) {
      console.log('Gift shop confirmation email failed:', error.message);
      reason = error.message;
    }
  } else {
    reason = 'no_email';
  }

  // The same code, in a text — so a family without an email address still gets
  // what they need to check in.
  if (phone) {
    const message = `Candora Kids Gift Shop: you're registered for `
      + `${slotLabel(first.time_slot)} on ${event.event_date} at ${event.event_location}. `
      + `Your check-in code is ${code}. Bring it to the registration desk.`;
    const text = await sendGiftShopText(phone, greetText(first.parent_guardian_name, message));
    if (text.ok) texted = true;
    else if (!emailed) reason = text.reason || reason;
  }

  if (!emailed && !texted) return { sent: false, reason, checkin_code: code };

  await base44.entities.ProgramRegistration.bulkUpdate(
    list.filter(row => row.id).map(row => ({ id: row.id, confirmation_sent_at: new Date().toISOString() })),
  );
  return { sent: true, emailed, texted, checkin_code: code, reason: null };
}