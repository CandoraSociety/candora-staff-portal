/**
 * Display-name helpers.
 *
 * Some accounts were created with their full_name extracted from the email
 * prefix (e.g. "graham.currie"). The built-in full_name field is read-only,
 * so we normalize it for display: any all-lowercase single-token name
 * containing dots/underscores is split and capitalized ("graham.currie" →
 * "Graham Currie"). Normal names pass through untouched.
 */

export function displayName(user) {
  const raw = user?.display_name || user?.full_name || '';
  if (!raw) return 'User';
  // Email-prefix style name: lowercase single token with . or _ separators
  if (/^[a-z0-9]+([._-][a-z0-9]+)+$/.test(raw)) {
    return raw
      .split(/[._-]+/)
      .filter(Boolean)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }
  return raw;
}

/**
 * Fixes the full_name on the loaded user object in place when it was
 * extracted from the email prefix (full_name === email local part).
 * Safe: only rewrites names that are the account's email prefix.
 */
export function normalizeUser(user) {
  if (user?.full_name && user?.email) {
    const local = user.email.split('@')[0].toLowerCase();
    if (user.full_name.toLowerCase().trim() === local && /[._-]/.test(local)) {
      user.full_name = local
        .split(/[._-]+/)
        .filter(Boolean)
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
    }
  }
  return user;
}

export function displayInitials(user) {
  return (displayName(user) || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}