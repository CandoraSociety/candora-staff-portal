import { useEffect } from 'react';
import { inviteLink } from '@/lib/giftShopInvites';

// Invitation links sent before the form moved now land here. The form itself is
// a standalone page outside the portal, so this just hands the family over.
export default function GiftShopInvite() {
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') || '';
    window.location.replace(inviteLink(token));
  }, []);

  return null;
}