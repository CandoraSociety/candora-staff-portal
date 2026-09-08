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

// Vertical room bars for a single date — one thin bar per room side by side,
// the AM half on top and the PM half on the bottom of each bar. Each half is
// shaded in the room's colour only when a booking falls in that part of the day.
export function RoomBarsCell({ events, rooms = ROOM_OPTIONS }) {
  return (
    <div className="flex gap-0.5 flex-1 min-h-0">
      {rooms.map(r => {
        const matched = events.filter(e => e.room === r.value);
        const am = matched.filter(e => e.startTime && toMinutes(e.startTime) < 720);
        const pm = matched.filter(e => !e.startTime || toMinutes(e.startTime) >= 720);
        return (
          <div
            key={r.value}
            title={`${r.label} — AM: ${am.length ? am.map(e => `${e.startTime} ${e.title}`).join(', ') : 'free'} · PM: ${pm.length ? pm.map(e => `${e.startTime} ${e.title}`).join(', ') : 'free'}`}
            className="flex-1 flex flex-col gap-0.5 min-h-0 min-w-0"
          >
            <span className="text-[8px] font-bold text-muted-foreground/70 text-center leading-none">{r.abbr}</span>
            {[['AM', am], ['PM', pm]].map(([half, list]) => (
              <div
                key={half}
                className={cn(
                  'flex-1 rounded border overflow-hidden flex items-center justify-center',
                  list.length ? 'text-white border-transparent' : 'bg-muted/30 text-muted-foreground/50 border-border/70'
                )}
                style={list.length ? { backgroundColor: r.color } : undefined}
              >
                <span className="text-[8px] font-bold leading-none">{list.length ? list.length : half}</span>
              </div>
            ))}
          </div>
        );
      })}
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
  return (
    <div>
      <div className="text-center font-display font-bold text-lg mb-2">Week of {format(weekStart, 'MMMM d, yyyy')}</div>
      {/* Room legend — the vertical bars only show abbreviations */}
      <div className="flex flex-wrap gap-2 justify-center mb-3">
        {rooms.map(r => (
          <span key={r.value} className="flex items-center gap-1 text-[10px] font-medium" style={{ color: r.color }}>
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: r.color }} />{r.label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(d => {
          const dayEvents = events.filter(e => isSameDay(e.date, d)).sort(byTime);
          const noRoom = dayEvents.filter(e => !e.room).length;
          return (
            <div key={d.toISOString()}>
              <button
                onClick={() => onOpenDay?.(d)}
                className={cn('w-full rounded py-1.5 text-center text-xs font-semibold transition-colors', isSameDay(d, new Date()) ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-accent')}
              >
                {format(d, 'EEE d')}
              </button>
              <div className="mt-1 rounded border border-border bg-muted/20 p-1 flex flex-col min-h-48">
                <RoomBarsCell events={dayEvents} rooms={rooms} />
                {noRoom > 0 && <p className="text-[9px] text-muted-foreground mt-1 text-center">+{noRoom} no room</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DayRoomView;