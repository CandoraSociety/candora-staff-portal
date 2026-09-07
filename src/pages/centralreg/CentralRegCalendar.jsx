import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, format, addWeeks, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, MapPin, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROOM_OPTIONS } from '@/lib/centralRegConstants';

const SOURCES = [
  { key: 'pathways', label: 'Pathways Workshops', color: '#dc2626' },
  { key: 'community', label: 'Community Programs', color: '#16a34a' },
  { key: 'phac', label: 'PHAC Programs', color: '#0ea5e9' },
  { key: 'digilit', label: 'Digital Literacy', color: '#ca8a04' },
  { key: 'ell', label: 'ELL Classes', color: '#7c3aed' },
  { key: 'childminding', label: 'Childminding', color: '#ec4899' },
  { key: 'volunteer', label: 'Volunteer Events', color: '#65a30d' },
  { key: 'empoweru', label: 'EmpowerU', color: '#d97706' },
];

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

  const isLoading = [workshopsQ, communityQ, phacQ, digilitQ, childmindingQ, volunteerQ, ellQ, empoweruQ].some(q => q.isLoading);
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const events = useMemo(() => {
    const list = [];
    (workshopsQ.data || []).forEach(w => list.push(...expandWorkshop(w, monthStart, monthEnd)));
    addSessionEvents(list, communityQ.data, 'community', monthStart, monthEnd, s => s.title || s.program_name || 'Community Session');
    addSessionEvents(list, phacQ.data, 'phac', monthStart, monthEnd, s => s.program_name || 'PHAC Session');
    addSessionEvents(list, digilitQ.data, 'digilit', monthStart, monthEnd, s => s.title || 'Digital Literacy Session');
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
  }, [workshopsQ.data, communityQ.data, phacQ.data, digilitQ.data, childmindingQ.data, volunteerQ.data, ellQ.data, empoweruQ.data, monthStart, monthEnd]);

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
  const selectedEvents = eventsByDay.get(format(selectedDay, 'yyyy-MM-dd')) || [];

  // Selected-day events split into room sections (plus a bucket for unassigned ones)
  const roomGroups = useMemo(() => {
    const groups = [];
    ROOM_OPTIONS.forEach(r => {
      const evs = selectedEvents.filter(e => e.room === r.value);
      if (evs.length) groups.push({ key: r.value, label: r.label, color: r.color, events: evs });
    });
    const unassigned = selectedEvents.filter(e => !e.room);
    if (unassigned.length) groups.push({ key: 'unassigned', label: 'No room assigned', color: '#94a3b8', events: unassigned });
    return groups;
  }, [selectedEvents]);

  const toggleSource = (key) => {
    setSourceFilter(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleRoom = (value) => {
    setRoomFilter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Program &amp; Workshop Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">All programs, sessions and workshops across Candora in one calendar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => { setMonth(m => startOfMonth(addMonths(m, -1))); }}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => { const now = new Date(); setMonth(startOfMonth(now)); setSelectedDay(now); }}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => { setMonth(m => startOfMonth(addMonths(m, 1))); }}><ChevronRight className="h-4 w-4" /></Button>
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
        {roomFilter.length > 0 && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setRoomFilter([])}>Clear rooms</Button>
        )}
      </div>

      {/* Month grid */}
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
                  onClick={() => setSelectedDay(d)}
                  className={cn(
                    'flex flex-col min-h-28 border rounded-md p-1 text-left align-top transition-colors',
                    inMonth ? 'bg-card' : 'bg-muted/40',
                    isSel ? 'border-primary ring-1 ring-primary' : 'border-border',
                    dayEvents.length ? 'hover:border-primary/50' : ''
                  )}
                >
                  <span className={cn('text-xs font-semibold px-1', inMonth ? 'text-foreground' : 'text-muted-foreground/50', isToday && 'bg-primary text-primary-foreground rounded-full px-1.5')}>
                    {format(d, 'd')}
                  </span>
                  {/* Fixed room quadrants — same position in every date cell, filling the whole cell so you can see at a glance whether a room is booked or free */}
                  <div className="grid grid-cols-2 grid-rows-2 gap-0.5 mt-1 flex-1 min-h-0">
                    {ROOM_OPTIONS.map(r => {
                      const count = dayEvents.filter(e => e.room === r.value).length;
                      return (
                        <div
                          key={r.value}
                          title={count > 0 ? `${r.label}: ${count} session${count > 1 ? 's' : ''}` : `${r.label}: available`}
                          className={cn(
                            'rounded flex flex-col items-center justify-center leading-none border overflow-hidden',
                            count > 0 ? 'text-white border-transparent' : 'text-muted-foreground/60 bg-muted/30 border-border/70'
                          )}
                          style={count > 0 ? { backgroundColor: r.color } : undefined}
                        >
                          <span className="text-[10px] font-bold">{r.abbr}</span>
                          {count > 0
                            ? <span className="text-[9px] opacity-90 mt-0.5">{count} booked</span>
                            : <span className="text-[9px] opacity-70 mt-0.5">free</span>}
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

      {/* Selected day detail */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-3">{format(selectedDay, 'EEEE, MMMM d, yyyy')}</h3>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading events...</p> :
            selectedEvents.length === 0 ? <p className="text-sm text-muted-foreground">No programs or workshops scheduled for this day.</p> :
            <div className="space-y-4">
              {roomGroups.map(g => (
                <div key={g.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                    <p className="text-sm font-semibold" style={{ color: g.color }}>{g.label}</p>
                    <span className="text-xs text-muted-foreground">({g.events.length})</span>
                  </div>
                  <div className="space-y-2">
                    {g.events.map(e => {
                      const s = SOURCES.find(x => x.key === e.source);
                      return (
                        <div key={e.id} className="flex items-start gap-3 p-2 rounded-lg border border-border">
                          <span className="mt-1 h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s?.color }} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm text-foreground">{e.title}</p>
                              <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: s?.color }}>{s?.label}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                              {(e.startTime || e.endTime) && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{e.startTime || ''}{e.startTime && e.endTime ? '–' : ''}{e.endTime || ''}</p>}
                              {e.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</p>}
                              {e.facilitator && <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{e.facilitator}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>}
        </CardContent>
      </Card>
    </div>
  );
}