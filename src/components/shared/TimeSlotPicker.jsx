import React, { useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDayBookings, timeToMinutes, minutesToTime } from '@/lib/sessionAvailability';
import { ROOM_LABELS } from '@/lib/centralRegConstants';

export const DAY_START = 7 * 60;  // 07:00
export const DAY_END = 22 * 60;  // 22:00
export const SLOT = 15;
export const DURATION_OPTIONS = [30, 45, 60, 75, 90, 120, 150, 180];

const fmtLabel = (mins) => {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h = h24 % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
};

// Date → Duration → Start-time picker. Loads that day's bookings across every
// portal for the chosen room and shades out any slot that would double-book.
export default function TimeSlotPicker({ dateISO, room, excludeId, duration, start, onStartChange, onDurationChange, onValidityChange, disabled }) {
  const { bookings = [], isLoading } = useDayBookings(dateISO, !disabled);

  const busy = useMemo(
    () => (bookings || []).filter(b => b.id !== excludeId && room && b.room === room),
    [bookings, room, excludeId]
  );

  const durationOptions = useMemo(() => {
    const opts = [...DURATION_OPTIONS];
    if (duration > 0 && !opts.includes(duration)) opts.push(duration);
    return opts.sort((a, b) => a - b);
  }, [duration]);

  const overlapsBusy = (s, e) => busy.some(b => {
    const bs = timeToMinutes(b.start);
    const be = timeToMinutes(b.end);
    return s < be && e > bs;
  });

  const slotAvailable = (m) => m + duration <= DAY_END && !overlapsBusy(m, m + duration);

  const startMin = start ? timeToMinutes(start) : null;
  const startValid = startMin == null || (startMin + duration <= DAY_END && !overlapsBusy(startMin, startMin + duration));

  useEffect(() => { onValidityChange?.(startValid); }, [startValid]);

  const slots = [];
  for (let m = DAY_START; m + SLOT <= DAY_END; m += SLOT) slots.push(m);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Duration</Label>
          <Select value={String(duration)} onValueChange={(v) => onDurationChange?.(parseInt(v))} disabled={disabled}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {durationOptions.map(d => (
                <SelectItem key={d} value={String(d)}>{d >= 60 ? `${Math.floor(d / 60)}h${d % 60 ? ` ${d % 60}m` : ''}` : `${d} min`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Start Time</Label>
          <div className="h-9 flex items-center text-sm">
            {start
              ? <span className="font-medium">{fmtLabel(startMin)} – {fmtLabel(startMin + duration)}</span>
              : <span className="text-xs text-muted-foreground">Pick a slot below</span>}
          </div>
        </div>
      </div>

      {!dateISO ? (
        <p className="text-xs text-muted-foreground">Select a date to see available times.</p>
      ) : !room ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">Select a room first — availability is checked per room.</p>
      ) : isLoading ? (
        <p className="text-xs text-muted-foreground">Checking that day's schedule…</p>
      ) : (
        <>
          <p className="text-[11px] text-muted-foreground">
            Greyed-out times are already booked in {ROOM_LABELS[room] || room} that day. Click an open time to start the session there.
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
            {slots.map(m => {
              const isSel = startMin === m;
              const avail = slotAvailable(m);
              const blocker = avail ? null : busy.find(b => {
                const bs = timeToMinutes(b.start);
                const be = timeToMinutes(b.end);
                return m < be && m + duration > bs;
              });
              return (
                <button
                  key={m}
                  type="button"
                  disabled={disabled}
                  onClick={() => avail && onStartChange?.(minutesToTime(m))}
                  title={blocker ? `Booked: ${blocker.title} (${blocker.start}–${blocker.end})` : `Start at ${fmtLabel(m)}`}
                  className={cn(
                    'rounded px-1 py-1 text-[10px] font-medium border transition-colors text-center',
                    isSel
                      ? 'bg-primary text-primary-foreground border-primary'
                      : avail
                        ? 'bg-card border-border text-foreground hover:border-primary'
                        : 'bg-muted/60 text-muted-foreground/40 border-border/50 cursor-not-allowed line-through'
                  )}
                >
                  {fmtLabel(m)}
                </button>
              );
            })}
          </div>
          {start && !startValid && (
            <p className="text-xs text-red-600 font-medium">That time overlaps an existing booking in this room — pick another slot.</p>
          )}
          {busy.length > 0 && (
            <p className="text-[10px] text-muted-foreground truncate" title={busy.map(b => `${b.title} (${b.start}–${b.end})`).join(', ')}>
              Already booked: {busy.map(b => `${b.title} ${b.start}–${b.end}`).join(' · ')}
            </p>
          )}
        </>
      )}
    </div>
  );
}