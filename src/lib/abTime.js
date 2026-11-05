import moment from 'moment-timezone';

// Alberta is on ABT — permanent daylight time, a FIXED UTC-6 offset all year
// (no fall-back to standard time in the fall). The 'America/Edmonton' zone
// still carries the old DST rules in shipped timezone databases, so every
// explicit timezone pin in the frontend uses this fixed-offset IANA zone
// instead. If tzdata later ships a proper ABT zone, switch it here in one place.
// NOTE: IANA "Etc/GMT+6" means UTC-6 (the sign is inverted by design).
export const AB_TIME_ZONE = 'Etc/GMT+6';

// Anything clock-related goes through here so the whole app agrees on Alberta.
export const abMoment = (value) =>
  value === undefined || value === null
    ? moment().tz(AB_TIME_ZONE)
    : moment(value).tz(AB_TIME_ZONE);

export const abFormat = (value, pattern, fallback = '') => {
  const m = abMoment(value);
  return m.isValid() ? m.format(pattern) : fallback;
};

// "YYYY-MM-DDTHH:mm" for a <input type="datetime-local">, in Alberta time —
// a datetime-local field shows whatever string it is given, so a UTC value
// there reads six hours off.
export const abInputDateTime = (value = new Date()) => abMoment(value).format('YYYY-MM-DDTHH:mm');

// "YYYY-MM-DD" for today on the Alberta clock. Plain toISOString() gives the
// UTC date, which rolls over to tomorrow from 6 pm Alberta onward.
export const abToday = () => abMoment().format('YYYY-MM-DD');