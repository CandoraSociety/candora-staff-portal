import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { ROOM_OPTIONS, CALENDAR_SOURCES } from '@/lib/centralRegConstants';
import { timeToMinutes } from '@/lib/sessionAvailability';

const DAY_START = 7 * 60;  // 07:00
const DAY_END = 22 * 60;   // 22:00
const SLOT = 15;
const ROW_H = 18; // px per 15-minute row
const SOURCE_COLORS = Object.fromEntries(CALENDAR_SOURCES.map(s => [s.key, s.color]));

const fmtLabel = (mins) => {
  const h24 = Math.floor(mins / 60);
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h = h24 % 12 || 12;
  return `${h}:${String(mins % 60).padStart(2, '0')} ${ampm}`;
};

// Detailed day view — full 15-minute time grid with one vertical column per
// room (incl. Echo Valley and Virtual, plus a No-room column), replacing the
// quadrant structure for this view.
export default function DetailedDayView({ date, events }) {
  const key = format(date, 'yyyy-MM-dd');
  const dayEvents = (events || []).filter(e => format(e.date, 'yyyy-MM-dd') === key);
  const timed = dayEvents.filter(e => e.startTime && e.endTime);
  const untimed = dayEvents.filter(e => !(e.startTime && e.endTime));

  const columns = [
    ...ROOM_OPTIONS.map(r => ({ value: r.value, label: r.label, color: r.color, events: timed.filter(e => e.room === r.value) })),
    { value: '__none', label: 'No room set', color: '#94a3b8', events: timed.filter(e => !e.room) },
  ];

  const rows = (DAY_END - DAY_START) / SLOT;
  const height = rows * ROW_H;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-center font-display font-bold text-lg mb-3">{format(date, 'EEEE, MMMM d, yyyy')}</div>
        {untimed.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 items-center">
            <span className="text-xs text-muted-foreground">No set time:</span>
            {untimed.map(e => (
              <span key={e.id} className="text-[11px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: SOURCE_COLORS[e.source] || '#64748b' }}>{e.title}</span>
            ))}
          </div>
        )}
        <div className="overflow-x-auto">
          <div className="min-w-[880px]">
            {/* Room column headers */}
            <div className="grid" style={{ gridTemplateColumns: `3.5rem repeat(${columns.length}, minmax(0, 1fr))` }}>
              <div />
              {columns.map(c => (
                <div key={c.value} className="text-center px-1 pb-2">
                  <div className="text-[10px] font-bold truncate" style={{ color: c.color }}>{c.label}</div>
                </div>
              ))}
            </div>
            {/* Time grid body */}
            <div className="grid" style={{ gridTemplateColumns: `3.5rem repeat(${columns.length}, minmax(0, 1fr))` }}>
              <div className="relative border-r border-border" style={{ height }}>
                {Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }).map((_, i) => {
                  const mins = DAY_START + i * 60;
                  return (
                    <div key={mins} className="absolute right-1 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums" style={{ top: ((mins - DAY_START) / SLOT) * ROW_H }}>
                      {fmtLabel(mins)}
                    </div>
                  );
                })}
              </div>
              {columns.map(c => (
                <div key={c.value} className="relative border-l border-border/60" style={{ height }}>
                  {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="w-full border-b border-border/15" style={{ height: ROW_H }} />
                  ))}
                  {c.events.map(ev => {
                    const s = timeToMinutes(ev.startTime);
                    const e = timeToMinutes(ev.endTime);
                    const top = ((Math.max(s, DAY_START) - DAY_START) / SLOT) * ROW_H;
                    const h = Math.max(((Math.min(e, DAY_END) - Math.max(s, DAY_START)) / SLOT) * ROW_H, ROW_H);
                    return (
                      <div
                        key={ev.id}
                        title={`${ev.startTime}–${ev.endTime} · ${ev.title}${ev.facilitator ? ` · ${ev.facilitator}` : ''}`}
                        className="absolute inset-x-0.5 rounded px-1 py-0.5 overflow-hidden text-white"
                        style={{ top, height: h, backgroundColor: SOURCE_COLORS[ev.source] || '#64748b' }}
                      >
                        <p className="text-[9px] font-bold leading-tight truncate">{ev.startTime} {ev.title}</p>
                        {h >= 2 * ROW_H && <p className="text-[8px] leading-tight opacity-90 truncate">{ev.facilitator || ev.source}</p>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Source legend */}
        <div className="flex flex-wrap gap-2 mt-3">
          {CALENDAR_SOURCES.map(s => (
            <span key={s.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />{s.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}