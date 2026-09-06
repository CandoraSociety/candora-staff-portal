import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/rc/StatusBadge';
import { APPOINTMENT_STATUS_OPTIONS } from '@/lib/rcConstants';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const toKey = (d) => new Date(d).toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

export default function AppointmentsCalendar({ appointments }) {
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);

  const byDay = {};
  appointments.forEach(a => {
    if (!a.appointment_date) return;
    const key = toKey(a.appointment_date);
    (byDay[key] = byDay[key] || []).push(a);
  });

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedKey = toKey(selected);
  const selectedAppts = byDay[selectedKey] || [];

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
              const appts = byDay[key] || [];
              const isToday = key === toKey(today);
              const isSelected = key === selectedKey;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(d)}
                  className={`h-16 rounded-md border text-left p-1 transition-colors ${isSelected ? 'border-primary bg-primary/10' : 'border-border/60 hover:bg-muted'} ${isToday && !isSelected ? 'border-primary/60' : ''}`}
                >
                  <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>{d.getDate()}</span>
                  <div className="mt-0.5 flex flex-wrap gap-0.5">
                    {appts.slice(0, 3).map((a, j) => <span key={j} className="h-1.5 w-1.5 rounded-full bg-primary" />)}
                    {appts.length > 3 && <span className="text-[9px] text-muted-foreground">+{appts.length - 3}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /> {selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          {selectedAppts.length === 0 ? <p className="text-sm text-muted-foreground py-2">No appointments on this day.</p> : (
            <div className="space-y-2">
              {selectedAppts.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date)).map(a => (
                <div key={a.id} className="flex items-center justify-between gap-3 p-2.5 rounded-md border border-border/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.client_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.appointment_date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      {a.purpose ? ` · ${a.purpose}` : ''}
                      {a.location_detail ? ` · ${a.location_detail}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={a.status} options={APPOINTMENT_STATUS_OPTIONS} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}