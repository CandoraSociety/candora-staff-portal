import moment from 'moment-timezone';
import { AB_TIME_ZONE } from '@/lib/abTime';

// The app runs on Alberta time, not on whatever clock the device happens to be
// set to. Two defaults make that true everywhere at once:
//
//  1. moment — every moment() renders in Alberta rather than the device zone.
//  2. Date#toLocaleDateString / toLocaleTimeString / toLocaleString — the
//     formatting path used by screens across the whole app — fall back to
//     Alberta whenever the caller did not name a zone explicitly. A caller that
//     pins its own zone (an email timestamp in UTC, say) still wins.
const DEFAULTED = Symbol.for('base44.albertaTimeDefault');
const LOCALE_METHODS = ['toLocaleDateString', 'toLocaleTimeString', 'toLocaleString'];

const defaultZone = (original) =>
  function dateLocaleInAlberta(locales, options) {
    // Some call sites hand the options object over as the first argument.
    if (options === undefined && locales && typeof locales === 'object' && !Array.isArray(locales)) {
      if (locales.timeZone === undefined) return original.call(this, undefined, { ...locales, timeZone: AB_TIME_ZONE });
      return original.call(this, undefined, locales);
    }
    if (!options || options.timeZone === undefined) {
      return original.call(this, locales, { ...(options || {}), timeZone: AB_TIME_ZONE });
    }
    return original.call(this, locales, options);
  };

export function installAlbertaTime() {
  moment.tz.setDefault(AB_TIME_ZONE);

  for (const method of LOCALE_METHODS) {
    const original = Date.prototype[method];
    if (!original || original[DEFAULTED]) continue;
    const patched = defaultZone(original);
    patched[DEFAULTED] = true;
    Date.prototype[method] = patched;
  }
}