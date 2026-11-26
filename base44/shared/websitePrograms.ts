// The rules behind a program's page: what its status reads, how many seats are
// left, what the website is sent, and how its calendar is generated. Kept in one
// place so the public feed, the registration endpoint and the staff screens can
// never disagree about whether a program is open.

export const PUBLIC_SITE_URL = 'https://candora360.ca';

// Trimmed, length-capped text — used for everything a visitor or a staff member
// types, so a record can never be written with an unbounded field.
export const cleanText = (value, max = 300) => String(value || '').trim().slice(0, max);

export const PROGRAM_STATUS_LABELS = {
  drop_in: 'Drop-in',
  rolling_intake: 'Rolling intake',
  registration_opening_soon: 'Registration opening soon',
  registration_open: 'Registration open',
  waitlist_only: 'Waitlist only',
  full: 'Full',
  closed: 'Closed',
  finished: 'Finished',
};

export const PROGRAM_CATEGORY_LABELS = {
  adult_learning: 'Adult Learning',
  family_community: 'Family & Community',
  employment: 'Employment',
  volunteer: 'Volunteer',
  other: 'Other',
};

export const statusLabel = (status) => PROGRAM_STATUS_LABELS[status] || 'Registration open';

const startOfDay = (value) => {
  if (!value) return null;
  const time = new Date(`${String(value).slice(0, 10)}T00:00:00`).getTime();
  return Number.isFinite(time) ? time : null;
};

const endOfDay = (value) => {
  if (!value) return null;
  const time = new Date(`${String(value).slice(0, 10)}T23:59:59`).getTime();
  return Number.isFinite(time) ? time : null;
};

// What the page says about joining right now. Staff can lock the status and it is
// used exactly as set; otherwise the dates and the seats decide, so nobody has to
// remember to open or close a page.
export function computeProgramStatus(program, seatsTaken = 0, now = Date.now()) {
  if (!program) return 'closed';
  if (program.status_locked) return program.status || 'registration_open';
  if (program.status === 'closed' || program.status === 'finished') return program.status;

  const end = endOfDay(program.end_date);
  if (end && now > end) return 'finished';

  if (program.registration_required === false || program.registration_mode === 'none') return 'drop_in';

  const opens = startOfDay(program.intake_opens);
  if (opens && now < opens) return 'registration_opening_soon';

  const closes = endOfDay(program.intake_closes);
  if (closes && now > closes) return 'closed';

  const capacity = Number(program.capacity) || 0;
  const full = capacity > 0 && Number(seatsTaken) >= capacity;
  if (full) return program.waitlist_enabled ? 'waitlist_only' : 'full';

  if (program.registration_mode === 'waitlist') return 'waitlist_only';
  if (program.status === 'rolling_intake') return 'rolling_intake';

  return 'registration_open';
}

export function seatsRemaining(program, seatsTaken = 0) {
  const capacity = Number(program?.capacity) || 0;
  if (!capacity) return null;
  return Math.max(0, capacity - Number(seatsTaken || 0));
}

// True when a registration can be confirmed right now without a staff decision.
export function canConfirmNow(program, seatsTaken = 0) {
  if (program?.approval_required || program?.registration_mode === 'approval') return false;
  const left = seatsRemaining(program, seatsTaken);
  return left === null || left > 0;
}

export function publicProgram(program, seatsTaken = 0, now = Date.now()) {
  const status = computeProgramStatus(program, seatsTaken, now);
  return {
    id: program.id,
    name: program.name || '',
    slug: program.slug || '',
    public_path: program.public_path || (program.slug ? `/programs/${program.slug}` : ''),
    category: program.category || 'other',
    category_label: PROGRAM_CATEGORY_LABELS[program.category] || 'Other',
    summary: program.summary || '',
    description: program.description || '',
    image_url: program.image_url || '',
    poster_url: program.poster_url || '',
    image_alt: program.image_alt || '',
    location_name: program.location_name || '',
    address: program.address || '',
    room: program.room || '',
    eligibility: program.eligibility || '',
    cost: program.cost || '',
    contact_name: program.contact_name || '',
    contact_email: program.contact_email || '',
    contact_phone: program.contact_phone || '',
    schedule_summary: program.schedule_summary || '',
    start_date: program.start_date || '',
    end_date: program.end_date || '',
    status,
    status_label: statusLabel(status),
    registration_required: program.registration_required !== false && program.registration_mode !== 'none',
    registration_mode: program.registration_mode || 'register',
    capacity: Number(program.capacity) || null,
    seats_remaining: seatsRemaining(program, seatsTaken),
    waitlist_enabled: program.waitlist_enabled !== false,
    approval_required: !!program.approval_required,
    intake_opens: program.intake_opens || '',
    intake_closes: program.intake_closes || '',
    featured: !!program.featured,
    home_order: Number(program.home_order) || 0,
    tags: Array.isArray(program.tags) ? program.tags : [],
  };
}

export function publicSession(session) {
  return {
    id: session.id,
    program: session.program || '',
    program_slug: session.program_slug || '',
    program_name: session.program_name || '',
    starts_at: session.starts_at || '',
    ends_at: session.ends_at || '',
    location_name: session.location_name || '',
    room: session.room || '',
    capacity: Number(session.capacity) || null,
    seats_remaining:
      Number(session.capacity) > 0
        ? Math.max(0, Number(session.capacity) - Number(session.seats_taken || 0))
        : null,
    is_cancelled: !!session.is_cancelled,
    note: session.note || '',
  };
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const ALBERTA_TZ = 'America/Edmonton';

// Alberta is Mountain Time: UTC-7 in winter, UTC-6 while daylight time runs
// (second Sunday in March to the first Sunday in November). Sessions are built
// with the offset spelled out, so 1:00 PM means 1:00 PM in Edmonton whatever the
// server's own clock is set to.
function albertaOffset(day) {
  const noon = new Date(`${day}T12:00:00Z`);
  const year = noon.getUTCFullYear();
  const march = new Date(Date.UTC(year, 2, 1));
  const dstStartDay = 1 + ((7 - march.getUTCDay()) % 7) + 7;
  const dstStart = Date.UTC(year, 2, dstStartDay, 9);
  const november = new Date(Date.UTC(year, 10, 1));
  const dstEndDay = 1 + ((7 - november.getUTCDay()) % 7);
  const dstEnd = Date.UTC(year, 10, dstEndDay, 8);
  const time = noon.getTime();
  return time >= dstStart && time < dstEnd ? '-06:00' : '-07:00';
}

// Turns a program's recurrence into dated sessions for the next `days` days.
// "weekly:tuesday,thursday" becomes one session each of those weekdays, using the
// program's own start and end times, never past its end date.
export function buildSessions(program, days = 90, now = Date.now()) {
  const recurrence = String(program?.recurrence || '').trim().toLowerCase();
  if (!recurrence.startsWith('weekly:')) return [];

  const wanted = recurrence
    .slice('weekly:'.length)
    .split(',')
    .map((day) => WEEKDAYS.indexOf(day.trim()))
    .filter((index) => index >= 0);
  if (!wanted.length) return [];

  const startTime = program.session_start_time || '13:00';
  const endTime = program.session_end_time || '15:00';
  const first = startOfDay(program.start_date) || now;
  const last = endOfDay(program.end_date);
  const horizon = now + days * 24 * 60 * 60 * 1000;
  const limit = Math.min(horizon, last || horizon);

  const sessions = [];
  const cursor = new Date(Math.max(first, startOfDay(new Date(now).toISOString().slice(0, 10)) || now));
  cursor.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= limit) {
    if (wanted.includes(cursor.getDay())) {
      const day = cursor.toISOString().slice(0, 10);
      const offset = albertaOffset(day);
      sessions.push({
        starts_at: new Date(`${day}T${startTime}:00${offset}`).toISOString(),
        ends_at: new Date(`${day}T${endTime}:00${offset}`).toISOString(),
        location_name: program.location_name || '',
        room: program.room || '',
        capacity: Number(program.capacity) || null,
        seats_taken: 0,
        is_cancelled: false,
        note: '',
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return sessions;
}

// The lines every program email needs, so each one names the program, the time and
// the place in the same words the page uses.
export function programDateLine(program, session) {
  const schedule = program?.schedule_summary || '';
  if (session?.starts_at) {
    const when = new Date(session.starts_at);
    const date = when.toLocaleDateString('en-CA', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: ALBERTA_TZ,
    });
    const time = when.toLocaleTimeString('en-CA', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: ALBERTA_TZ,
    });
    return schedule ? `${date} at ${time} · ${schedule}` : `${date} at ${time}`;
  }
  if (program?.start_date) {
    const from = new Date(`${program.start_date}T12:00:00Z`).toLocaleDateString('en-CA', {
      month: 'long',
      day: 'numeric',
      timeZone: ALBERTA_TZ,
    });
    const to = program.end_date
      ? ` to ${new Date(`${program.end_date}T12:00:00Z`).toLocaleDateString('en-CA', {
          month: 'long',
          day: 'numeric',
          timeZone: ALBERTA_TZ,
        })}`
      : '';
    return schedule ? `${schedule} · ${from}${to}` : `${from}${to}`;
  }
  return schedule || 'See the program page for dates';
}

export function programPlaceLine(program) {
  const parts = [program?.location_name, program?.room].filter(Boolean);
  return parts.join(', ') || 'Candora Society of Edmonton';
}

export function programLink(program) {
  const slug = program?.slug || '';
  return slug ? `${PUBLIC_SITE_URL}/programs/${slug}` : `${PUBLIC_SITE_URL}/programs`;
}

export function nextWaitlistPosition(registrations) {
  const taken = (registrations || [])
    .map((item) => Number(item.waitlist_position) || 0)
    .filter((value) => value > 0);
  return taken.length ? Math.max(...taken) + 1 : 1;
}