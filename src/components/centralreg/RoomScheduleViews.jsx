import React from 'react';
import { format, isSameDay, eachDayOfInterval, addDays } from 'date-fns';
import { Clock, MapPin, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ROOM_OPTIONS, CALENDAR_SOURCES } from '@/lib/centralRegConstants';

const toMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const byTime = (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime);

function EventDetailRow({ e }) {
  const s = CALENDAR_SOURCES.find(x => x.key === e.source);
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg border border-border">
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
}

function RoomBlock({ room, events }) {
  return (
    <Card className="overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: room.color }}>
        <p className="text-sm font-semibold text-white">{room.label}</p>
        <span className="text-xs font-medium text-white/90">{events.length ? `${events.length} booked` : 'Available'}</span>
      </div>
      <CardContent className="p-3 space-y-2">
        {events.length === 0
          ? <p className="text-sm text-muted-foreground py-3 text-center">Room is free all day</p>
          : events.map(e => <EventDetailRow key={e.id} e={e} />)}
      </CardContent>
    </Card>
  );
}

export function DayRoomView({ date, events }) {
  const dayEvents = events.filter(e => isSameDay(e.date, date)).sort(byTime);
  const unassigned = dayEvents.filter(e => !e.room);
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-heading font-bold text-foreground">{format(date, 'EEEE, MMMM d, yyyy')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{dayEvents.length} session{dayEvents.length === 1 ? '' : 's'} scheduled</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ROOM_OPTIONS.map(r => (
          <RoomBlock key={r.value} room={r} events={dayEvents.filter(e => e.room === r.value)} />
        ))}
      </div>
      {unassigned.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-3 py-2 bg-muted flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">No room assigned</p>
            <span className="text-xs font-medium text-muted-foreground">{unassigned.length}</span>
          </div>
          <CardContent className="p-3 space-y-2">
            {unassigned.map(e => <EventDetailRow key={e.id} e={e} />)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function WeekRoomView({ weekStart, events, rooms = ROOM_OPTIONS, onOpenDay }) {
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  const rows = [
    ...rooms.map(r => ({ label: r.label, color: r.color, value: r.value })),
    { label: 'No room', color: '#94a3b8', value: '' },
  ];
  return (
    <div>
      <div className="text-center font-display font-bold text-lg mb-3">Week of {format(weekStart, 'MMMM d, yyyy')}</div>
      <div className="overflow-x-auto">
        <div className="min-w-[950px] space-y-1">
          <div className="grid grid-cols-8 gap-1">
            <div />
            {days.map(d => (
              <button
                key={d.toISOString()}
                onClick={() => onOpenDay?.(d)}
                className={cn('rounded py-1.5 text-center text-xs font-semibold transition-colors', isSameDay(d, new Date()) ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-accent')}
              >
                {format(d, 'EEE d')}
              </button>
            ))}
          </div>
          {rows.map(r => (
            <div key={r.label} className="grid grid-cols-8 gap-1">
              <div className="flex items-center justify-end pr-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap" style={{ color: r.color }}>
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />{r.label}
                </span>
              </div>
              {days.map(d => {
                const evs = events.filter(e => isSameDay(e.date, d) && (e.room || '') === r.value).sort(byTime);
                // AM / PM halves — each half is tinted only when a booking falls in that part of the day
                const am = evs.filter(e => e.startTime && toMinutes(e.startTime) < 720);
                const pm = evs.filter(e => !e.startTime || toMinutes(e.startTime) >= 720);
                return (
                  <div key={d.toISOString()} className="min-h-24 rounded border border-border bg-muted/30 p-1 flex flex-col gap-1">
                    {[['AM', am], ['PM', pm]].map(([half, list]) => (
                      <div key={half} className="flex-1 rounded px-1 space-y-1" style={list.length ? { backgroundColor: r.color + '1f' } : undefined}>
                        <p className="text-[8px] font-semibold text-muted-foreground/60">{list.length ? `${half} · ${list.length} booked` : half}</p>
                        {list.map(e => (
                          <button
                            key={e.id}
                            onClick={() => onOpenDay?.(d)}
                            title={`${e.startTime || ''} ${e.title}`}
                            className="w-full text-left text-[10px] px-1 py-1 rounded text-white leading-tight hover:opacity-90"
                            style={{ backgroundColor: r.color }}
                          >
                            {e.startTime && <span className="font-semibold">{e.startTime} </span>}{e.title}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DayRoomView;