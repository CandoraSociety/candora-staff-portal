// System timestamps come back from the API as bare UTC wall clock —
// "2026-11-05T07:09:29.557000", with no trailing Z. Browsers read a string
// like that as *local* time, which put every clock in the app six hours out
// (1:09 am showed as 7:09 am).
//
// Stamp those two fields as UTC the moment a record arrives, so they render in
// Alberta time like every other date. Staff-entered values (appointment_date,
// session_date, start_datetime …) are already Alberta wall clock and are
// deliberately left exactly as they are.
const UTC_STAMP_FIELDS = new Set(['created_date', 'updated_date']);
const NAIVE_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;

const normalizeValue = (value) => {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((entry) => {
      const out = normalizeValue(entry);
      if (out !== entry) changed = true;
      return out;
    });
    return changed ? next : value;
  }

  if (!value || typeof value !== 'object' || value instanceof Date) return value;

  let changed = false;
  const next = { ...value };
  for (const [key, entry] of Object.entries(next)) {
    let out = entry;
    if (typeof entry === 'string' && UTC_STAMP_FIELDS.has(key) && NAIVE_UTC.test(entry)) {
      out = `${entry}Z`;
    } else if (entry && typeof entry === 'object') {
      out = normalizeValue(entry);
    }
    if (out !== entry) {
      next[key] = out;
      changed = true;
    }
  }
  return changed ? next : value;
};

export default function normalizeTimestamps(value) {
  return normalizeValue(value);
}