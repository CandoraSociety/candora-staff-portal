import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// The Kids Gift Shop's logistics as staff last saved them in the setup wizard.
// The invitation drafts use these, so starting next year's event updates the
// date and venue in every message without anyone rewriting the copy.
export const FALLBACK_EVENT_DATE = 'Saturday, December 12th';
export const FALLBACK_EVENT_LOCATION = 'Riverview Crossing Shopping Centre';

const dateOf = (value) => {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const ordinal = (day) => {
  if (day % 10 === 1 && day !== 11) return 'st';
  if (day % 10 === 2 && day !== 12) return 'nd';
  if (day % 10 === 3 && day !== 13) return 'rd';
  return 'th';
};

export const eventDateLabel = (value) => {
  const date = dateOf(value);
  if (!date) return FALLBACK_EVENT_DATE;
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  return `${weekday}, ${month} ${date.getDate()}${ordinal(date.getDate())}`;
};

export const eventDateShort = (value) => {
  const date = dateOf(value);
  if (!date) return 'Dec 12';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// The setup in force right now — the newest festival year that has been set up.
export const CURRENT_GIFT_SHOP_EVENT_KEY = ['giftShopEventSetup', 'current'];

export function useGiftShopEventDetails() {
  const { data } = useQuery({
    queryKey: CURRENT_GIFT_SHOP_EVENT_KEY,
    queryFn: async () => {
      const res = await base44.entities.GiftShopEventSetup.filter({}, { sort: '-created_date', limit: 50 });
      const rows = res.items || [];
      return rows
        .slice()
        .sort((a, b) => (Number(b?.festival_year) || 0) - (Number(a?.festival_year) || 0))[0] || null;
    },
    staleTime: 60000,
  });

  const setup = data || null;

  return {
    setup,
    eventDate: eventDateLabel(setup?.event_date),
    eventDateShortLabel: eventDateShort(setup?.event_date),
    eventLocation: String(setup?.venue || '').trim() || FALLBACK_EVENT_LOCATION,
    deskLocation: String(setup?.desk_location || '').trim(),
  };
}

// The invitation email staff start from — the same wording as before, with the
// current event's date and venue filled in.
export const inviteMessageDraft = ({ eventDate, eventLocation }) =>
  `Our Kids Gift Shop is back for Winter Wonderland, and as one of the families we work with, yours is invited to choose a shopping time before registration opens to everyone else. The shop runs on ${eventDate} at ${eventLocation}. Pick a time that works for you and tell us who each child is shopping for — on the day, please come to the Kids Gift Shop registration desk and sign in every child who is participating.`;