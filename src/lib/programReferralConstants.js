// Internal program referral options shared by the referral dialogs, the client
// file's Internal Referrals tab, and the receiving portals' referral panels.

export const PROGRAM_REFERRAL_OPTIONS = [
  { value: 'ell', label: 'English Language Learning (ELL)' },
  { value: 'empoweru', label: 'EmpowerU' },
  { value: 'frn', label: 'Family Resource Network (FRN)' },
  { value: 'phac', label: 'PHAC' },
  { value: 'digital_literacy', label: 'Digital Literacy' },
  { value: 'family_programs', label: 'Community Programs' },
  { value: 'childcare_program', label: 'Childminding' },
  { value: 'settlement_services', label: 'Resource Centre' },
  { value: 'other_internal', label: 'Other (Internal)' },
];

export const PROGRAM_REFERRAL_LABELS = Object.fromEntries(
  PROGRAM_REFERRAL_OPTIONS.map((o) => [o.value, o.label])
);

// Where the receiving program's own portal lives.
export const PROGRAM_REFERRAL_PATHS = {
  ell: '/ell',
  empoweru: '/empoweru/participants',
  frn: '/frn/participants',
  phac: '/phac/participants',
  digital_literacy: '/digilit',
  family_programs: '/community',
  childcare_program: '/childminding',
  settlement_services: '/rc/clients',
};