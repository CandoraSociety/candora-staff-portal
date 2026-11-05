export const GIVING_LEVELS = {
  prospect: { label: 'Prospect', className: 'bg-muted text-muted-foreground' },
  new: { label: 'New', className: 'bg-blue-100 text-blue-700' },
  recurring: { label: 'Recurring', className: 'bg-emerald-100 text-emerald-700' },
  major: { label: 'Major', className: 'bg-purple-100 text-purple-700' },
  lapsed: { label: 'Lapsed', className: 'bg-amber-100 text-amber-800' },
  inactive: { label: 'Inactive', className: 'bg-rose-100 text-rose-700' },
};

export const DONOR_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' },
];

export const DONATION_TYPES = [
  { value: 'one_time', label: 'One-time gift' },
  { value: 'recurring_monthly', label: 'Monthly gift' },
  { value: 'recurring_annual', label: 'Annual gift' },
  { value: 'in_kind', label: 'In-kind gift' },
  { value: 'pledge', label: 'Pledge' },
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'credit_card', label: 'Credit card' },
  { value: 'e_transfer', label: 'E-transfer' },
  { value: 'online', label: 'Online' },
  { value: 'other', label: 'Other' },
];

export const CAMPAIGN_TYPES = [
  { value: 'appeal', label: 'Appeal' },
  { value: 'event', label: 'Event' },
  { value: 'grant_match', label: 'Grant match' },
  { value: 'capital', label: 'Capital' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Other' },
];

export const formatMoney = (value) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const formatMoneyExact = (value) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);

export const donorName = (donor) => {
  if (!donor) return '';
  const person = [donor.first_name, donor.last_name].filter(Boolean).join(' ');
  return donor.organization ? `${person}${person ? ' · ' : ''}${donor.organization}` : person;
};

export const labelFor = (list, value) =>
  list.find((item) => item.value === value)?.label || (value ? value.replace(/_/g, ' ') : '—');