// The Kids Gift Shop's logistics as staff last set them up. Every message the
// shop sends reads the date, times and venue from the setup wizard's record, so
// when next year's event is set up the new details flow through the invitation,
// the registration confirmation and every family message without editing any
// copy by hand. Falls back to the day the shop has always run on until a setup
// has been saved.
export const DEFAULT_EVENT_DATE = 'Saturday, December 12th';
export const DEFAULT_EVENT_LOCATION = 'Riverview Crossing Shopping Centre';

const dateOf = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const ordinal = (day: number) => {
  if (day % 10 === 1 && day !== 11) return 'st';
  if (day % 10 === 2 && day !== 12) return 'nd';
  if (day % 10 === 3 && day !== 13) return 'rd';
  return 'th';
};

// "Saturday, December 12th" — the wording every email and text uses.
export function formatEventDate(value?: string | null): string {
  const date = dateOf(value);
  if (!date) return DEFAULT_EVENT_DATE;
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  return `${weekday}, ${month} ${date.getDate()}${ordinal(date.getDate())}`;
}

// "Dec 12" — for the short text messages.
export function formatEventDateShort(value?: string | null): string {
  const date = dateOf(value);
  if (!date) return 'Dec 12';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// The setup in force right now: the newest festival year that has been set up.
// Read through the service role because public forms and texts have no user.
export async function loadGiftShopEvent(base44: any) {
  let setups: any[] = [];
  try {
    const res = await base44.asServiceRole.entities.GiftShopEventSetup.filter({});
    setups = Array.isArray(res) ? res : (res?.items || []);
  } catch (error) {
    console.log('Could not read the Kids Gift Shop event setup:', error?.message);
  }

  const setup = setups
    .slice()
    .sort((a, b) => (Number(b?.festival_year) || 0) - (Number(a?.festival_year) || 0)
      || new Date(b?.created_date || 0).getTime() - new Date(a?.created_date || 0).getTime())[0] || null;

  return {
    setup,
    event_date: formatEventDate(setup?.event_date),
    event_date_short: formatEventDateShort(setup?.event_date),
    event_location: String(setup?.venue || '').trim() || DEFAULT_EVENT_LOCATION,
    desk_location: String(setup?.desk_location || '').trim(),
    start_time: setup?.start_time || '',
    end_time: setup?.end_time || '',
    gifts_per_child: Number(setup?.gifts_per_child) || 1,
    gift_price: setup?.gift_price ?? null,
  };
}