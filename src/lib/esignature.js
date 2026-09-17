// Shared client-side e-signature helpers

export const SIGNATURE_FONTS = [
  { value: "'Great Vibes', cursive", label: 'Great Vibes' },
  { value: "'Dancing Script', cursive", label: 'Dancing Script' },
  { value: "'Sacramento', cursive", label: 'Sacramento' },
  { value: "'Allura', cursive", label: 'Allura' },
  { value: "'Caveat', cursive", label: 'Caveat' },
  { value: "'Playfair Display', serif", label: 'Playfair Display' },
  { value: "'DM Sans', sans-serif", label: 'DM Sans' },
  { value: "'Nunito', sans-serif", label: 'Nunito' },
  { value: "'Inter', sans-serif", label: 'Inter' },
];

export const SIGNATURE_COLORS = ['#0f172a', '#1d4ed8', '#047857', '#b91c1c', '#7c3aed', '#c2410c'];

export async function computeAuthHash(salt, code) {
  const data = new TextEncoder().encode(`${salt}:${code}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function validateCode(authType, code) {
  if (authType === 'pin') return /^\d{4}$/.test(code) ? null : 'PIN must be exactly 4 digits';
  return code && code.length >= 6 ? null : 'Password must be at least 6 characters';
}