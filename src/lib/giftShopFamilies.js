import { KIDS_GIFT_SHOP_TIME_SLOTS } from '@/lib/centralRegConstants';

export const giftShopSlotLabel = (value) => KIDS_GIFT_SHOP_TIME_SLOTS.find(s => s.value === value)?.label || value || 'No slot';
export const giftShopGenderLabel = (value) => (value === 'female' ? 'F' : value === 'male' ? 'M' : '—');

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

export const giftShopChildFullName = (reg) => (reg.child_name || reg.participant_name || 'Unnamed child').trim();
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