import { textsForPhone } from '@/lib/giftShopTexts';

// The CANDORA contact card, served as a vCard by a backend function. Twilio
// fetches it and attaches it to a text, so the family can save the number as
// CANDORA — Canadian numbers cannot carry a sender name.
export const CONTACT_CARD_URL = 'https://candora-360.base44.app/functions/giftShopContactCard';

// The card rides on the first text only. Once a family has received it, later
// texts go out as plain SMS.
export const contactCardMediaUrl = (texts, phone) => {
  const alreadySent = textsForPhone(texts, phone)
    .some(t => t.direction === 'out' && t.contact_card_sent);
  return alreadySent ? null : CONTACT_CARD_URL;
};