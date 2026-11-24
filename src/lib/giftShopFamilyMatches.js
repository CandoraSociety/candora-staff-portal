import { base44 } from '@/api/base44Client';
import { familyMessageKey, inviteDisplayStatus, INVITE_STATUS_META } from '@/lib/giftShopInvites';
import { giftShopGuardianName, giftShopSlotLabel } from '@/lib/giftShopFamilies';

// Comparing families before a new card is opened. A family is the same household
// when an email address, a phone number or the guardian's full name matches
// something already in the Kids Gift Shop — an invitation sent earlier, or a
// registration from any phase of the event.

const normalizeName = (value) =>
  String(value || '').toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
};

const inviteDetail = (invite) => {
  const status = inviteDisplayStatus(invite);
  const parts = [INVITE_STATUS_META[status]?.label || status];
  if (invite.registered_summary) parts.push(invite.registered_summary);
  if (status === 'invited' && invite.expires_at) {
    parts.push(`closes ${new Date(invite.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
  }
  return parts.filter(Boolean).join(' · ');
};

const registrationDetail = (rows) => {
  const slot = rows.find(row => row.time_slot)?.time_slot;
  const stage = rows.every(row => row.completed)
    ? 'Completed'
    : rows.some(row => row.checked_in)
      ? 'Checked in'
      : 'Registered';
  return [
    `${rows.length} ${rows.length === 1 ? 'child' : 'children'}`,
    slot ? giftShopSlotLabel(slot) : '',
    stage,
  ].filter(Boolean).join(' · ');
};

// Every family already in the Kids Gift Shop, from both places they can exist:
// the invitations list and the registrations, whatever stage they reached.
export function buildGiftShopFamilies({ invites = [], registrations = [] } = {}) {
  const families = [];

  invites.forEach(invite => {
    families.push({
      id: `invite:${invite.id}`,
      source: 'Pre-registration',
      guardian_name: invite.guardian_name || '',
      guardian_email: invite.guardian_email || '',
      guardian_phone: invite.guardian_phone || '',
      detail: inviteDetail(invite),
      rc_client_id: invite.rc_client_id || '',
      registration_ids: invite.registration_ids || [],
    });
  });

  // Siblings sit on separate registration rows, so they are gathered back into
  // one family before comparing.
  const groups = new Map();
  registrations.forEach(reg => {
    const contactKey = familyMessageKey({
      guardian_phone: reg.parent_guardian_phone || reg.participant_phone,
      guardian_email: reg.parent_guardian_email || reg.participant_email,
    });
    const key = contactKey || `n:${normalizeName(giftShopGuardianName(reg))}`;
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(reg);
  });

  groups.forEach(rows => {
    const first = rows[0];
    families.push({
      id: `reg:${first.id}`,
      source: 'Registration',
      guardian_name: giftShopGuardianName(first),
      guardian_email: first.parent_guardian_email || first.participant_email || '',
      guardian_phone: first.parent_guardian_phone || first.participant_phone || '',
      detail: registrationDetail(rows),
      rc_client_id: '',
      registration_ids: rows.map(row => row.id),
    });
  });

  return families;
}

export function findFamilyMatches(candidate, families) {
  const email = normalizeEmail(candidate?.guardian_email);
  const phone = normalizePhone(candidate?.guardian_phone);
  const name = normalizeName(candidate?.guardian_name);

  return families
    .map(family => {
      const reasons = [];
      if (email && normalizeEmail(family.guardian_email) === email) reasons.push('email');
      if (phone && normalizePhone(family.guardian_phone) === phone) reasons.push('phone');
      if (name && normalizeName(family.guardian_name) === name) reasons.push('name');
      return { ...family, reasons };
    })
    .filter(family => family.reasons.length)
    .sort((a, b) => b.reasons.length - a.reasons.length)
    .slice(0, 4);
}

async function loadGiftShopFamilies() {
  const [invites, registrationsPage] = await Promise.all([
    base44.entities.GiftShopInvite.list('-created_date', 500),
    base44.entities.ProgramRegistration
      .filter({ program_name: 'Kids Gift Shop' }, { sort: '-created_date', limit: 500 })
      .then(res => res.items || []),
  ]);
  return buildGiftShopFamilies({ invites, registrations: registrationsPage });
}

// The families in a list that already exist, one review per row, keyed by the
// row's position so a decision can be kept for it.
export async function reviewFamilies(rows = []) {
  const families = await loadGiftShopFamilies();
  return rows
    .map((family, index) => ({ key: String(index), family, matches: findFamilyMatches(family, families) }))
    .filter(review => review.matches.length);
}