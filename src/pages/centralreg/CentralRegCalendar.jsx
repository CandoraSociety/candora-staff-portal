import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, format, addWeeks, addMonths, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROOM_OPTIONS, CALENDAR_SOURCES as SOURCES } from '@/lib/centralRegConstants';
import { DayRoomView, WeekRoomView } from '@/components/centralreg/RoomScheduleViews';
import DetailedDayView from '@/components/centralreg/DetailedDayView';

const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const toMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

let seq = 0;
// Room assignment — explicit room field when set, otherwise guessed from the location text.
const locationRoom = (location) => {
  const loc = (location || '').toLowerCase();
  if (loc.includes('large classroom')) return 'large_classroom';
  if (loc.includes('small classroom')) return 'small_classroom';
  if (loc.includes('employment')) return 'employment_classroom';
  return '';
};
const makeEvent = (source, title, date, startTime, endTime, location, facilitator, room) => ({
  id: `${source}-${seq++}`,
  source,
  title,
  date,
  startTime,
  endTime,
  location,
  facilitator,
  room: room || locationRoom(location) || '',
});

function expandWorkshop(w, monthStart, monthEnd) {
  if (!w.date || w.status === 'cancelled') return [];
  const base = parseLocalDate(w.date);
  const dates = [];
  const push = (d) => { if (d >= monthStart && d <= monthEnd) dates.push(d); };

  if (!w.recurrence_pattern || w.recurrence_pattern === 'none') {
    push(base);
  } else {
    const limit = w.recurrence_end_date ? parseLocalDate(w.recurrence_end_date) : monthEnd;
    let cursor = base;
    let guard = 0;
    while (cursor <= limit && guard < 400) {
      push(cursor);
      if (w.recurrence_pattern === 'weekly') cursor = addWeeks(cursor, 1);
      else if (w.recurrence_pattern === 'biweekly') cursor = addWeeks(cursor, 2);
      else if (w.recurrence_pattern === 'monthly') cursor = addMonths(cursor, 1);
      else break;
      guard++;
    }
  }
  return dates.map(d => makeEvent('pathways', w.title, d, w.start_time, w.end_time, w.location, w.facilitator_name, w.room));
}

// Session-style records (Community / PHAC / Digital Literacy / FRN) — single
// date, or expanded from a recurrence pattern onto the calendar.
function expandRecSession(source, s, monthStart, monthEnd, titleFn) {
  const base = parseLocalDate(s.session_date);
  if (!base) return [];
  const dates = [];
  const push = (d) => { if (d >= monthStart && d <= monthEnd) dates.push(d); };
  if (!s.recurrence_pattern || s.recurrence_pattern === 'none') {
    push(base);
  } else {
    const limit = s.recurrence_end_date ? parseLocalDate(s.recurrence_end_date) : monthEnd;
    let cursor = base;
    let guard = 0;
    while (cursor <= limit && guard < 400) {
      push(cursor);
      if (s.recurrence_pattern === 'weekly') cursor = addWeeks(cursor, 1);
      else if (s.recurrence_pattern === 'biweekly') cursor = addWeeks(cursor, 2);
      else if (s.recurrence_pattern === 'monthly') cursor = addMonths(cursor, 1);
      else break;
      guard++;
    }
  }
  return dates.map(d => makeEvent(source, titleFn(s), d, s.start_time, s.end_time, s.location, s.facilitator_name || s.facilitator, s.room));
}

function addSessionEvents(list, records, source, monthStart, monthEnd, titleFn) {
  (records || []).filter(s => s.status !== 'cancelled').forEach(s => {
    const d = parseLocalDate(s.session_date || s.date);
    if (!d || d < monthStart || d > monthEnd) return;
    list.push(makeEvent(source, titleFn(s), d, s.start_time, s.end_time, s.location, s.facilitator_name || s.facilitator || s.instructor_name, s.room));
  });
}

export default function CentralRegCalendar() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [view, setView] = useState('month'); // month | week | day
  const [sourceFilter, setSourceFilter] = useState([]);
  const [roomFilter, setRoomFilter] = useState([]);

  const workshopsQ = useQuery({ queryKey: ['centralreg-cal-workshops'], queryFn: () => base44.entities.Workshop.list() });
  const communityQ = useQuery({ queryKey: ['centralreg-cal-community'], queryFn: () => base44.entities.CommunitySession.list() });
  const phacQ = useQuery({ queryKey: ['centralreg-cal-phac'], queryFn: () => base44.entities.PHACSession.list() });
  const digilitQ = useQuery({ queryKey: ['centralreg-cal-digilit'], queryFn: () => base44.entities.DigiLitSession.list() });
  const childmindingQ = useQuery({ queryKey: ['centralreg-cal-childminding'], queryFn: () => base44.entities.ChildmindingSession.list() });
  const volunteerQ = useQuery({ queryKey: ['centralreg-cal-volunteer'], queryFn: () => base44.entities.VolunteerEvent.list() });
  const ellQ = useQuery({ queryKey: ['centralreg-cal-ell'], queryFn: () => base44.entities.ELLClass.list() });
  const empoweruQ = useQuery({ queryKey: ['centralreg-cal-empoweru'], queryFn: () => base44.entities.EmpowerUCohort.list() });
  const frnQ = useQuery({ queryKey: ['centralreg-cal-frn'], queryFn: () => base44.entities.FRNSession.list() });

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const events = useMemo(() => {
    const list = [];
    (workshopsQ.data || []).forEach(w => list.push(...expandWorkshop(w, monthStart, monthEnd)));
    (communityQ.data || []).filter(s => s.status !== 'cancelled').forEach(s => list.push(...expandRecSession('community', s, monthStart, monthEnd, x => x.title || x.program_name || 'Community Session')));
    (phacQ.data || []).filter(s => s.status !== 'cancelled').forEach(s => list.push(...expandRecSession('phac', s, monthStart, monthEnd, x => x.program_name || 'PHAC Session')));
    (digilitQ.data || []).filter(s => s.status !== 'cancelled').forEach(s => list.push(...expandRecSession('digilit', s, monthStart, monthEnd, x => x.title || 'Digital Literacy Session')));
    (frnQ.data || []).filter(s => s.status !== 'cancelled').forEach(s => list.push(...expandRecSession('frn', s, monthStart, monthEnd, x => x.program_name || 'FRN Session')));
    addSessionEvents(list, childmindingQ.data, 'childminding', monthStart, monthEnd, s => s.title || 'Childminding');
    addSessionEvents(list, volunteerQ.data, 'volunteer', monthStart, monthEnd, s => s.title || 'Volunteer Event');

    // ELL classes recur weekly on their scheduled days between start/end dates
    (ellQ.data || []).filter(c => c.status === 'active' && (c.schedule_days || []).length).forEach(cls => {
      const startBound = cls.start_date ? parseLocalDate(cls.start_date) : null;
      const endBound = cls.end_date ? parseLocalDate(cls.end_date) : null;
      eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach(d => {
        const dayName = format(d, 'eeee').toLowerCase();
        if (!(cls.schedule_days || []).includes(dayName)) return;
        if (startBound && d < startBound) return;
        if (endBound && d > endBound) return;
        list.push(makeEvent('ell', cls.name, d, cls.start_time, cls.end_time, cls.location, cls.instructor_name, cls.room));
      });
    });

    // EmpowerU cohorts — mark their start and end dates
    (empoweruQ.data || []).filter(c => c.status !== 'cancelled').forEach(c => {
      [['start_date', 'starts'], ['end_date', 'ends']].forEach(([field, verb]) => {
        const d = parseLocalDate(c[field]);
        if (d && d >= monthStart && d <= monthEnd) {
          list.push(makeEvent('empoweru', `${c.name} — ${verb}`, d, null, null, c.location, c.facilitator_name, c.room));
        }
      });
    });

    list.sort((a, b) => a.date - b.date || toMinutes(a.startTime) - toMinutes(b.startTime));
    return list;
  }, [workshopsQ.data, communityQ.data, phacQ.data, digilitQ.data, frnQ.data, childmindingQ.data, volunteerQ.data, ellQ.data, empoweruQ.data, monthStart, monthEnd]);

  const visible = useMemo(
    () => events.filter(e =>
      (!sourceFilter.length || sourceFilter.includes(e.source)) &&
      (!roomFilter.length || roomFilter.includes(e.room))
    ),
    [events, sourceFilter, roomFilter]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map();
    visible.forEach(e => {
      const k = format(e.date, 'yyyy-MM-dd');
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(e);
    });
    return map;
  }, [visible]);

  const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });
  const toggleSource = (key) => {
    setSourceFilter(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleRoom = (value) => {
    setRoomFilter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  // Rooms actually shown on the Month / Week views — when filtering, only the
  // selected rooms appear (stretched to fill the space).
  const shownRooms = roomFilter.length ? ROOM_OPTIONS.filter(r => roomFilter.includes(r.value)) : ROOM_OPTIONS;

  const goPrev = () => {
    if (view === 'month') { setMonth(m => startOfMonth(addMonths(m, -1))); return; }
    const n = view === 'week' ? addDays(selectedDay, -7) : addDays(selectedDay, -1);
    setSelectedDay(n); setMonth(startOfMonth(n));
  };
  const goNext = () => {
    if (view === 'month') { setMonth(m => startOfMonth(addMonths(m, 1))); return; }
    const n = view === 'week' ? addDays(selectedDay, 7) : addDays(selectedDay, 1);
    setSelectedDay(n); setMonth(startOfMonth(n));
  };
  const goToday = () => { const now = new Date(); setMonth(startOfMonth(now)); setSelectedDay(now); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Program &amp; Workshop Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">All programs, sessions and workshops across Candora in one calendar</p>
        </div>
        <div className="flex items-center gap-2">
          {(view === 'day' || view === 'detail') && (
            <Button variant="outline" size="sm" onClick={() => setView('month')}><ChevronLeft className="h-4 w-4" /> Month</Button>
          )}
          <div className="flex rounded-md border border-border overflow-hidden">
            {[['month', 'Month'], ['week', 'Week'], ['detail', 'Detail']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn('px-3 py-1.5 text-xs font-medium transition-colors', view === v ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground')}
              >
                {label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={goToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Source filter chips */}
      <div className="flex flex-wrap gap-2">
        {SOURCES.map(s => {
          const active = sourceFilter.includes(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggleSource(s.key)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors', active ? 'text-white border-transparent' : 'bg-card text-muted-foreground border-border hover:text-foreground')}
              style={active ? { backgroundColor: s.color } : undefined}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? 'rgba(255,255,255,0.8)' : s.color }} />
              {s.label}
            </button>
          );
        })}
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSourceFilter(SOURCES.map(s => s.key))}>Select all</Button>
        {sourceFilter.length > 0 && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSourceFilter([])}>Clear filters</Button>
        )}
      </div>

      {/* Room filter chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-muted-foreground">Rooms:</span>
        {ROOM_OPTIONS.map(r => {
          const active = roomFilter.includes(r.value);
          return (
            <button
              key={r.value}
              onClick={() => toggleRoom(r.value)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors', active ? 'text-white border-transparent' : 'bg-card text-muted-foreground border-border hover:text-foreground')}
              style={active ? { backgroundColor: r.color } : undefined}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? 'rgba(255,255,255,0.8)' : r.color }} />
              {r.label}
            </button>
          );
        })}
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setRoomFilter(ROOM_OPTIONS.map(r => r.value))}>Select all</Button>
        {roomFilter.length > 0 && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setRoomFilter([])}>Clear rooms</Button>
        )}
      </div>

      {/* Month grid */}
      {view === 'month' && (
      <Card>
        <CardContent className="p-4">
          <div className="text-center font-display font-bold text-lg mb-3">{format(month, 'MMMM yyyy')}</div>
          <div className="grid grid-cols-7 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map(d => {
              const dayEvents = eventsByDay.get(format(d, 'yyyy-MM-dd')) || [];
              const inMonth = isSameMonth(d, month);
              const isSel = isSameDay(d, selectedDay);
              const isToday = isSameDay(d, new Date());
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => { setSelectedDay(d); setView('day'); }}
                  className={cn(
                    'flex flex-col min-h-36 border rounded-md p-1 text-left align-top transition-colors',
                    inMonth ? 'bg-card' : 'bg-muted/40',
                    isSel ? 'border-primary ring-1 ring-primary' : 'border-foreground/30',
                    dayEvents.length ? 'hover:border-primary/50' : ''
                  )}
                >
                  <span className={cn('text-xs font-semibold px-1', inMonth ? 'text-foreground' : 'text-muted-foreground/50', isToday && 'bg-primary text-primary-foreground rounded-full px-1.5')}>
                    {format(d, 'd')}
                  </span>
                  {/* Vertical room stack — one row per selected room, each split into AM / PM halves so only the part of the day that is actually booked is highlighted. */}
                  <div className="flex flex-col gap-0.5 mt-1 flex-1 min-h-0">
                    {shownRooms.map(r => {
                      const matched = dayEvents.filter(e => e.room === r.value);
                      const am = matched.filter(e => e.startTime && toMinutes(e.startTime) < 720);
                      const pm = matched.filter(e => !e.startTime || toMinutes(e.startTime) >= 720);
                      return (
                        <div key={r.value} className="flex-1 flex gap-0.5 min-h-0">
                          {[['AM', am], ['PM', pm]].map(([half, list]) => (
                            <div
                              key={half}
                              title={`${r.label} ${half}: ${list.length ? list.map(e => `${e.startTime || ''} ${e.title}`).join(', ') : 'free'}`}
                              className={cn(
                                'flex-1 rounded flex items-center justify-center leading-none border overflow-hidden',
                                list.length ? 'text-white border-transparent' : 'text-muted-foreground/60 bg-muted/30 border-border/70'
                              )}
                              style={list.length ? { backgroundColor: r.color } : undefined}
                            >
                              <span className="text-[8px] font-bold">{list.length ? `${r.abbr} ${list.length}` : half}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                  {dayEvents.some(e => !e.room) && (
                    <div className="text-[9px] text-muted-foreground mt-0.5 px-0.5">+{dayEvents.filter(e => !e.room).length} no room</div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      )}

      {view === 'week' && (
        <Card>
          <CardContent className="p-4">
            <WeekRoomView weekStart={startOfWeek(selectedDay)} events={visible} rooms={shownRooms} onOpenDay={(d) => { setSelectedDay(d); setView('day'); }} />
          </CardContent>
        </Card>
      )}

      {view === 'day' && <DayRoomView date={selectedDay} events={visible} />}
      {view === 'detail' && <DetailedDayView date={selectedDay} events={visible} />}
    </div>
  );
}