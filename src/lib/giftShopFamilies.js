import { KIDS_GIFT_SHOP_TIME_SLOTS } from '@/lib/centralRegConstants';

export const giftShopSlotLabel = (value) => KIDS_GIFT_SHOP_TIME_SLOTS.find(s => s.value === value)?.label || value || 'No slot';
export const giftShopGenderLabel = (value) => (value === 'female' ? 'F' : value === 'male' ? 'M' : '—');

// The age category a child was registered under, as it reads on a name tag.
export const giftShopAgeBandLabel = (value) => (
  value === '0-5' ? 'Ages 0–5' : value === '6-16' ? 'Ages 6–16' : ''
);

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
export const giftShopRecipientLabel = (value) => RECIPIENT_LABELS[value] || '';

// The person a gift is for. A named recipient already says the gender, so only
// a caregiver keeps it: "Caregiver (F)". With no recipient the gender stands alone.
const describeGift = (gender, recipient) => {
  const label = giftShopGenderLabel(gender);
  const who = giftShopRecipientLabel(recipient);
  if (!who) return label;
  return recipient === 'caregiver' ? `${who} (${label})` : who;
};

// How many places each shopping slot has taken. Every live registration counts,
// whichever way it came in — a pre-registration link or the front desk.
export const giftShopSlotCounts = (registrations) => (registrations || [])
  .filter(r => !['declined', 'withdrawn'].includes(r.status))
  .reduce((acc, r) => {
    if (r.time_slot) acc[r.time_slot] = (acc[r.time_slot] || 0) + 1;
    return acc;
  }, {});

export const giftShopChildFullName = (reg) => (reg.child_name || reg.participant_name || 'Unnamed child').trim();

// How many registered children fall into each age band, so the dashboard shows
// the split at a glance. Children with no band recorded are not counted.
export const giftShopAgeBandCounts = (registrations) => (registrations || [])
  .reduce((acc, r) => {
    if (r.child_age_band === '0-5' || r.child_age_band === '6-16') {
      acc[r.child_age_band] = (acc[r.child_age_band] || 0) + 1;
    }
    return acc;
  }, { '0-5': 0, '6-16': 0 });

// The parent or guardian the child belongs to. At sign-in the adult who brings
// the child can give their own name, which replaces the registered one.
export const giftShopGuardianName = (reg) => (reg?.parent_guardian_name || reg?.participant_name || '').trim();
export const giftShopChildFirstName = (reg) => giftShopChildFullName(reg).split(/\s+/)[0] || 'Child';

// "2 gifts (F, M)" — the count plus who each gift is for.
export const giftShopTagGifts = (reg) => {
  const count = reg.gift_count || 1;
  const gifts = [
    [reg.gift_1_gender, reg.gift_1_recipient],
    count > 1 ? [reg.gift_2_gender, reg.gift_2_recipient] : null,
  ]
    .filter(gift => gift && (gift[0] || gift[1]))
    .map(([gender, recipient]) => describeGift(gender, recipient));
  return `${count} gift${count > 1 ? 's' : ''}${gifts.length ? ` (${gifts.join(', ')})` : ''}`;
};

// A child is completed once an elf closes them out on the tag form: they have
// finished shopping and gone back to their parent or guardian.
export const giftShopIsCompleted = (reg) => Boolean(reg?.completed);
export const giftShopFamilyCompleted = (family) =>
  (family?.children || []).length > 0 && family.children.every(giftShopIsCompleted);
export const giftShopElfName = (reg) => (reg?.completed_by_elf || '').trim();

const familyKey = (r) => [
  (r.parent_guardian_name || r.participant_name || '').trim().toLowerCase(),
  (r.parent_guardian_phone || r.participant_phone || '').trim(),
  r.time_slot || '',
].join('|');

// Children registered by the same guardian into the same slot are one family,
// so siblings sit together on a single registration card.
export function groupGiftShopFamilies(registrations) {
  const map = new Map();
  registrations.forEach(reg => {
    const key = familyKey(reg);
    if (!map.has(key)) {
      map.set(key, {
        key,
        guardian_name: reg.parent_guardian_name || reg.participant_name || 'No guardian recorded',
        guardian_phone: reg.parent_guardian_phone || reg.participant_phone || '',
        guardian_email: reg.parent_guardian_email || reg.participant_email || '',
        time_slot: reg.time_slot || '',
        children: [],
      });
    }
    map.get(key).children.push(reg);
  });
  return Array.from(map.values());
}

export const giftShopGiftSummary = (reg) => {
  const count = reg.gift_count || 1;
  const first = describeGift(reg.gift_1_gender, reg.gift_1_recipient);
  const second = count > 1 ? `, ${describeGift(reg.gift_2_gender, reg.gift_2_recipient)}` : '';
  return `${count} gift${count > 1 ? 's' : ''} — ${first}${second}`;
};