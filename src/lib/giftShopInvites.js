// Client-side helpers for the Kids Gift Shop private pre-registration links.

// 32 hex characters — unguessable enough that a link cannot be found by
// guessing, and short enough to survive being copied out of a text message.
export const newInviteToken = () => {
  const raw = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}${Math.random()}${Math.random()}`;
  return raw.replace(/[^a-zA-Z0-9]/g, '');
};

// The form lives on its own standalone page, served outside the portal, so the
// link never opens Candora 360 itself.
export const PUBLIC_APP_ORIGIN = 'https://candora-360.base44.app';

export const inviteLink = (token) => `${PUBLIC_APP_ORIGIN}/functions/giftShopInviteForm?token=${token}`;

export const INVITE_STATUS_META = {
  invited: { label: 'Link open', className: 'bg-amber-100 text-amber-800' },
  registered: { label: 'Registered', className: 'bg-green-100 text-green-800' },
  revoked: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
};

export const inviteDisplayStatus = (invite) => {
  if (invite?.status === 'invited' && invite?.expires_at && new Date(invite.expires_at) < new Date()) {
    return 'expired';
  }
  return invite?.status || 'invited';
};

export const defaultExpiryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
};

// Bulk paste: one family per line — name, email, phone, children (children optional).
// Accepts commas, tabs or pipes, and skips a header row.
export function parseInviteLines(text) {
  return String(text || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const separator = line.includes('\t') ? '\t' : line.includes('|') ? '|' : ',';
      return line.split(separator).map(part => part.trim());
    })
    .filter(cells => !/^name$/i.test(cells[0] || ''))
    .map(cells => ({
      guardian_name: cells[0] || '',
      guardian_email: cells[1] || '',
      guardian_phone: cells[2] || '',
      children_allowed: Number(cells[3]) > 0 ? Number(cells[3]) : 3,
    }))
    .filter(row => row.guardian_name && (row.guardian_email || row.guardian_phone));
}