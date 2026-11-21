import { base44 } from '@/api/base44Client';

// Client documents (résumés, supporting paperwork) are stored privately, so the
// record holds a file_uri rather than a web address. A short-lived link is
// minted only when a signed-in staff member actually opens one. Older records
// still hold plain public URLs — those are handed back untouched.
export const isPrivateFile = (value) =>
  typeof value === 'string' && value.length > 0 && !/^https?:\/\//i.test(value);

export async function resolveFileUrl(value, expiresIn = 300) {
  if (!value) return '';
  if (!isPrivateFile(value)) return value;
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
    file_uri: value,
    expires_in: expiresIn,
  });
  return signed_url;
}