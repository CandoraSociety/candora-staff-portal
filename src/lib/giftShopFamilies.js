import { KIDS_GIFT_SHOP_TIME_SLOTS } from '@/lib/centralRegConstants';
import { familyMessageKey } from '@/lib/giftShopInvites';

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

// Mother, Grandmother, Aunt and Father, Grandfather, Uncle already say the
// gender of the gift. Only Other and Caregiver ask for it.
const RECIPIENT_GENDERS = {
  mother: 'female',
  grandmother: 'female',
  aunt: 'female',
  father: 'male',
  grandfather: 'male',
  uncle: 'male',
};
export const giftShopAsksGiftGender = (recipient) => recipient === 'other' || recipient === 'caregiver';
export const giftShopGiftGender = (recipient, gender) => (
  RECIPIENT_GENDERS[recipient] || (giftShopAsksGiftGender(recipient) ? (gender || '') : '')
);

// The person a gift is for. A named relative already says the gender, so only
// Other and Caregiver keep it: "Caregiver (F)". With no recipient the gender stands alone.
const describeGift = (gender, recipient) => {
  const label = giftShopGenderLabel(gender);
  const who = giftShopRecipientLabel(recipient);
  if (!who) return label;
  return giftShopAsksGiftGender(recipient) ? `${who} (${label})` : who;
};

// How many gifts are requested for each gender, and who they are for — so the
// team can plan how many male and female gifts to have ready.
export const giftShopGiftTally = (registrations) => {
  const tally = { total: 0, female: 0, male: 0, recipients: {} };
  (registrations || [])
    .filter(r => !['declined', 'withdrawn'].includes(r.status))
    .forEach(reg => {
      const count = Number(reg.gift_count) === 2 ? 2 : 1;
      const gifts = [[reg.gift_1_recipient, reg.gift_1_gender]];
      if (count === 2) gifts.push([reg.gift_2_recipient, reg.gift_2_gender]);
      gifts.forEach(([recipient, gender]) => {
        if (!recipient) return;
        tally.total += 1;
        const value = giftShopGiftGender(recipient, gender);
        if (value === 'female') tally.female += 1;
        if (value === 'male') tally.male += 1;
        tally.recipients[recipient] = (tally.recipients[recipient] || 0) + 1;
      });
    });
  return tally;
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

// Every child on a family's registration, in the order they were registered —
// used on the parent or guardian's own tag.
export const giftShopFamilyChildNames = (family) =>
  (family?.children || []).map(giftShopChildFullName);

// The parent or guardian the child belongs to. At sign-in the adult who brings
// the child can give their own name, which replaces the registered one.
export const giftShopGuardianName = (reg) => (reg?.parent_guardian_name || reg?.participant_name || '').trim();
export const giftShopChildFirstName = (reg) => giftShopChildFullName(reg).split(/\s+/)[0] || 'Child';

// The gifts a child is shopping for, one row each — the same rows the volunteer's
// tag form shows, so a printed form can ask for the same thing by hand.
export const giftShopGiftRows = (reg) => {
  const count = Number(reg?.gift_count) === 2 ? 2 : 1;
  const row = (index, recipient, gender) => ({
    index,
    who: giftShopRecipientLabel(recipient) || 'Someone special',
    gender: giftShopAsksGiftGender(recipient) && gender ? giftShopGenderLabel(gender) : '',
  });
  const rows = [row(1, reg?.gift_1_recipient, reg?.gift_1_gender)];
  if (count === 2) rows.push(row(2, reg?.gift_2_recipient, reg?.gift_2_gender));
  return rows;
};

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

// A child is shopping once an elf pressed Begin shopping on their tag form and
// has not yet returned them to their parent or guardian.
export const giftShopIsShopping = (reg) => Boolean(reg?.shopping_started_at) && !reg?.completed;
export const giftShopFamilyShopping = (family) =>
  (family?.children || []).some(giftShopIsShopping);

// A child is completed once an elf closes them out on the tag form: they have
// finished shopping and gone back to their parent or guardian.
export const giftShopIsCompleted = (reg) => Boolean(reg?.completed);
export const giftShopFamilyCompleted = (family) =>
  (family?.children || []).length > 0 && family.children.every(giftShopIsCompleted);
// The elf who took the child shopping, kept on the card after they are returned.
export const giftShopElfName = (reg) => (reg?.assigned_elf || reg?.completed_by_elf || '').trim();

// The stages a family moves through at the door, in the order they happen —
// the same sections the check-in board shows.
export const GIFT_SHOP_FAMILY_STATUSES = [
  { value: 'waiting', label: 'Not signed in yet' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'completed', label: 'Completed' },
];

// Where a family stands, taken across all of its children, so a message can go
// to every family in one stage.
export const giftShopFamilyStatus = (children = []) => {
  if (children.length && children.every(giftShopIsCompleted)) return 'completed';
  if (children.some(giftShopIsShopping)) return 'shopping';
  if (children.length && children.every(c => c.checked_in)) return 'checked_in';
  return 'waiting';
};

// Every registered family as the message dialog knows it — one entry per family
// (siblings, and children booked into different shopping times, included) with
// the status it is in, so staff can write to all of them or just one status.
export function giftShopMessageFamilies(registrations = []) {
  const map = new Map();
  registrations.forEach(reg => {
    const key = familyMessageKey(reg);
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, {
        family_key: key,
        guardian_name: reg.parent_guardian_name || reg.participant_name || 'No guardian recorded',
        guardian_email: reg.parent_guardian_email || reg.participant_email || '',
        guardian_phone: reg.parent_guardian_phone || reg.participant_phone || '',
        children: [],
      });
    }
    map.get(key).children.push(reg);
  });

  return Array.from(map.values())
    .map(({ children, ...family }) => {
      const status = giftShopFamilyStatus(children);
      return {
        ...family,
        group: status,
        label: GIFT_SHOP_FAMILY_STATUSES.find(s => s.value === status)?.label || status,
      };
    })
    .sort((a, b) => GIFT_SHOP_FAMILY_STATUSES.findIndex(s => s.value === a.group)
      - GIFT_SHOP_FAMILY_STATUSES.findIndex(s => s.value === b.group)
      || a.guardian_name.localeCompare(b.guardian_name));
}

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