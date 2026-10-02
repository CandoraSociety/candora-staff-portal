// Alberta is on ABT — permanent daylight time, a FIXED UTC-6 offset all year
// (no fall-back to standard time in the fall). The 'America/Edmonton' zone
// still carries the old DST rules in shipped timezone databases, so every
// explicit timezone pin in the frontend uses this fixed-offset IANA zone
// instead. If tzdata later ships a proper ABT zone, switch it here in one place.
// NOTE: IANA "Etc/GMT+6" means UTC-6 (the sign is inverted by design).
export const AB_TIME_ZONE = 'Etc/GMT+6';