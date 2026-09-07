import React, { useEffect, useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function ClassDateCalendar({ dates, selectedDate, onSelect, markedDates = [] }) {
  const dateSet = useMemo(() => new Set(dates), [dates]);
  const marked = useMemo(() => new Set(markedDates), [markedDates]);

  const [month, setMonth] = useState(() => {
    if (selectedDate) return startOfMonth(parseLocalDate(selectedDate));
    const today = new Date();
    const upcoming = dates.map(parseLocalDate).filter(d => d >= startOfMonth(today));
    if (upcoming.length) return startOfMonth(upcoming.sort((a, b) => a - b)[0]);
    if (dates.length) return startOfMonth(parseLocalDate(dates[0]));
    return startOfMonth(today);
  });

  // Follow the selected date when it changes (e.g. clicked from history)
  useEffect(() => {
    if (selectedDate) setMonth(startOfMonth(parseLocalDate(selectedDate)));
  }, [selectedDate]);

  const months = useMemo(() => {
    const ms = new Set(dates.map(d => format(parseLocalDate(d), 'yyyy-MM')));
    return Array.from(ms).sort();
  }, [dates]);

  const monthKey = format(month, 'yyyy-MM');
  const canPrev = months.length > 0 && months[0] < monthKey;
  const canNext = months.length > 0 && months[months.length - 1] > monthKey;

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const last = endOfMonth(month);
    const arr = Array.from({ length: getDay(first) }, () => null);
    eachDayOfInterval({ start: first, end: last }).forEach(d => arr.push(d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [month]);

  if (!dates.length) return null;

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!canPrev} onClick={() => setMonth(m => addMonths(m, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="font-semibold text-sm">{format(month, 'MMMM yyyy')}</p>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!canNext} onClick={() => setMonth(m => addMonths(m, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground mb-1">
        {WEEKDAYS.map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />;
          const key = format(d, 'yyyy-MM-dd');
          const isClassDate = dateSet.has(key);
          const isSel = selectedDate === key;
          return (
            <button
              key={key}
              type="button"
              disabled={!isClassDate}
              onClick={() => onSelect(key)}
              title={isClassDate ? (marked.has(key) ? 'Attendance recorded' : 'Take attendance') : 'No class this day'}
              className={`relative h-9 rounded-md text-xs font-medium transition-colors ${
                isSel
                  ? 'bg-primary text-primary-foreground'
                  : isClassDate
                    ? 'bg-primary/10 text-foreground hover:bg-primary/25'
                    : 'text-muted-foreground/40 cursor-default'
              }`}
            >
              {format(d, 'd')}
              {isClassDate && !isSel && marked.has(key) && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-success" />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 text-center">
        Only this class's scheduled dates are selectable
      </p>
    </div>
  );
}