import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { addMonths, addWeeks, eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth } from 'date-fns';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// Collapsible dashboard calendar for the Reception portal — shows what's
// happening at Candora: program sessions (all program portals), events and
// Resource Centre client appointments.

const KINDS = {
  program: { label: 'Programs', color: '#3b82f6' },
  event: { label: 'Events', color: '#a855f7' },
  rc: { label: 'RC Appointments', color: '#f59e0b' },
};

const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

let seq = 0;
const makeItem = (kind, title, date, startTime, endTime, location) => ({
  id: `${kind}-${seq++}`, kind, title, date, startTime, endTime, location: location || '',
});

// Expand a session-style record's recurrence into the visible month window
const expandSession = (kind, s, title, monthStart, monthEnd) => {
  const base = parseLocalDate(s.session_date || s.date);
  if (!base || s.status === 'cancelled') return [];
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
  return dates.map(d => makeItem(kind, title, d, s.start_time, s.end_time, s.location));
};

export default function ReceptionDashboardCalendar() {
  const [open, setOpen] = useState(true);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());

  const workshopsQ = useQuery({ queryKey: ['reception-cal-workshops'], queryFn: () => base44.entities.Workshop.list() });
  const communityQ = useQuery({ queryKey: ['reception-cal-community'], queryFn: () => base44.entities.CommunitySession.list() });
  const phacQ = useQuery({ queryKey: ['reception-cal-phac'], queryFn: () => base44.entities.PHACSession.list() });
  const digilitQ = useQuery({ queryKey: ['reception-cal-digilit'], queryFn: () => base44.entities.DigiLitSession.list() });
  const frnQ = useQuery({ queryKey: ['reception-cal-frn'], queryFn: () => base44.entities.FRNSession.list() });
  const ellQ = useQuery({ queryKey: ['reception-cal-ell'], queryFn: () => base44.entities.ELLClass.list() });
  const eventsQ = useQuery({ queryKey: ['reception-cal-events'], queryFn: () => base44.entities.Event.list() });
  const rcApptsQ = useQuery({ queryKey: ['reception-cal-rc-appts'], queryFn: () => base44.entities.RCAppointment.list('-appointment_date', 200) });

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const items = useMemo(() => {
    const list = [];
    (workshopsQ.data || []).forEach(w => list.push(...expandSession('program', w, w.title, monthStart, monthEnd)));
    (communityQ.data || []).forEach(s => list.push(...expandSession('program', s, s.title || s.program_name || 'Community Session', monthStart, monthEnd)));
    (phacQ.data || []).forEach(s => list.push(...expandSession('program', s, s.program_name || 'PHAC Session', monthStart, monthEnd)));
    (digilitQ.data || []).forEach(s => list.push(...expandSession('program', s, s.title || 'Digital Literacy Session', monthStart, monthEnd)));
    (frnQ.data || []).forEach(s => list.push(...expandSession('program', s, s.program_name || 'FRN Session', monthStart, monthEnd)));

    // ELL classes recur weekly on their scheduled days between start/end dates
    (ellQ.data || []).filter(c => c.status === 'active' && (c.schedule_days || []).length).forEach(cls => {
      const startBound = cls.start_date ? parseLocalDate(cls.start_date) : null;
      const endBound = cls.end_date ? parseLocalDate(cls.end_date) : null;
      eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach(d => {
        const dayName = format(d, 'eeee').toLowerCase();
        if (!(cls.schedule_days || []).includes(dayName)) return;
        if (startBound && d < startBound) return;
        if (endBound && d > endBound) return;
        list.push(makeItem('program', cls.name, d, cls.start_time, cls.end_time, cls.location));
      });
    });

    // Events (Events Manager)
    (eventsQ.data || []).filter(e => e.status !== 'cancelled' && !e.is_hidden && e.start_date).forEach(e => {
      const d = new Date(e.start_date);
      if (d >= monthStart && d <= monthEnd) list.push(makeItem('event', e.name, d, format(d, 'HH:mm'), null, e.location));
    });

    // Resource Centre client appointments
    (rcApptsQ.data || []).filter(a => a.status !== 'cancelled' && a.appointment_date).forEach(a => {
      const d = new Date(a.appointment_date);
      if (d >= monthStart && d <= monthEnd) list.push(makeItem('rc', a.client_name || 'Client appointment', d, format(d, 'HH:mm'), null, a.location_detail || a.purpose));
    });

    list.sort((a, b) => a.date - b.date || (a.startTime || '').localeCompare(b.startTime || ''));
    return list;
  }, [workshopsQ.data, communityQ.data, phacQ.data, digilitQ.data, frnQ.data, ellQ.data, eventsQ.data, rcApptsQ.data, monthStart, monthEnd]);

  const byDay = useMemo(() => {
    const map = new Map();
    items.forEach(i => {
      const k = format(i.date, 'yyyy-MM-dd');
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(i);
    });
    return map;
  }, [items]);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const selectedKey = format(selected, 'yyyy-MM-dd');
  const selectedItems = byDay.get(selectedKey) || [];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="w-full text-left">
          <div className="flex items-center justify-between p-4 pb-0">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <p className="font-heading font-bold text-foreground">Calendar — Programs, Events &amp; Appointments</p>
            </div>
            <div className="flex items-center gap-2">
              {Object.entries(KINDS).map(([key, k]) => (
                <span key={key} className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: k.color }} />{k.label}
                </span>
              ))}
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-4 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">{format(month, 'MMMM yyyy')}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" onClick={() => setMonth(m => startOfMonth(addMonths(m, -1)))}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => { const now = new Date(); setMonth(startOfMonth(now)); setSelected(now); }}>Today</Button>
                <Button variant="outline" size="icon" onClick={() => setMonth(m => startOfMonth(addMonths(m, 1)))}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <p key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</p>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array(startOfMonth(month).getDay()).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
              {days.map(d => {
                const key = format(d, 'yyyy-MM-dd');
                const dayItems = byDay.get(key) || [];
                const isToday = isSameDay(d, new Date());
                const isSel = isSameDay(d, selected);
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(d)}
                    className={cn(
                      'h-16 rounded-md border text-left p-1 transition-colors',
                      isSel ? 'border-primary bg-primary/10' : 'border-border/60 hover:bg-muted',
                      isToday && !isSel && 'border-primary/60'
                    )}
                  >
                    <span className={cn('text-xs font-medium', isToday ? 'text-primary' : 'text-foreground')}>{format(d, 'd')}</span>
                    <div className="mt-0.5 flex flex-wrap gap-0.5">
                      {Object.keys(KINDS).map(kind => {
                        const n = dayItems.filter(i => i.kind === kind).length;
                        return n ? <span key={kind} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: KINDS[kind].color }} /> : null;
                      })}
                      {dayItems.length > 0 && <span className="text-[9px] text-muted-foreground">{dayItems.length}</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-sm font-medium text-foreground mb-2">{selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              {selectedItems.length === 0 ? <p className="text-sm text-muted-foreground py-2">Nothing scheduled on this day.</p> : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {selectedItems.map(i => (
                    <div key={i.id} className="flex items-center gap-2 p-2 rounded-md border border-border/50">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: KINDS[i.kind].color }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{i.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {i.startTime ? new Date(`2000-01-01T${i.startTime}`).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : 'All day'}
                          {i.location ? ` · ${i.location}` : ''}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground flex-shrink-0">{KINDS[i.kind].label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}