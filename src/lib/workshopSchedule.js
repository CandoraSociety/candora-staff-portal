// Local-date helpers (no timezone drift) + workshop occurrence generation.

export function parseDate(str) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO() {
  return toISODate(new Date());
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addMonths(d, n) {
  const x = new Date(d);
  const day = x.getDate();
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  const max = daysInMonth(x.getFullYear(), x.getMonth());
  x.setDate(Math.min(day, max));
  return x;
}

/**
 * Returns the list of ISO date strings for a workshop's sessions.
 * Generates from the base date forward. Past occurrences are included up to
 * `lookback` (default 1 year) so attendance can still be marked; future
 * occurrences are generated up to `horizon` (default ~6 months) or the
 * workshop's recurrence_end_date, whichever comes first.
 */
export function generateOccurrences(workshop, opts = {}) {
  const base = parseDate(workshop?.date);
  if (!base) return [];
  const horizon = opts.horizon ? parseDate(opts.horizon) : addDays(parseDate(todayISO()), 180);
  const lookback = opts.lookback ? parseDate(opts.lookback) : addDays(parseDate(todayISO()), -365);
  const pattern = workshop.recurrence_pattern || 'none';
  const end = workshop.recurrence_end_date ? parseDate(workshop.recurrence_end_date) : null;

  if (pattern === 'none') {
    return base >= lookback ? [toISODate(base)] : [];
  }

  const out = [];
  let cur = new Date(base);
  let guard = 0;
  while (cur <= horizon && guard < 5000) {
    guard++;
    if (cur >= lookback) out.push(toISODate(cur));
    const next =
      pattern === 'weekly' ? addDays(cur, 7)
      : pattern === 'biweekly' ? addDays(cur, 14)
      : addMonths(cur, 1);
    if (end && next > end) {
      // include the final occurrence if it falls within range
      if (next <= horizon && next >= lookback && next <= end) out.push(toISODate(next));
      break;
    }
    cur = next;
  }
  return out;
}

export function nextOccurrence(workshop, fromDate) {
  const occ = generateOccurrences(workshop, { horizon: addDays(parseDate(toISODate(fromDate || new Date())), 365) });
  const today = toISODate(fromDate || new Date());
  return occ.find(d => d >= today) || occ[occ.length - 1] || null;
}

export function formatDateLong(iso) {
  const d = parseDate(iso);
  if (!d) return iso;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(iso) {
  const d = parseDate(iso);
  if (!d) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Workshop categories that link a Workshop to a client's action-plan workshop item.
// The values match the SDP item keys used in client.sdp_items / roadmap_item_status.
export const WORKSHOP_CATEGORIES = [
  { value: 'none', label: '— General (no action-plan link) —' },
  { value: 'job_search_workshop', label: 'Job Search Workshop' },
  { value: 'resume_writing_workshop', label: 'Resume Writing Workshop' },
  { value: 'interview_skills_workshop', label: 'Interview Skills Workshop' },
  { value: 'workplace_readiness_workshop', label: 'Workplace Readiness Workshop' },
  { value: 'financial_literacy_workshop', label: 'Financial Literacy Workshop' },
  { value: 'digital_literacy_workshop', label: 'Digital Literacy Workshop' },
];

export const WORKSHOP_CATEGORY_KEYS = WORKSHOP_CATEGORIES.map(c => c.value).filter(v => v !== 'none');

// Who may register for a workshop / job club session.
export const WORKSHOP_AUDIENCES = [
  { value: 'public', label: 'Public' },
  { value: 'casual', label: 'Casual' },
  { value: 'wd_dea_exclusive', label: 'WD & DEA Exclusive' },
];

export const WORKSHOP_AUDIENCE_LABELS = {
  public: 'Public',
  casual: 'Casual',
  wd_dea_exclusive: 'WD & DEA Exclusive',
};

export const WORKSHOP_AUDIENCE_BADGE = {
  public: 'bg-slate-100 text-slate-600',
  casual: 'bg-amber-100 text-amber-700',
  wd_dea_exclusive: 'bg-violet-100 text-violet-700',
};

// A client may register for a WD & DEA Exclusive session only if they are in
// the Workforce Development (pathways) or Direct Employment Assistance stream.
export function isWdDeaClient(client) {
  return client?.service_type === 'pathways' || client?.service_type === 'direct_to_employment';
}