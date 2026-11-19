// Staff who manage Candora's public website from Website Studio. Everyone else
// can still see nothing of this area — the portal is gated on this list.
export const WEBSITE_MANAGER_EMAILS = [
  'luis.valbuena@candorasociety.com',
  'yazmin.escobar@candorasociety.com',
  'carla.bosse@candorasociety.com',
  'graham.currie@candorasociety.com',
];

export function hasWebsiteAccess(email, role) {
  if (!email) return false;
  if (role === 'admin') return true;
  return WEBSITE_MANAGER_EMAILS.includes(email.toLowerCase());
}

export const WEBSITE_PAGES = [
  { value: 'home', label: 'Home' },
  { value: 'about', label: 'About us' },
  { value: 'programs', label: 'Programs' },
  { value: 'events', label: 'Events' },
  { value: 'contact', label: 'Contact' },
  { value: 'get_involved', label: 'Get involved' },
];

export function formatWebsiteDate(value, withTime = false) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}