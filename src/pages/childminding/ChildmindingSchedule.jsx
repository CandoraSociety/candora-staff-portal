import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CalendarDays, ChevronLeft, ChevronRight, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PROGRAM_COLORS, PROGRAM_LABELS, getProgramLabel, MONTH_NAMES } from '@/lib/childmindingConstants';

export default function ChildmindingSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: records = [], isLoading } = useQuery({ queryKey: ['childminding-records'], queryFn: () => base44.entities.ChildmindingRecord.list('-date', 1000) });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();

  const monthRecords = records.filter(r => {
    if (!r.date) return false;
    const d = new Date(r.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const recordsByDay = {};
  monthRecords.forEach(r => {
    const day = new Date(r.date).getDate();
    if (!recordsByDay[day]) recordsByDay[day] = [];
    recordsByDay[day].push(r);
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const today = new Date();
  const isToday = (day) => today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const totalHours = monthRecords.reduce((s, r) => s + (r.hours || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Childminding Schedule</h1><p className="text-muted-foreground text-sm mt-1">{monthRecords.length} session{monthRecords.length !== 1 ? 's' : ''} · {totalHours.toFixed(1)} hours this month</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={goToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-heading font-semibold">{MONTH_NAMES[month]} {year}</h2>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
        <Card>
          <div className="grid grid-cols-7 gap-px bg-border">
            {weekdays.map(d => <div key={d} className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>)}
            {Array.from({ length: startWeekday }).map((_, i) => <div key={`empty-${i}`} className="bg-card min-h-[100px]" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayRecords = recordsByDay[day] || [];
              return (
                <div key={day} className={`bg-card min-h-[100px] p-1.5 ${isToday(day) ? 'ring-2 ring-primary ring-inset' : ''}`}>
                  <p className={`text-xs font-medium mb-1 ${isToday(day) ? 'text-primary' : 'text-muted-foreground'}`}>{day}</p>
                  <div className="space-y-1">
                    {dayRecords.slice(0, 3).map(r => (
                      <div key={r.id} className="text-xs p-1 rounded" style={{ backgroundColor: (PROGRAM_COLORS[r.program] || '#64748b') + '15', borderLeft: `2px solid ${PROGRAM_COLORS[r.program] || '#64748b'}` }}>
                        <p className="font-medium truncate">{r.child_first_name}</p>
                        <p className="text-muted-foreground">{r.hours}h · {getProgramLabel(r)}</p>
                      </div>
                    ))}
                    {dayRecords.length > 3 && <p className="text-xs text-muted-foreground px-1">+{dayRecords.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* List view for the month */}
      {monthRecords.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">{MONTH_NAMES[month]} {year} — Session List</h3>
            <div className="space-y-1">
              {monthRecords.sort((a, b) => new Date(a.date) - new Date(b.date)).map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><Baby className="h-4 w-4 text-primary" /></div>
                    <div>
                      <p className="text-sm font-medium">{r.child_first_name} · {r.parent_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {r.hours}h</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (PROGRAM_COLORS[r.program] || '#64748b') + '20', color: PROGRAM_COLORS[r.program] || '#64748b' }}>{getProgramLabel(r)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}