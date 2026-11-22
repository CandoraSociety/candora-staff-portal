// Searching the Kids Gift Shop lists. A family or an invitation matches when the
// typed text appears in a guardian's or child's name, email address or phone
// number. Phone numbers are compared by their digits only, so "780 555 1234",
// "780-555-1234" and "7805551234" all find the same family.

const normalise = (value) => String(value ?? '').toLowerCase().trim();
const digits = (value) => String(value ?? '').replace(/\D/g, '');

const matchesFields = (fields, query) => {
  const typed = normalise(query);
  if (!typed) return true;
  const text = fields.map(normalise).join(' ');
  if (text.includes(typed)) return true;
  // A phone number typed with spaces, dashes or brackets still finds the family.
  const typedDigits = digits(query);
  if (typedDigits.length < 3) return false;
  return fields.map(digits).join(' ').includes(typedDigits);
};

export const familyMatchesSearch = (family, query) => matchesFields([
  family?.guardian_name,
  family?.guardian_email,
  family?.guardian_phone,
  ...(family?.children || []).flatMap(child => [
    child.child_name,
    child.participant_name,
    child.participant_first_name,
    child.participant_last_name,
    child.parent_guardian_name,
    child.parent_guardian_email,
    child.parent_guardian_phone,
    child.participant_email,
    child.participant_phone,
  ]),
], query);

export const inviteMatchesSearch = (invite, query) => matchesFields([
  invite?.guardian_name,
  invite?.guardian_email,
  invite?.guardian_phone,
  invite?.registered_summary,
  invite?.notes,
], query);

export const filterFamilies = (families, query) => (
  normalise(query) ? (families || []).filter(f => familyMatchesSearch(f, query)) : (families || [])
);

export const filterInvites = (invites, query) => (
  normalise(query) ? (invites || []).filter(i => inviteMatchesSearch(i, query)) : (invites || [])
);