import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const toKey = (d) => new Date(d).toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

// Generic month calendar for a client's case file — shows appointments, deadlines
// and milestones together. Events: { date: 'YYYY-MM-DD', title, detail, color (hex) }.
export default function CaseEventsCalendar({ events = [] }) {
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);

  const byDay = {};
  events.forEach(e => {
    if (!e.date) return;
    (byDay[e.date] = byDay[e.date] || []).push(e);
  });

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedKey = toKey(selected);
  const selectedEvents = byDay[selectedKey] || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-heading font-bold text-foreground">{month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(today); }}>Today</Button>
              <Button variant="outline" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map(d => <p key={d} className="text-xs font-medium text-muted-foreground text-center py-1">{d}</p>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const key = toKey(d);
              const dayEvents = byDay[key] || [];
              const isToday = key === toKey(today);
              const isSelected = key === selectedKey;
              return (
                <button key={i} onClick={() => setSelected(d)}
                  className={`h-16 rounded-md border text-left p-1 transition-colors ${isSelected ? 'border-primary bg-primary/10' : 'border-border/60 hover:bg-muted'} ${isToday && !isSelected ? 'border-primary/60' : ''}`}>
                  <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>{d.getDate()}</span>
                  <div className="mt-0.5 flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 3).map((e, j) => <span key={j} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: e.color || 'hsl(var(--primary))' }} />)}
                    {dayEvents.length > 3 && <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 3}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground mb-2">{selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          {selectedEvents.length === 0 ? <p className="text-sm text-muted-foreground py-2">Nothing scheduled on this day.</p> : (
            <div className="space-y-2">
              {selectedEvents.map((e, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-md border border-border/50">
                  <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: e.color || 'hsl(var(--primary))' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{e.title}</p>
                    {e.detail && <p className="text-xs text-muted-foreground">{e.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}