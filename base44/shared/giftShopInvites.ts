// Shared server-side logic for the Kids Gift Shop private pre-registration
// links. Used by getGiftShopInvite (public lookup) and submitGiftShopInvite
// (public redemption). Every check that protects an invitation — single use,
// expiry, contact match, sibling limit, slot capacity — lives here so the
// browser can never bypass it.

export const GIFT_SHOP_PROGRAM_NAME = 'Kids Gift Shop';
export const GIFT_SHOP_SLOT_CAPACITY = 25;
export const GIFT_SHOP_SLOT_TIMES = [
  '10:30', '10:45', '11:00', '11:15', '11:30', '11:45',
  '12:00', '12:15', '12:30', '12:45',
  '13:00', '13:15', '13:30', '13:45',
  '14:00', '14:15', '14:30', '14:45',
];
export const GIFT_SHOP_AGE_BANDS = ['0-5', '6-16'];
export const GIFT_SHOP_GENDERS = ['female', 'male'];
// Who each gift is for — the person the child is shopping for.
export const GIFT_SHOP_RECIPIENTS = ['mother', 'father', 'grandmother', 'grandfather', 'aunt', 'uncle', 'caregiver', 'other'];

export const todayStr = () => new Date().toISOString().split('T')[0];

export function slotLabel(value) {
  const [hour, minute] = String(value || '').split(':').map(Number);
  if (!hour && hour !== 0) return value || '';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
// Compare phone numbers on their last ten digits so formatting never matters.
export const normalizePhone = (value) => String(value || '').replace(/\D/g, '').slice(-10);

// missing | revoked | registered | expired | open
export function inviteState(invite, now) {
  if (!invite) return 'missing';
  if (invite.status === 'revoked') return 'revoked';
  if (invite.status === 'registered') return 'registered';
  if (invite.expires_at && new Date(invite.expires_at).getTime() < (now || new Date()).getTime()) return 'expired';
  return 'open';
}

function countsBySlot(registrations) {
  return (registrations || [])
    .filter(r => !['declined', 'withdrawn'].includes(r.status))
    .reduce((acc, r) => {
      if (r.time_slot) acc[r.time_slot] = (acc[r.time_slot] || 0) + 1;
      return acc;
    }, {});
}

export function buildSlotAvailability(registrations) {
  const counts = countsBySlot(registrations);
  return GIFT_SHOP_SLOT_TIMES.map(value => {
    const taken = counts[value] || 0;
    return {
      value,
      label: slotLabel(value),
      remaining: Math.max(0, GIFT_SHOP_SLOT_CAPACITY - taken),
    };
  });
}

// Backend functions use the SDK's array form (a second options argument is not
// supported there), so the gift shop rows are filtered after one page read.
async function loadRegistrations(base44) {
  const all = await base44.entities.ProgramRegistration.list('-created_date', 500);
  return (all || []).filter(r => r.program_name === GIFT_SHOP_PROGRAM_NAME);
}

export async function findInviteByToken(base44, token) {
  const matches = await base44.entities.GiftShopInvite.filter({ token });
  return (matches || [])[0] || null;
}

// What the public page is allowed to see. Contact details are never returned —
// the invited family has to type the one they were contacted at.
export async function buildPublicInvite(base44, token) {
  const invite = await findInviteByToken(base44, token);
  if (!invite) return null;
  const state = inviteState(invite);
  const slots = state === 'open' ? buildSlotAvailability(await loadRegistrations(base44)) : [];
  return {
    state,
    invite: {
      guardian_name: invite.guardian_name || '',
      children_allowed: Number(invite.children_allowed) || 3,
      expires_at: invite.expires_at || null,
      time_slot: invite.time_slot || null,
      registered_summary: invite.registered_summary || null,
    },
    slots,
  };
}

const fail = (status, message) => ({ ok: false, status, message });

export async function redeemGiftShopInvite(base44, token, payload) {
  const invite = await findInviteByToken(base44, token);
  if (!invite) return fail(404, 'This invitation link was not recognised. Please call the office.');

  const state = inviteState(invite);
  if (state === 'registered') return fail(409, 'This invitation has already been used. Please call the office if you need to change anything.');
  if (state === 'revoked') return fail(403, 'This invitation has been cancelled. Please call the office.');
  if (state === 'expired') return fail(410, 'This invitation has expired. Please call the office.');

  const guardianName = String(payload?.guardian_name || '').trim();
  if (!guardianName) return fail(400, 'Enter the parent or guardian’s name.');

  const contact = String(payload?.contact || '').trim();
  if (!contact) return fail(400, 'Enter the email address or phone number this invitation was sent to.');

  // The contact check is what makes a forwarded link useless to anyone else.
  const inviteEmail = normalizeEmail(invite.guardian_email);
  const invitePhone = normalizePhone(invite.guardian_phone);
  const typedEmail = normalizeEmail(contact);
  const typedPhone = normalizePhone(contact);
  const contactMatches =
    (inviteEmail && typedEmail === inviteEmail) ||
    (invitePhone && typedPhone.length === 10 && typedPhone === invitePhone);
  if (!contactMatches) {
    return fail(403, 'That email or phone number does not match this invitation. Please use the contact details the invitation was sent to, or call the office.');
  }

  const allowed = Number(invite.children_allowed) || 3;
  const rawChildren = Array.isArray(payload?.children) ? payload.children : [];
  if (!rawChildren.length) return fail(400, 'Add at least one child.');
  if (rawChildren.length > allowed) return fail(400, `This invitation covers up to ${allowed} children.`);

  const children = [];
  for (let index = 0; index < rawChildren.length; index += 1) {
    const child = rawChildren[index] || {};
    const name = String(child.child_name || '').trim();
    if (!name) return fail(400, `Enter the name for child ${index + 1}.`);
    const ageBand = String(child.age_band || '');
    if (!GIFT_SHOP_AGE_BANDS.includes(ageBand)) return fail(400, `Select the age for ${name}.`);
    const giftCount = Number(child.gift_count) === 2 ? 2 : 1;
    const gift1 = String(child.gift_1_gender || '');
    if (!GIFT_SHOP_GENDERS.includes(gift1)) return fail(400, `Select who the first gift is for, for ${name}.`);
    const gift2 = String(child.gift_2_gender || '');
    if (giftCount === 2 && !GIFT_SHOP_GENDERS.includes(gift2)) return fail(400, `Select who the second gift is for, for ${name}.`);
    const recipient1 = String(child.gift_1_recipient || '');
    if (!GIFT_SHOP_RECIPIENTS.includes(recipient1)) return fail(400, `Select who the first gift is for (for example Mother or Uncle), for ${name}.`);
    const recipient2 = String(child.gift_2_recipient || '');
    if (giftCount === 2 && !GIFT_SHOP_RECIPIENTS.includes(recipient2)) return fail(400, `Select who the second gift is for (for example Mother or Uncle), for ${name}.`);
    children.push({
      child_name: name,
      age_band: ageBand,
      gift_count: giftCount,
      gift_1_gender: gift1,
      gift_2_gender: giftCount === 2 ? gift2 : null,
      gift_1_recipient: recipient1,
      gift_2_recipient: giftCount === 2 ? recipient2 : null,
    });
  }

  const timeSlot = String(payload?.time_slot || '');
  if (!GIFT_SHOP_SLOT_TIMES.includes(timeSlot)) return fail(400, 'Choose a shopping time.');

  const registrations = await loadRegistrations(base44);
  const taken = countsBySlot(registrations)[timeSlot] || 0;
  if (taken + children.length > GIFT_SHOP_SLOT_CAPACITY) {
    return fail(409, `That time no longer has enough places left (${Math.max(0, GIFT_SHOP_SLOT_CAPACITY - taken)} remaining). Please choose another time.`);
  }

  const guardianParts = guardianName.split(/\s+/);
  const guardianLast = guardianParts.length > 1 ? guardianParts[guardianParts.length - 1] : '';

  const records = children.map(child => {
    const childParts = child.child_name.split(/\s+/);
    const childLast = childParts.slice(1).join(' ') || guardianLast;
    return {
      participant_first_name: childParts[0],
      participant_last_name: childLast,
      participant_name: child.child_name,
      participant_phone: invite.guardian_phone || null,
      participant_email: invite.guardian_email || null,
      program_portal: 'other',
      program_name: GIFT_SHOP_PROGRAM_NAME,
      registration_date: todayStr(),
      status: 'approved',
      parent_guardian_name: guardianName,
      parent_guardian_phone: invite.guardian_phone || null,
      parent_guardian_email: invite.guardian_email || null,
      child_name: child.child_name,
      child_age_band: child.age_band,
      gift_count: child.gift_count,
      gift_1_gender: child.gift_1_gender,
      ...(child.gift_2_gender ? { gift_2_gender: child.gift_2_gender } : {}),
      gift_1_recipient: child.gift_1_recipient,
      ...(child.gift_2_recipient ? { gift_2_recipient: child.gift_2_recipient } : {}),
      time_slot: timeSlot,
      notes: 'Pre-registration invitation',
    };
  });

  const created = await base44.entities.ProgramRegistration.bulkCreate(records);

  await base44.entities.GiftShopInvite.update(invite.id, {
    status: 'registered',
    used_at: new Date().toISOString(),
    time_slot: timeSlot,
    registered_summary: children.map(c => c.child_name).join(', '),
    registration_ids: (created || []).map(r => r.id).filter(Boolean),
  });

  return {
    ok: true,
    state: 'registered',
    children: children.map(c => c.child_name),
    time_slot: timeSlot,
    time_label: slotLabel(timeSlot),
  };
}