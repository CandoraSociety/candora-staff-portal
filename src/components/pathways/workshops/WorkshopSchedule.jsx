import { useMemo } from 'react';
import { generateOccurrences, formatDateLong, parseDate, toISODate } from '@/lib/workshopSchedule';
import { Calendar, Clock, MapPin, Users, User } from 'lucide-react';

export default function WorkshopSchedule({ workshops, signups, onOpenRoster, rangeDays = 120 }) {
  const today = toISODate(new Date());

  const sessions = useMemo(() => {
    const horizonDate = new Date(); horizonDate.setDate(horizonDate.getDate() + rangeDays);
    const horizon = toISODate(horizonDate);
    const list = [];
    for (const w of workshops) {
      if (w.status === 'cancelled') continue;
      const occ = generateOccurrences(w, { horizon });
      for (const date of occ) {
        if (date < today) continue; // upcoming only
        if (date > horizon) continue;
        const roster = (signups || []).filter(s => s.workshop_id === w.id && s.session_date === date);
        const active = roster.filter(s => s.status === 'registered' || s.status === 'attended').length;
        list.push({ workshop: w, date, rosterCount: active });
      }
    }
    list.sort((a, b) => a.date.localeCompare(b.date) || (a.workshop.start_time || '').localeCompare(b.workshop.start_time || ''));
    return list;
  }, [workshops, signups, rangeDays, today]);

  if (workshops.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-10">Create a workshop to see it on the schedule.</p>;
  }
  if (sessions.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-10">No upcoming sessions in the next {rangeDays} days.</p>;
  }

  // group by date
  const byDate = {};
  sessions.forEach(s => { (byDate[s.date] ||= []).push(s); });

  return (
    <div className="space-y-4">
      {Object.entries(byDate).map(([date, items]) => (
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
  );
}