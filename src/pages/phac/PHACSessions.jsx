import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, ClipboardCheck, MapPin, Repeat, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SessionFormDialog from '@/components/phac/SessionFormDialog';
import AttendanceDialog from '@/components/phac/AttendanceDialog';
import StatusBadge from '@/components/phac/StatusBadge';
import { SESSION_STATUS_OPTIONS } from '@/lib/phacConstants';
import { ROOM_LABELS } from '@/lib/centralRegConstants';

const fmtDate = (str) => str ? new Date(str + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';

const presentCount = (session) => {
  const dates = (session.attendance || []).map(a => a.date).filter(Boolean).sort();
  const lastDate = dates[dates.length - 1];
  return (session.attendance || []).filter(a => a.date === lastDate && (a.status === 'present' || a.status === 'late')).length;
};

export default function PHACSessions() {
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [attendanceSession, setAttendanceSession] = useState(null);
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['phac-sessions'],
    queryFn: () => base44.entities.PHACSession.list('-session_date', 500),
  });
  const { data: programs = [] } = useQuery({
    queryKey: ['phac-programs'],
    queryFn: () => base44.entities.PHACProgram.list('name', 200),
  });

  const programNames = [...new Set([
    ...programs.map(p => p.name).filter(Boolean),
    ...sessions.map(s => s.program_name).filter(Boolean),
  ])].sort();

  const filtered = sessions.filter(s => {
    const matchSearch = (s.program_name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (s.facilitator || '').toLowerCase().includes(search.toLowerCase());
    const matchProgram = programFilter === 'all' || s.program_name === programFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchProgram && matchStatus;
  });

  const handleEdit = (session) => { setEditing(session); setDialogOpen(true); };
  const handleAdd = () => { setEditing(null); setDialogOpen(true); };
  const handleSaved = () => { queryClient.invalidateQueries({ queryKey: ['phac-sessions'] }); setDialogOpen(false); };

  const refreshAttendance = () => {
    queryClient.invalidateQueries({ queryKey: ['phac-sessions'] });
    setAttendanceSession(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Sessions</h1>
          <p className="text-muted-foreground text-sm mt-1">Drop-in sessions, rooms and family attendance</p>
        </div>
        <Button onClick={handleAdd}><Plus className="h-4 w-4" /> Add Session</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by program or facilitator..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="All programs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All programs</SelectItem>
            {programNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {SESSION_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          {sessions.length === 0 ? 'No sessions yet. Click "Add Session" to get started.' : 'No sessions match your filters.'}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(s => {
            const inCount = presentCount(s);
            return (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{s.program_name || 'PHAC Session'}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(s.session_date)}{(s.start_time || s.end_time) ? ` · ${s.start_time || ''}${s.end_time ? `–${s.end_time}` : ''}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={s.status} options={SESSION_STATUS_OPTIONS} />
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {s.room && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {ROOM_LABELS[s.room] || s.room}{s.location && s.room !== 'virtual' ? ` — ${s.location}` : ''}</p>}
                    {!s.room && s.location && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {s.location}</p>}
                    {s.recurrence_pattern && s.recurrence_pattern !== 'none' && (
                      <p className="flex items-center gap-1.5"><Repeat className="h-3 w-3" /> Repeats {s.recurrence_pattern}{s.recurrence_end_date ? ` until ${fmtDate(s.recurrence_end_date)}` : ''}</p>
                    )}
                    {s.facilitator && <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> {s.facilitator}</p>}
                    {(s.adult_count || s.child_count) ? (
                      <p className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {s.adult_count || 0} adults · {s.child_count || 0} children</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/50">
                    <Button size="sm" variant="outline" onClick={() => setAttendanceSession(s)}>
                      <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" /> Attendance
                      {inCount > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{inCount} in</span>}
                    </Button>
                    <Button size="sm" variant="ghost" className="ml-auto" onClick={() => handleEdit(s)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <SessionFormDialog open={dialogOpen} onOpenChange={setDialogOpen} session={editing} onSaved={handleSaved} />

      {attendanceSession && (
        <AttendanceDialog
          open={!!attendanceSession}
          onOpenChange={(v) => { if (!v) setAttendanceSession(null); }}
          session={attendanceSession}
          onSaved={refreshAttendance}
        />
      )}
    </div>
  );
}