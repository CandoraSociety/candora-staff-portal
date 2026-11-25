import { base44 } from '@/api/base44Client';

// The details a list is missing that the Central Database already holds. A list
// can carry a phone number alone, or an email address alone, and still find the
// family — so staff are shown what would be filled in and decide whether to use it.

const DETAIL_LABEL = {
  guardian_name: 'name',
  guardian_email: 'email address',
  guardian_phone: 'phone number',
};

export const detailLabels = (fill = {}) => Object.keys(fill).map(key => DETAIL_LABEL[key]).filter(Boolean);

export async function findCentralInfo(rows = []) {
  if (!rows.length) return [];
  const response = await base44.functions.invoke('findGiftShopCentralFamilies', {
    families: rows.map(row => ({
      guardian_name: row.guardian_name || '',
      guardian_email: row.guardian_email || '',
      guardian_phone: row.guardian_phone || '',
    })),
  });
  return (response.data?.matches || []).filter(match => Object.keys(match.fill || {}).length);
}

// Applies the confirmed details to the list, leaving every other row untouched.
export function applyCentralInfo(rows, matches, included) {
  return rows.map((row, index) => {
    const match = matches.find(entry => entry.index === index);
    if (!match || !included[String(index)]) return row;
    return { ...row, ...match.fill };
  });
}