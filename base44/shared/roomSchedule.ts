// Room-based classroom schedules, class lists and check-ins.
// Classroom tablets are mounted in a physical room, so anything booked into that
// room — whichever program it belongs to — opens the room's check-in. Shared by
// the public kiosk API (service role) and nothing else on the client.

export const ROOMS = [
  { id: 'large_classroom', label: 'Large Classroom' },
  { id: 'small_classroom', label: 'Small Classroom' },
  { id: 'employment_classroom', label: 'Employment Classroom' },
  { id: 'echo_valley', label: 'Echo Valley' },
  { id: 'childminding', label: 'Childminding Room' },
];

// The childminding room belongs to one service only: its tablet follows the
// sessions the Childminding portal books, not the room's other bookings.
export const CHILDMINDING_ROOM = 'childminding';

export const ROOM_IDS = ROOMS.map((room) => room.id);
export const roomLabel = (id) => ROOMS.find((room) => room.id === id)?.label || '';

export const PROGRAM_LABELS = {
  ell: 'ELL',
  empoweru: 'EmpowerU',
  frn: 'FRN',
  phac: 'PHAC',
  community: 'Community Programs',
  digilit: 'Digital Literacy',
  workshop: 'Workshops',
  childminding: 'Childminding',
  other: 'Candora',
};

export const programLabel = (id) => PROGRAM_LABELS[id] || 'Candora';

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const minutesOf = (hhmm) => {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ''));
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

export const parseLocalDate = (value) => {
  const parts = String(value || '').slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

export const isoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// A one-off booking (no repeat) can safely be marked complete after it runs. A
// repeating class or a running term must stay on the calendar, so those are left
// alone — only that day's attendance is closed off.
const repeatsOn = (row, dateField, dateStr) => {
  const start = parseLocalDate(row[dateField]);
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

const withTimes = (row, { entity, dateField, name, program }) => {
  const start = minutesOf(row.start_time);
  const end = minutesOf(row.end_time);
  if (start === null || end === null || end <= start) return null;
  return {
    entity,
    id: row.id,
    name: String(name || '').trim() || programLabel(program),
    program,
    date: dateField === 'date' ? String(row.date || '').slice(0, 10) : String(row[dateField] || '').slice(0, 10),
    start,
    end,
    one_off: (row.recurrence_pattern || 'none') === 'none',
    status: row.status || '',
  };
};

// Everything running in one room on one date, in start order.
export async function roomSessions(base44, room, dateStr) {
  if (!ROOM_IDS.includes(room)) return [];
  const api = base44.asServiceRole.entities;

  // Childminding runs its own sessions from its portal, and this room is only
  // ever used for childminding — nothing else booked here opens its tablet.
  if (room === CHILDMINDING_ROOM) {
    const rows = await api.ChildmindingSession.filter({ date: dateStr }, 'start_time', 50).catch(() => []);
    return (rows || [])
      .filter((row) => !['cancelled', 'completed'].includes(row.status))
      .map((row) => withTimes(row, { entity: 'ChildmindingSession', dateField: 'date', name: row.title, program: 'childminding' }))
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);
  }

  const weekday = DAY_KEYS[(parseLocalDate(dateStr) || new Date()).getDay()];

  const [ell, frn, phac, community, digilit, workshops] = await Promise.all([
    api.ELLClass.filter({ status: 'active' }, '-created_date', 300).catch(() => []),
    api.FRNSession.filter({ room }, '-session_date', 500).catch(() => []),
    api.PHACSession.filter({ room }, '-session_date', 500).catch(() => []),
    api.CommunitySession.filter({ room }, '-session_date', 500).catch(() => []),
    api.DigiLitSession.filter({ room }, '-session_date', 500).catch(() => []),
    api.Workshop.filter({ room }, '-date', 500).catch(() => []),
  ]);

  const rows = [];

  for (const row of ell || []) {
    if (row.room !== room) continue;
    if (!(row.schedule_days || []).includes(weekday)) continue;
    if (row.start_date && dateStr < row.start_date) continue;
    if (row.end_date && dateStr > row.end_date) continue;
    const built = withTimes(row, { entity: 'ELLClass', dateField: 'start_date', name: row.name, program: 'ell' });
    if (built) rows.push({ ...built, date: dateStr, one_off: false });
  }

  const single = [
    { list: frn, entity: 'FRNSession', program: 'frn', name: (row) => row.program_name || row.location },
    { list: phac, entity: 'PHACSession', program: 'phac', name: (row) => row.program_name || row.location },
    { list: community, entity: 'CommunitySession', program: 'community', name: (row) => row.title || row.program_name },
    { list: digilit, entity: 'DigiLitSession', program: 'digilit', name: (row) => row.title },
    { list: workshops, entity: 'Workshop', program: 'workshop', name: (row) => row.title },
  ];

  for (const group of single) {
    for (const row of group.list || []) {
      if (row.status === 'cancelled') continue;
      if (!repeatsOn(row, group.entity === 'Workshop' ? 'date' : 'session_date', dateStr)) continue;
      const built = withTimes(row, {
        entity: group.entity,
        dateField: group.entity === 'Workshop' ? 'date' : 'session_date',
        name: group.name(row),
        program: group.program,
      });
      if (built) rows.push({ ...built, date: dateStr });
    }
  }

  return rows.sort((a, b) => a.start - b.start);
}

const fullName = (row) => {
  if (!row) return '';
  const joined = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  if (joined) return joined;
  if (row.participant_name) return row.participant_name;
  if (row.child_first_name || row.child_last_name) {
    return [row.child_first_name, row.child_last_name].filter(Boolean).join(' ').trim();
  }
  return row.name || row.full_name || '';
};

// Who is expected in this class, so people can tick themselves off the list.
export async function rosterFor(base44, session) {
  const api = base44.asServiceRole.entities;
  const people = [];
  const push = (id, name) => {
    const label = String(name || '').trim();
    if (id && label) people.push({ id, name: label });
  };

  try {
    if (session.entity === 'ELLClass') {
      const rows = await api.ELLLearner.filter({ assigned_class_id: session.id }, 'last_name', 300);
      for (const row of rows || []) push(row.id, fullName(row));
    } else if (session.entity === 'FRNSession') {
      const rows = await api.FRNReferral.filter({ program_name: session.name }, '-referral_date', 300);
      for (const row of rows || []) {
        if (['declined', 'withdrawn'].includes(row.status)) continue;
        push(row.participant_id, row.participant_name);
      }
    } else if (session.entity === 'PHACSession') {
      const rows = await api.PHACParticipant.filter({}, '-created_date', 300);
      for (const row of rows || []) push(row.id, fullName(row));
    } else if (session.entity === 'ChildmindingSession') {
      // The children booked into this session in the Childminding portal; the
      // parent dropping one off taps their child's name.
      const rows = await api.ChildmindingRecord.filter({ session_id: session.id }, 'child_first_name', 200);
      for (const row of rows || []) {
        const parent = row.parent_name || [row.parent_first_name, row.parent_last_name].filter(Boolean).join(' ');
        const child = row.child_first_name || '';
        push(row.id, [child, parent ? `(${parent})` : ''].filter(Boolean).join(' '));
      }
    } else if (session.entity === 'CommunitySession' || session.entity === 'DigiLitSession') {
      const isCommunity = session.entity === 'CommunitySession';
      const sessionRow = await (isCommunity ? api.CommunitySession : api.DigiLitSession).get(session.id);
      const ids = sessionRow?.registered_participant_ids || [];
      if (ids.length) {
        const peopleEntity = isCommunity ? api.CommunityParticipant : api.DigiLitParticipant;
        const rows = await peopleEntity.filter({}, '-created_date', 500);
        for (const row of rows || []) if (ids.includes(row.id)) push(row.id, fullName(row));
      }
    }
  } catch {
    return [];
  }

  return people.sort((a, b) => a.name.localeCompare(b.name));
}

const stamp = () => new Date().toISOString();
const uniqueId = () => `ci_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// Writes the person into the class's own attendance for that date, so the
// program portal shows them as present without anyone re-typing it.
export async function markCheckedIn(base44, session, person) {
  const api = base44.asServiceRole.entities;
  const dateStr = session.date;

  // A child dropped off: stamp their arrival on the record the Childminding
  // portal already holds, so the parent's hours start from this moment.
  if (session.entity === 'ChildmindingSession') {
    if (!person.id) return;
    const row = await api.ChildmindingRecord.get(person.id).catch(() => null);
    if (!row || row.check_in_time) return;
    const now = person.local_time || new Date().toTimeString().slice(0, 5);
    await api.ChildmindingRecord.update(person.id, { check_in_time: now });
    return;
  }

  if (session.entity === 'ELLClass') {
    const row = await api.ELLClass.get(session.id);
    const attendance = Array.isArray(row.attendance) ? [...row.attendance] : [];
    const index = attendance.findIndex((entry) => entry.date === dateStr);
    const statuses = { ...(attendance[index]?.statuses || {}) };
    if (person.id) statuses[person.id] = 'present';
    const entry = {
      id: attendance[index]?.id || uniqueId(),
      date: dateStr,
      statuses,
      recorded_by_name: 'Room tablet',
      recorded_date: stamp(),
    };
    if (index === -1) attendance.push(entry);
    else attendance[index] = entry;
    await api.ELLClass.update(session.id, { attendance });
    return;
  }

  if (session.entity === 'CommunitySession') {
    const row = await api.CommunitySession.get(session.id);
    const attended = Array.isArray(row.attended_participant_ids) ? [...row.attended_participant_ids] : [];
    if (person.id && !attended.includes(person.id)) {
      attended.push(person.id);
      await api.CommunitySession.update(session.id, { attended_participant_ids: attended });
    }
    return;
  }

  if (['FRNSession', 'PHACSession', 'DigiLitSession'].includes(session.entity)) {
    const entity = api[session.entity];
    const row = await entity.get(session.id);
    const attendance = Array.isArray(row.attendance) ? [...row.attendance] : [];
    const already = attendance.some((entry) => entry.date === dateStr && entry.participant_id === person.id);
    if (!already) {
      attendance.push({
        date: dateStr,
        participant_id: person.id || '',
        participant_name: person.name,
        status: 'present',
      });
      await entity.update(session.id, { attendance });
    }
  }
}

// Nothing left to sign in for: close the day out. One-off bookings are marked
// complete; a repeating class or a running term stays on the calendar.
export async function finishSession(base44, session) {
  const api = base44.asServiceRole.entities;
  if (!session?.entity || !session?.id || session.entity === 'ELLClass') return;
  const entity = api[session.entity];
  if (!entity) return;
  try {
    const row = await entity.get(session.id);
    if (!row || (row.recurrence_pattern || 'none') !== 'none') return;
    if (!row.status || ['cancelled', 'completed'].includes(row.status)) return;
    await entity.update(session.id, { status: 'completed' });
  } catch {
    /* the tablet closes either way */
  }
}