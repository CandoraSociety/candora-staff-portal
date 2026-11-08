import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Customer-facing kiosk endpoint. Public: the tablet has no staff sign-in, so a
// station id + access code is what proves which counter this screen belongs to.
// Nothing else is exposed — only that station's open prompt and its own answers.

const code = (value) => String(value ?? '').trim();

// The fields the tablet's client information form collects — the same set
// reception enters when registering someone at the front desk.
const REGISTRATION_FIELDS = [
  'first_name', 'last_name', 'date_of_birth', 'gender', 'marital_status', 'phone', 'email',
  'address', 'city', 'postal_code', 'preferred_language', 'additional_languages',
  'dependants_count', 'dependants_detail', 'indigenous_first_nations', 'newcomer', 'senior',
  'youth_under_25', 'english_proficiency', 'english_proficiency_notes',
  'emergency_contact_name', 'emergency_contact_phone', 'reason_for_accessing',
  'reason_for_accessing_other', 'identified_needs', 'notes',
];

async function stationFor(base44, stationId, accessCode) {
  if (!stationId || !accessCode) return null;
  try {
    const station = await base44.asServiceRole.entities.KioskStation.get(stationId);
    if (!station || station.is_active === false) return null;
    if (code(station.access_code).toLowerCase() !== code(accessCode).toLowerCase()) return null;
    return station;
  } catch {
    return null;
  }
}

async function brand(base44) {
  const fallback = { name: 'Candora', logo_url: '', primary_color: '#f5be19', secondary_color: '#0f1f6b' };
  try {
    const rows = await base44.asServiceRole.entities.OrgSettings.filter({}, '-created_date', 1);
    const settings = rows?.[0];
    if (!settings) return fallback;
    return {
      name: settings.org_name || fallback.name,
      logo_url: settings.logo_url || '',
      primary_color: settings.primary_color || fallback.primary_color,
      secondary_color: settings.secondary_color || fallback.secondary_color,
    };
  } catch {
    return fallback;
  }
}

const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/* ---------------------------------------------------------------------------
   Automatic classroom check-in.
   A classroom tablet opens the sign-in form 30 minutes before a scheduled class
   and closes it 10 minutes after the class ends. The tablet sends its own local
   date and clock time, so the schedule is read in the room's time, not UTC.
--------------------------------------------------------------------------- */

const AUTO_SENDER = 'Automatic schedule';
const OPEN_BEFORE_MIN = 30;
const CLOSE_AFTER_MIN = 10;
const REPEAT_COOLDOWN_MS = 5 * 60 * 1000;
const RESYNC_MS = 60 * 1000;
const PROGRAM_LABEL: Record<string, string> = { ell: 'ELL', empoweru: 'EmpowerU', frn: 'FRN' };
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const lastSync = new Map<string, number>();

const minutesOf = (hhmm) => {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ''));
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const parseLocalDate = (value) => {
  const parts = String(value || '').slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

const isoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// FRN sessions repeat from their base date until the repeat-until date.
const occursOn = (row, dateStr) => {
  const start = parseLocalDate(row.session_date);
  const target = parseLocalDate(dateStr);
  if (!start || !target || target.getTime() < start.getTime()) return false;
  const until = parseLocalDate(row.recurrence_end_date);
  if (until && target.getTime() > until.getTime()) return false;
  const pattern = row.recurrence_pattern || 'none';
  if (pattern === 'none') return isoDate(start) === dateStr;
  if (pattern === 'monthly') return start.getDate() === target.getDate();
  const step = pattern === 'biweekly' ? 14 : 7;
  const days = Math.round((target.getTime() - start.getTime()) / 86400000);
  return days % step === 0;
};

// The classes that actually run on this date, as start/end minutes after midnight.
async function sessionsOnDate(base44, station, dateStr) {
  const program = station.program || 'reception';
  const withTimes = (row, course) => {
    const start = minutesOf(row.start_time);
    const end = minutesOf(row.end_time);
    if (start === null || end === null) return null;
    return { course, start, end };
  };

  if (program === 'ell') {
    const rows = await base44.asServiceRole.entities.ELLClass.filter({ status: 'active' }, '-created_date', 200);
    const weekday = DAY_KEYS[parseLocalDate(dateStr).getDay()];
    return (rows || [])
      .filter(
        (row) =>
          (row.schedule_days || []).includes(weekday) &&
          (!row.start_date || dateStr >= row.start_date) &&
          (!row.end_date || dateStr <= row.end_date),
      )
      .map((row) => withTimes(row, row.name))
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);
  }

  if (program === 'frn') {
    const rows = await base44.asServiceRole.entities.FRNSession.filter({}, '-session_date', 500);
    return (rows || [])
      .filter((row) => row.status !== 'cancelled' && occursOn(row, dateStr))
      .map((row) => withTimes(row, row.program_name || 'FRN session'))
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);
  }

  // EmpowerU cohorts carry only a start and end date, no class times, so there is
  // nothing to open automatically for them.
  return [];
}

async function syncScheduledPrompt(base44, station, localDate, localMinutes) {
  const program = station.program || 'reception';
  if (!PROGRAM_LABEL[program]) return;

  const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(code(localDate)) ? code(localDate) : isoDate(new Date());
  const nowMinutes = Number(localMinutes);
  if (!Number.isFinite(nowMinutes)) return;

  const sessions = await sessionsOnDate(base44, station, dateStr);
  const openSession =
    sessions.find((row) => nowMinutes >= row.start - OPEN_BEFORE_MIN && nowMinutes <= row.end + CLOSE_AFTER_MIN) || null;

  const recent = await base44.asServiceRole.entities.KioskPrompt.filter({ station_id: station.id }, '-created_date', 60);
  const auto = (recent || []).filter((row) => row.sent_by_name === AUTO_SENDER);
  const liveAuto = auto.filter((row) => row.status === 'sent' || row.status === 'opened');

  if (!openSession) {
    for (const row of liveAuto) {
      await base44.asServiceRole.entities.KioskPrompt.update(row.id, { status: 'dismissed' });
    }
    return;
  }

  // A form is already waiting on the tablet for this class — leave it alone.
  if (liveAuto.some((row) => row.course_name === openSession.course)) return;

  // Never stomp on something a staff member sent by hand.
  const staffLive = (recent || []).some(
    (row) => row.sent_by_name !== AUTO_SENDER && (row.status === 'sent' || row.status === 'opened'),
  );
  if (staffLive) return;

  // Do not respawn the form the instant someone backs out: wait a few minutes.
  const last = auto.find((row) => row.course_name === openSession.course);
  if (last) {
    const stamp = new Date(last.updated_date || last.created_date || 0).getTime();
    if (Date.now() - stamp < REPEAT_COOLDOWN_MS) return;
  }

  for (const row of liveAuto) {
    await base44.asServiceRole.entities.KioskPrompt.update(row.id, { status: 'dismissed' });
  }

  const label = PROGRAM_LABEL[program];
  await base44.asServiceRole.entities.KioskPrompt.create({
    station_id: station.id,
    station_name: station.name,
    program,
    course_name: openSession.course,
    kind: 'self_registration',
    title: `${openSession.course} sign-in`,
    message: `Fill in your details so we can register you for ${openSession.course}. A staff member will go over them with you.`,
    status: 'sent',
    sent_by_name: AUTO_SENDER,
  });
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'pair') {
      if (!code(body.access_code)) {
        return Response.json({ error: 'Enter the code shown in the reception portal.' }, { status: 400 });
      }
      const matches = await base44.asServiceRole.entities.KioskStation.filter({ is_active: true }, '-created_date', 200);
      const station = (matches || []).find((row) => code(row.access_code).toLowerCase() === code(body.access_code).toLowerCase());
      if (!station) {
        return Response.json({ error: 'That code is not recognised. Check the code in the reception portal.' }, { status: 404 });
      }
      await base44.asServiceRole.entities.KioskStation.update(station.id, { last_seen: new Date().toISOString() });
      return Response.json({
        station: {
          id: station.id,
          name: station.name,
          access_code: station.access_code,
          program: station.program || 'reception',
        },
        brand: await brand(base44),
      });
    }

    // A tablet is a permanent fixture: it opens straight onto the welcome screen
    // and picks up its station on its own. ?program= narrows it to one portal's
    // tablets, and ?code= pins it to one station when a program has several.
    if (action === 'station') {
      const wantedProgram = code(body.program);
      const rows = await base44.asServiceRole.entities.KioskStation.filter({ is_active: true }, '-created_date', 200);
      const active = (rows || []).filter(
        (row) => !wantedProgram || (row.program || 'reception') === wantedProgram,
      );
      const wanted = code(body.access_code).toLowerCase();
      const match = wanted
        ? active.find((row) => code(row.access_code).toLowerCase() === wanted)
        : (active.length === 1 ? active[0] : null);
      if (!match) {
        return Response.json(
          { error: active.length ? 'More than one tablet is set up for this screen.' : 'No tablet is set up yet.' },
          { status: 404 },
        );
      }
      await base44.asServiceRole.entities.KioskStation.update(match.id, { last_seen: new Date().toISOString() });
      return Response.json({
        station: {
          id: match.id,
          name: match.name,
          access_code: match.access_code,
          program: match.program || 'reception',
        },
        brand: await brand(base44),
      });
    }

    const station = await stationFor(base44, body.station_id, body.access_code);
    if (!station) {
      return Response.json({ error: 'This tablet is no longer connected. Ask reception for a new code.' }, { status: 401 });
    }

    if (action === 'poll') {
      // Check in roughly once a minute so the reception portal can show a
      // connected indicator without a write on every poll.
      const lastSeen = station.last_seen ? new Date(station.last_seen).getTime() : 0;
      if (Date.now() - lastSeen > 55000) {
        await base44.asServiceRole.entities.KioskStation.update(station.id, { last_seen: new Date().toISOString() });
      }

      // Classroom tablets follow the class schedule: check once a minute, not on
      // every three-second poll.
      const program = station.program || 'reception';
      if (program !== 'reception') {
        const last = lastSync.get(station.id) || 0;
        if (Date.now() - last > RESYNC_MS) {
          lastSync.set(station.id, Date.now());
          await syncScheduledPrompt(base44, station, body.local_date, body.local_minutes);
        }
      }

      const open = await base44.asServiceRole.entities.KioskPrompt.filter(
        { station_id: station.id, status: { $in: ['sent', 'opened'] } },
        '-created_date',
        1,
      );
      let prompt = open?.[0] || null;
      if (prompt && prompt.status === 'sent') {
        prompt = await base44.asServiceRole.entities.KioskPrompt.update(prompt.id, {
          status: 'opened',
          viewed_at: new Date().toISOString(),
        });
      }
      return Response.json({ prompt, brand: await brand(base44) });
    }

    if (action === 'respond' || action === 'close') {
      const promptId = body.prompt_id;
      if (!promptId) return Response.json({ error: 'Missing prompt.' }, { status: 400 });
      let prompt;
      try {
        prompt = await base44.asServiceRole.entities.KioskPrompt.get(promptId);
      } catch {
        prompt = null;
      }
      if (!prompt || prompt.station_id !== station.id) {
        return Response.json({ error: 'That prompt is no longer available.' }, { status: 404 });
      }

      if (action === 'close') {
        const updated = await base44.asServiceRole.entities.KioskPrompt.update(promptId, { status: 'dismissed' });
        return Response.json({ prompt: updated });
      }

      const response = body.response || {};
      const update = {
        status: 'submitted',
        responded_at: new Date().toISOString(),
        response_name: code(response.name) || null,
        response_email: code(response.email) || null,
        response_phone: code(response.phone) || null,
        response_notes: code(response.notes) || null,
      };
      const amount = num(response.amount);
      if (amount !== null) update.response_amount = amount;
      if (response.recurring !== undefined) update.response_recurring = response.recurring === true;
      const total = num(response.total);
      if (total !== null) update.response_total = total;
      if (Array.isArray(response.items)) {
        update.response_items = response.items
          .filter((item) => item && item.name)
          .map((item) => ({ name: String(item.name), price: num(item.price) || 0, quantity: num(item.quantity) || 1 }));
      }

      // Someone arriving for help at the resource centre types their own
      // details on the tablet. This deliberately does NOT create a client file:
      // the details go back to reception, who checks them (and looks for an
      // existing file) before anything is added to the Central Database.
      if (prompt.kind === 'self_registration') {
        const person = response.person || {};
        const details: Record<string, unknown> = {};
        for (const field of REGISTRATION_FIELDS) {
          const value = person[field];
          if (value === undefined || value === null || value === '') continue;
          if (typeof value === 'boolean' || typeof value === 'number') {
            details[field] = value;
          } else {
            details[field] = code(value).slice(0, 500);
          }
        }
        update.response_details = details;
        update.response_name = [code(details.first_name), code(details.last_name)].filter(Boolean).join(' ');
        update.response_phone = code(details.phone) || null;
        update.response_email = code(details.email) || null;
        update.response_notes = code(details.identified_needs) || null;
      }

      const updated = await base44.asServiceRole.entities.KioskPrompt.update(promptId, update);
      return Response.json({ prompt: updated });
    }

    return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}