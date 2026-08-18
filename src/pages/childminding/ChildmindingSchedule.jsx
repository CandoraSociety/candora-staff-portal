import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Baby, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PROGRAM_COLORS, getProgramLabel, MONTH_NAMES } from '@/lib/childmindingConstants';
import ChildmindingSessionDetail from '@/components/childminding/ChildmindingSessionDetail';
import ChildmindingSessionDialog from '@/components/childminding/ChildmindingSessionDialog';

const SESSION_COLOR = '#14b8a6'; // teal — distinct from program colors

export default function ChildmindingSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openSession, setOpenSession] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: records = [], isLoading } = useQuery({ queryKey: ['childminding-records'], queryFn: () => base44.entities.ChildmindingRecord.list('-date', 1000) });
  const { data: sessions = [] } = useQuery({ queryKey: ['childminding-sessions'], queryFn: () => base44.entities.ChildmindingSession.list('-date', 1000) });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  // Records shown on the calendar are only those NOT tied to a session
  // (linked records are visible inside their session detail).
  const monthRecords = records.filter((r) => {
    if (!r.date) return false;
    const d = new Date(r.date);
    return d.getMonth() === month && d.getFullYear() === year && !r.session_id;
  });
  const monthSessions = sessions.filter((s) => {
    if (!s.date) return false;
    const d = new Date(s.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const byDay = {};
  monthRecords.forEach((r) => { const day = new Date(r.date).getDate(); (byDay[day] = byDay[day] || { records: [], sessions: [] }).records.push(r); });
  monthSessions.forEach((s) => { const day = new Date(s.date).getDate(); (byDay[day] = byDay[day] || { records: [], sessions: [] }).sessions.push(s); });

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
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Childminding Schedule</h1>
          <p className="text-muted-foreground text-sm mt-1">{monthSessions.length} session{monthSessions.length !== 1 ? 's' : ''} · {monthRecords.length} individual record{monthRecords.length !== 1 ? 's' : ''} · {totalHours.toFixed(1)} hours this month</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)}><CalendarPlus className="h-4 w-4" /> Create Session</Button>
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={goToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: SESSION_COLOR }} />
        <span className="text-xs text-muted-foreground">Session (click to open)</span>
        <span className="h-3 w-3 rounded-full ml-3" style={{ backgroundColor: PROGRAM_COLORS.pathways }} />
        <span className="text-xs text-muted-foreground">Individual intake record</span>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
        <Card>
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-lg font-heading font-semibold text-foreground text-center">{MONTH_NAMES[month]} {year}</h2>
          </div>
          <div className="grid grid-cols-7 gap-px bg-border">
            {weekdays.map((d) => <div key={d} className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>)}
            {Array.from({ length: startWeekday }).map((_, i) => <div key={`empty-${i}`} className="bg-card min-h-[110px]" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const cell = byDay[day] || { records: [], sessions: [] };
              const total = cell.sessions.length + cell.records.length;
              return (
                <div key={day} className={`bg-card min-h-[110px] p-1.5 ${isToday(day) ? 'ring-2 ring-primary ring-inset' : ''}`}>
                  <p className={`text-xs font-medium mb-1 ${isToday(day) ? 'text-primary' : 'text-muted-foreground'}`}>{day}</p>
                  <div className="space-y-1">
                    {cell.sessions.slice(0, 3).map((s) => (
                      <button key={s.id} onClick={() => setOpenSession(s)} className="w-full text-left text-xs p-1 rounded hover:opacity-80" style={{ backgroundColor: SESSION_COLOR + '20', borderLeft: `2px solid ${SESSION_COLOR}` }}>
                        <p className="font-medium truncate">{s.title || 'Session'}</p>
                        <p className="truncate" style={{ color: SESSION_COLOR }}>{s.start_time ? `${s.start_time}${s.end_time ? `–${s.end_time}` : ''}` : 'Open'}</p>
                      </button>
                    ))}
                    {cell.records.slice(0, Math.max(0, 3 - cell.sessions.length)).map((r) => (
                      <div key={r.id} className="text-xs p-1 rounded" style={{ backgroundColor: (PROGRAM_COLORS[r.program] || '#64748b') + '15', borderLeft: `2px solid ${PROGRAM_COLORS[r.program] || '#64748b'}` }}>
                        <p className="font-medium truncate">{r.child_first_name}</p>
                        <p className="text-muted-foreground">{r.hours}h · {getProgramLabel(r)}</p>
                      </div>
                    ))}
                    {total > 3 && <p className="text-xs text-muted-foreground px-1">+{total - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Sessions list for the month */}
      {monthSessions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">{MONTH_NAMES[month]} {year} — Sessions</h3>
            <div className="space-y-1">
              {monthSessions.sort((a, b) => new Date(a.date) - new Date(b.date)).map((s) => (
                <button key={s.id} onClick={() => setOpenSession(s)} className="w-full text-left flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: SESSION_COLOR + '15' }}><CalendarPlus className="h-4 w-4" style={{ color: SESSION_COLOR }} /></div>
                    <div>
                      <p className="text-sm font-medium">{s.title || 'Childminding Session'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}{s.start_time ? ` · ${s.start_time}${s.end_time ? `–${s.end_time}` : ''}` : ''}{s.location ? ` · ${s.location}` : ''}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: SESSION_COLOR + '20', color: SESSION_COLOR }}>Session</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual records list (not tied to a session) */}
      {monthRecords.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">{MONTH_NAMES[month]} {year} — Individual Records</h3>
            <div className="space-y-1">
              {monthRecords.sort((a, b) => new Date(a.date) - new Date(b.date)).map((r) => (
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

      <ChildmindingSessionDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ChildmindingSessionDetail session={openSession} open={!!openSession} onOpenChange={(o) => { if (!o) setOpenSession(null); }} />
    </div>
  );
}