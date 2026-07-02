export const COMPONENT_TYPE_OPTIONS = [
  { value: 'kids_gift_shop', label: 'Kids Gift Shop', icon: '🎁', color: '#ef4444' },
  { value: 'santas_village', label: "Santa's Village", icon: '🎅', color: '#22c55e' },
  { value: 'community_lunch', label: 'Christmas Community Lunch', icon: '🍽️', color: '#f59e0b' },
  { value: 'fundraiser', label: 'Annual Fundraiser', icon: '💰', color: '#8b5cf6' },
  { value: 'other', label: 'Other', icon: '❄️', color: '#3b82f6' },
];
export const COMPONENT_TYPE_LABELS = Object.fromEntries(COMPONENT_TYPE_OPTIONS.map(c => [c.value, c.label]));

export const FESTIVAL_STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning', color: '#f59e0b' },
  { value: 'active', label: 'Active', color: '#22c55e' },
  { value: 'completed', label: 'Completed', color: '#8b5cf6' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
];
export const FESTIVAL_STATUS_LABELS = Object.fromEntries(FESTIVAL_STATUS_OPTIONS.map(s => [s.value, s.label]));

export const COMPONENT_STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning', color: '#f59e0b' },
  { value: 'ready', label: 'Ready', color: '#3b82f6' },
  { value: 'active', label: 'Active', color: '#22c55e' },
  { value: 'completed', label: 'Completed', color: '#8b5cf6' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
];
export const COMPONENT_STATUS_LABELS = Object.fromEntries(COMPONENT_STATUS_OPTIONS.map(s => [s.value, s.label]));

export const EVENT_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', color: '#3b82f6' },
  { value: 'completed', label: 'Completed', color: '#22c55e' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
];
export const EVENT_STATUS_LABELS = Object.fromEntries(EVENT_STATUS_OPTIONS.map(s => [s.value, s.label]));