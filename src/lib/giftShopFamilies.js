import { KIDS_GIFT_SHOP_TIME_SLOTS } from '@/lib/centralRegConstants';

export const giftShopSlotLabel = (value) => KIDS_GIFT_SHOP_TIME_SLOTS.find(s => s.value === value)?.label || value || 'No slot';
export const giftShopGenderLabel = (value) => (value === 'female' ? 'F' : value === 'male' ? 'M' : '—');

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
  return `${count} gift${count > 1 ? 's' : ''} — ${giftShopGenderLabel(reg.gift_1_gender)}${count > 1 ? `, ${giftShopGenderLabel(reg.gift_2_gender)}` : ''}`;
};