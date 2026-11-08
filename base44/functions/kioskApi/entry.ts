import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  ROOM_IDS,
  isoDate,
  roomSessions,
  rosterFor,
  markCheckedIn,
  finishSession,
} from '../../shared/roomSchedule.ts';

// Customer-facing kiosk endpoint. Public: the tablet has no staff sign-in, so a
// station id + access code is what proves which counter or classroom this screen
// belongs to. Nothing else is exposed — only that station's open prompt and its
// own answers.

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

const stationSummary = (station) => ({
  id: station.id,
  name: station.name,
  access_code: station.access_code,
  program: station.program || 'reception',
  room: station.room || '',
});

/* ---------------------------------------------------------------------------
   Automatic room check-in.
   A tablet in a classroom opens its check-in 30 minutes before anything starts
   in that room and closes it 10 minutes after the scheduled end, whichever
   program the class belongs to. The tablet sends its own local date and clock
   time, so the schedule is read in the room's time, not UTC.
--------------------------------------------------------------------------- */

const AUTO_SENDERS = ['Room schedule', 'Automatic schedule'];
const AUTO_SENDER = 'Room schedule';
const OPEN_BEFORE_MIN = 30;
const CLOSE_AFTER_MIN = 10;
const REPEAT_COOLDOWN_MS = 5 * 60 * 1000;
const RESYNC_MS = 60 * 1000;

const isAuto = (prompt) => AUTO_SENDERS.includes(prompt.sent_by_name);
const isLive = (prompt) => prompt.status === 'sent' || prompt.status === 'opened';

const sessionOf = (prompt) => ({
  entity: prompt.session_entity,
  id: prompt.session_id,
  name: prompt.course_name,
  date: prompt.session_date,
  program: prompt.program,
});

async function syncRoomPrompt(base44, station, localDate, localMinutes) {
  if (!ROOM_IDS.includes(station.room)) return;

  const api = base44.asServiceRole.entities;
  const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(code(localDate)) ? code(localDate) : isoDate(new Date());
  const nowMinutes = Number(localMinutes);
  if (!Number.isFinite(nowMinutes)) return;

  const sessions = await roomSessions(base44, station.room, dateStr);
  const open =
    sessions.find((row) => nowMinutes >= row.start - OPEN_BEFORE_MIN && nowMinutes <= row.end + CLOSE_AFTER_MIN) || null;

  const recent = (await api.KioskPrompt.filter({ station_id: station.id }, '-created_date', 40)) || [];
  const live = recent.filter(isLive);
  const liveAuto = live.filter(isAuto);

  // Nothing running in this room any more: take the check-in down and close the
  // day out on the session itself.
  if (!open) {
    for (const row of liveAuto) {
      await api.KioskPrompt.update(row.id, { status: 'dismissed' });
      if (row.session_entity && row.session_id) await finishSession(base44, sessionOf(row));
    }
    return;
  }

  // The same class is already waiting on this tablet.
  if (liveAuto.some((row) => row.session_id === open.id && row.session_date === dateStr)) return;

  // Never stomp on something a staff member sent by hand.
  if (live.some((row) => !isAuto(row))) return;

  // Do not reopen the instant someone backs out: wait a few minutes.
  const previous = recent.find(
    (row) => isAuto(row) && row.session_id === open.id && row.session_date === dateStr,
  );
  if (previous) {
    const stamp = new Date(previous.updated_date || previous.created_date || 0).getTime();
    if (Date.now() - stamp < REPEAT_COOLDOWN_MS) return;
  }

  for (const row of liveAuto) {
    await api.KioskPrompt.update(row.id, { status: 'dismissed' });
  }

  await api.KioskPrompt.create({
    station_id: station.id,
    station_name: station.name,
    program: open.program,
    course_name: open.name,
    session_entity: open.entity,
    session_id: open.id,
    session_date: dateStr,
    kind: 'self_registration',
    title: `${open.name} check-in`,
    message: `Touch the screen to check in for ${open.name}.`,
    status: 'sent',
    sent_by_name: AUTO_SENDER,
    checkins: [],
  });
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'pair') {
      if (!code(body.access_code)) {
        return Response.json({ error: 'Enter the code shown in the Central Registration portal.' }, { status: 400 });
      }
      const matches = await base44.asServiceRole.entities.KioskStation.filter({ is_active: true }, '-created_date', 200);
      const station = (matches || []).find((row) => code(row.access_code).toLowerCase() === code(body.access_code).toLowerCase());
      if (!station) {
        return Response.json({ error: 'That code is not recognised. Check the code in the portal.' }, { status: 404 });
      }
      await base44.asServiceRole.entities.KioskStation.update(station.id, { last_seen: new Date().toISOString() });
      return Response.json({ station: stationSummary(station), brand: await brand(base44) });
    }

    // A tablet is a permanent fixture: it opens straight onto the welcome screen
    // and picks up its station on its own. ?room= pins it to the tablet mounted in
    // that room, ?program= to the front desk, ?code= to one specific station.
    if (action === 'station') {
      const wantedProgram = code(body.program);
      const wantedRoom = code(body.room);
      const rows = await base44.asServiceRole.entities.KioskStation.filter({ is_active: true }, '-created_date', 200);
      const active = (rows || []).filter((row) => {
        if (wantedRoom) return row.room === wantedRoom;
        if (!wantedProgram) return true;
        return (row.program || 'reception') === wantedProgram && !row.room;
      });
      const wanted = code(body.access_code).toLowerCase();
      const match = wanted
        ? active.find((row) => code(row.access_code).toLowerCase() === wanted)
        : (active.length === 1 ? active[0] : null);
      if (!match) {
        return Response.json(
          {
            error: wantedRoom
              ? 'No tablet is set up for this room yet.'
              : active.length
                ? 'More than one tablet is set up for this screen.'
                : 'No tablet is set up yet.',
          },
          { status: 404 },
        );
      }
      await base44.asServiceRole.entities.KioskStation.update(match.id, { last_seen: new Date().toISOString() });
      return Response.json({ station: stationSummary(match), brand: await brand(base44) });
    }

    const station = await stationFor(base44, body.station_id, body.access_code);
    if (!station) {
      return Response.json({ error: 'This tablet is no longer connected. Ask the front desk for a new code.' }, { status: 401 });
    }

    if (action === 'poll') {
      // Check in roughly once a minute so the portal can show a connected
      // indicator without a write on every poll.
      const lastSeen = station.last_seen ? new Date(station.last_seen).getTime() : 0;
      if (Date.now() - lastSeen > 55000) {
        await base44.asServiceRole.entities.KioskStation.update(station.id, { last_seen: new Date().toISOString() });
      }

      // Classroom tablets follow the room's schedule: check once a minute, not on
      // every three-second poll.
      const lastSyncKey = station.id;
      const last = lastSyncAt.get(lastSyncKey) || 0;
      if (station.room && Date.now() - last > RESYNC_MS) {
        lastSyncAt.set(lastSyncKey, Date.now());
        await syncRoomPrompt(base44, station, body.local_date, body.local_minutes);
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

    // Who is expected in the class the tablet is signing people in for.
    if (action === 'roster') {
      const prompt = await promptFor(base44, station, body.prompt_id);
      if (!prompt) return Response.json({ error: 'That check-in has closed.' }, { status: 404 });
      if (!prompt.session_entity) return Response.json({ people: [] });
      const people = await rosterFor(base44, sessionOf(prompt));
      return Response.json({ people });
    }

    // Someone ticked themselves off the class list — or was not on it.
    if (action === 'check_in') {
      const prompt = await promptFor(base44, station, body.prompt_id);
      if (!prompt) return Response.json({ error: 'That check-in has closed.' }, { status: 404 });
      if (!prompt.session_entity) return Response.json({ error: 'This tablet is not checking anyone in.' }, { status: 400 });

      const session = sessionOf(prompt);
      const person = body.person || {};
      const pickedId = code(person.participant_id);
      let entry;

      if (pickedId) {
        const people = await rosterFor(base44, session);
        const found = people.find((row) => row.id === pickedId);
        if (!found) return Response.json({ error: 'That name is not on this class list.' }, { status: 400 });
        entry = { id: found.id, name: found.name, at: new Date().toISOString() };
      } else {
        const name = [code(person.first_name), code(person.last_name)].filter(Boolean).join(' ');
        if (!name) return Response.json({ error: 'Please enter your name.' }, { status: 400 });
        entry = {
          id: '',
          name,
          contact: code(person.contact).slice(0, 200),
          walk_in: true,
          at: new Date().toISOString(),
        };
      }

      const already = (prompt.checkins || []).some(
        (row) => (entry.id && row.id === entry.id) || (!entry.id && row.name === entry.name && row.walk_in),
      );

      await markCheckedIn(base44, session, { id: entry.id, name: entry.name, local_time: code(body.local_time) });

      const checkins = already ? prompt.checkins || [] : [...(prompt.checkins || []), entry];
      const updated = await base44.asServiceRole.entities.KioskPrompt.update(prompt.id, { checkins });
      return Response.json({ prompt: updated, entry, already });
    }

    if (action === 'respond' || action === 'close') {
      const prompt = await promptFor(base44, station, body.prompt_id);
      if (!prompt) return Response.json({ error: 'That prompt is no longer available.' }, { status: 404 });

      if (action === 'close') {
        const updated = await base44.asServiceRole.entities.KioskPrompt.update(prompt.id, { status: 'dismissed' });
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
        const details = {};
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

      const updated = await base44.asServiceRole.entities.KioskPrompt.update(prompt.id, update);
      return Response.json({ prompt: updated });
    }

    return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

const lastSyncAt = new Map();

async function promptFor(base44, station, promptId) {
  if (!promptId) return null;
  try {
    const prompt = await base44.asServiceRole.entities.KioskPrompt.get(promptId);
    if (!prompt || prompt.station_id !== station.id) return null;
    if (!isLive(prompt)) return null;
    return prompt;
  } catch {
    return null;
  }
}