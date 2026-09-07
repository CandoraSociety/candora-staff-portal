import { REG_STATUS_OPTIONS } from '@/lib/receptionConstants';

// Program areas managed by the Central Registration portal. Each area maps to
// the SAME entities its own portal uses — no duplicate registration data.
export const REG_AREA_OPTIONS = [
  { key: 'community', label: 'Community Programs', color: '#f97316', path: '/community/programs' },
  { key: 'empoweru', label: 'EmpowerU', color: '#8b5cf6', path: '/empoweru/cohorts' },
  { key: 'phac', label: 'PHAC Programs (0-6)', color: '#0ea5e9', path: '/phac/programs' },
  { key: 'ell', label: 'ELL (English Language Learning)', color: '#22c55e', path: '/ell/learners' },
  { key: 'digilit', label: 'Digital Literacy', color: '#6366f1', path: '/digilit/participants' },
  { key: 'volunteer', label: 'Volunteer Program', color: '#ec4899', path: '/volunteermgr/volunteers' },
  { key: 'reception', label: 'Other / Cross-Portal', color: '#64748b', path: '/reception/registration' },
];
export const REG_AREA_LABELS = Object.fromEntries(REG_AREA_OPTIONS.map(a => [a.key, a.label]));
export const REG_AREA_COLORS = Object.fromEntries(REG_AREA_OPTIONS.map(a => [a.key, a.color]));
export const REG_AREA_PATHS = Object.fromEntries(REG_AREA_OPTIONS.map(a => [a.key, a.path]));

// Native status options per area — mirror each entity's schema.
export const COMMUNITY_REG_STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered', color: '#3b82f6' },
  { value: 'active', label: 'Active', color: '#22c55e' },
  { value: 'completed', label: 'Completed', color: '#8b5cf6' },
  { value: 'waitlisted', label: 'Waitlisted', color: '#a855f7' },
  { value: 'withdrawn', label: 'Withdrawn', color: '#64748b' },
];
export const EMPOWERU_REG_STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered', color: '#3b82f6' },
  { value: 'waitlisted', label: 'Waitlisted', color: '#a855f7' },
  { value: 'enrolled', label: 'Enrolled', color: '#22c55e' },
  { value: 'completed', label: 'Completed', color: '#8b5cf6' },
  { value: 'withdrawn', label: 'Withdrawn', color: '#64748b' },
  { value: 'declined', label: 'Declined', color: '#ef4444' },
];
export const DIGILIT_STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered', color: '#3b82f6' },
  { value: 'started', label: 'Started', color: '#22c55e' },
  { value: 'completed', label: 'Completed', color: '#8b5cf6' },
  { value: 'waitlisted', label: 'Waitlisted', color: '#a855f7' },
  { value: 'withdrawn', label: 'Withdrawn', color: '#64748b' },
];
export const ELL_ENROLLMENT_OPTIONS = [
  { value: 'prospective', label: 'Prospective', color: '#f59e0b' },
  { value: 'enrolled', label: 'Enrolled', color: '#3b82f6' },
  { value: 'active', label: 'Active', color: '#22c55e' },
  { value: 'completed', label: 'Completed', color: '#8b5cf6' },
  { value: 'withdrawn', label: 'Withdrawn', color: '#64748b' },
];
export const VOLUNTEER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: '#f59e0b' },
  { value: 'active', label: 'Active', color: '#22c55e' },
  { value: 'occasional', label: 'Occasional', color: '#3b82f6' },
  { value: 'waitlist', label: 'Waitlisted', color: '#a855f7' },
  { value: 'inactive', label: 'Inactive', color: '#64748b' },
  { value: 'suspended', label: 'Suspended', color: '#ef4444' },
];
export const VOLUNTEER_TYPE_OPTIONS = [
  { value: 'community', label: 'Community Volunteer' },
  { value: 'skilled', label: 'Skilled Volunteer' },
  { value: 'practicum', label: 'Practicum Student' },
  { value: 'corporate', label: 'Corporate Group' },
  { value: 'internal_placement', label: 'Internal Placement' },
];

export const AREA_STATUS_OPTIONS = {
  community: COMMUNITY_REG_STATUS_OPTIONS,
  empoweru: EMPOWERU_REG_STATUS_OPTIONS,
  digilit: DIGILIT_STATUS_OPTIONS,
  ell: ELL_ENROLLMENT_OPTIONS,
  reception: REG_STATUS_OPTIONS,
};
export const AREA_STATUS_LABELS = Object.fromEntries(
  Object.entries(AREA_STATUS_OPTIONS).map(([area, opts]) => [area, Object.fromEntries(opts.map(o => [o.value, o.label]))])
);

// Entity that owns each area's registration record (for status updates).
export const AREA_ENTITIES = {
  community: 'CommunityRegistration',
  empoweru: 'EmpowerURegistration',
  digilit: 'DigiLitParticipant',
  ell: 'ELLLearner',
  reception: 'ProgramRegistration',
};

// How waitlist rows are promoted / removed per area (status on the owning entity).
export const WAITLIST_ACTIONS = {
  community: { entity: 'CommunityRegistration', promote: 'registered', remove: 'withdrawn' },
  empoweru: { entity: 'EmpowerURegistration', promote: 'registered', remove: 'withdrawn', hasPosition: true },
  digilit: { entity: 'DigiLitParticipant', promote: 'registered', remove: 'withdrawn' },
  reception: { entity: 'ProgramRegistration', promote: 'approved', remove: 'declined', hasPosition: true },
  volunteer: { entity: 'Volunteer', promote: 'pending', remove: 'inactive' },
};

export const today = () => new Date().toISOString().split('T')[0];