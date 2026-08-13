import { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths } from 'date-fns';
import { generateOccurrences, formatDateLong, toISODate } from '@/lib/workshopSchedule';
import { Calendar, Clock, MapPin, Users, User, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WorkshopSchedule({ workshops, signups, onOpenRoster, rangeDays = 120 }) {
  const today = toISODate(new Date());
  const [view, setView] = useState('list');
  const [month, setMonth] = useState(new Date());

  const sessions = useMemo(() => {
    const horizonDate = new Date(); horizonDate.setDate(horizonDate.getDate() + rangeDays);
    const horizon = toISODate(horizonDate);
    const list = [];
    for (const w of workshops) {
      if (w.status === 'cancelled') continue;
      const occ = generateOccurrences(w, { horizon });
      for (const date of occ) {
        if (date > horizon) continue;
        const roster = (signups || []).filter(s => s.workshop_id === w.id && s.session_date === date);
        const active = roster.filter(s => s.status === 'registered' || s.status === 'attended').length;
        list.push({ workshop: w, date, rosterCount: active });
      }
    }
    list.sort((a, b) => a.date.localeCompare(b.date) || (a.workshop.start_time || '').localeCompare(b.workshop.start_time || ''));
    return list;
  }, [workshops, signups, rangeDays]);

  const byDate = useMemo(() => {
    const map = {};
    sessions.forEach(s => { (map[s.date] ||= []).push(s); });
    return map;
  }, [sessions]);

  if (workshops.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-10">Create a workshop to see it on the schedule.</p>;
  }

  return (
    <div className="space-y-3">
      {/* View toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${view === 'calendar' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Calendar className="w-3.5 h-3.5" /> Calendar
          </button>
        </div>
      </div>

      {view === 'list' && (
        sessions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">No upcoming sessions in the next {rangeDays} days.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(byDate)
              .filter(([date]) => date >= today)
              .map(([date, items]) => (
                <div key={date}>
                  <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur py-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 mb-2">
                    {formatDateLong(date)}
                  </div>
                  <div className="space-y-2">
                    {items.map((s, i) => (
                      <button
                        key={`${s.workshop.id}-${s.date}-${i}`}
                        onClick={() => onOpenRoster(s.workshop, s.date)}
                        className="w-full text-left rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow hover:border-slate-300 transition overflow-hidden"
                      >
                        <div className="flex">
                          <div className="w-1.5 shrink-0" style={{ background: s.workshop.color || '#2563eb' }} />
                          <div className="flex-1 p-3 flex items-center gap-3">
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{s.workshop.title}</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                                <span>{s.workshop.start_time}{s.workshop.end_time ? `–${s.workshop.end_time}` : ''}</span>
                                {s.workshop.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.workshop.location}</span>}
                                {s.workshop.facilitator_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{s.workshop.facilitator_name}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium shrink-0">
                              <Users className="w-3.5 h-3.5" />
                              {s.rosterCount}{s.workshop.capacity ? `/${s.workshop.capacity}` : ''}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )
      )}

      {view === 'calendar' && (
        <CalendarView month={month} setMonth={setMonth} byDate={byDate} today={today} onOpenRoster={onOpenRoster} />
      )}
    </div>
  );
}

function CalendarView({ month, setMonth, byDate, today, onOpenRoster }) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Leading blanks so day 1 aligns to its weekday
  const lead = monthStart.getDay();

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth(m => addMonths(m, -1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold text-slate-700">{format(month, 'MMMM yyyy')}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setMonth(new Date())}>Today</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth(m => addMonths(m, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/60">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-[10px] font-semibold text-center text-slate-500 uppercase py-1.5">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: lead }).map((_, i) => (
          <div key={`lead-${i}`} className="min-h-[96px] border-b border-r border-slate-100 bg-slate-50/40" />
        ))}
        {days.map(day => {
          const iso = toISODate(day);
          const items = byDate[iso] || [];
          const isToday = iso === today;
          return (
            <div key={iso} className={`min-h-[96px] border-b border-r border-slate-100 p-1 flex flex-col gap-0.5 ${isToday ? 'bg-blue-50/60' : ''}`}>
              <span className={`text-[11px] font-semibold mb-0.5 ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>{format(day, 'd')}</span>
              {items.slice(0, 3).map((s, i) => (
                <button
                  key={`${s.workshop.id}-${iso}-${i}`}
                  onClick={() => onOpenRoster(s.workshop, s.date)}
                  className="text-left text-[10px] leading-tight rounded px-1 py-0.5 truncate hover:opacity-80 transition"
                  style={{ backgroundColor: (s.workshop.color || '#2563eb') + '22', color: s.workshop.color || '#2563eb', borderLeft: `2px solid ${s.workshop.color || '#2563eb'}` }}
                  title={`${s.workshop.title} · ${s.workshop.start_time || ''} · ${s.rosterCount}${s.workshop.capacity ? `/${s.workshop.capacity}` : ''} signed up`}
                >
                  {s.workshop.start_time && <span className="font-medium">{s.workshop.start_time.replace(/^0/, '')} </span>}
                  {s.workshop.title}
                </button>
              ))}
              {items.length > 3 && (
                <button onClick={() => onOpenRoster(items[3].workshop, items[3].date)} className="text-[10px] text-slate-400 hover:text-slate-600 text-left px-1">
                  +{items.length - 3} more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}