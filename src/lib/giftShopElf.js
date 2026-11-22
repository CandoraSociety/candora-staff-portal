// Helpers for the QR code printed on a Kids Gift Shop name tag. The code opens
// the volunteer's standalone form for that one child — never the portal.
import { newInviteToken, PUBLIC_APP_ORIGIN } from '@/lib/giftShopInvites';

export const newElfToken = newInviteToken;

export const elfFormLink = (token) => `${PUBLIC_APP_ORIGIN}/functions/giftShopElfForm?token=${token}`;

// QR image for a printed tag. Same generator the room check-in codes use.
export const qrImageUrl = (data, size = 300) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${encodeURIComponent(data)}`;