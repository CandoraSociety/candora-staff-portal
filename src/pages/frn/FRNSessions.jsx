import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Calendar, Clock, MapPin, Repeat, User, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import SessionDialog from '@/components/frn/SessionDialog';
import { ROOM_LABELS } from '@/lib/centralRegConstants';
import { FRN_TARGETED_PROGRAM_NAMES, FRN_SESSION_STATUS_OPTIONS } from '@/lib/frnConstants';

const fmtDate = (str) => str ? new Date(str + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';

export default function FRNSessions() {
  const queryClient = useQueryClient();
  const [programFilter, setProgramFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: sessions = [], isLoading } = useQuery({ queryKey: ['frn-sessions'], queryFn: () => base44.entities.FRNSession.list('-session_date', 500) });

  const filtered = sessions.filter(s => programFilter === 'all' || s.program_name === programFilter);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['frn-sessions'] });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Sessions</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule sessions for FRN targeted programs — they appear on the Central Registration calendar too</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> New Session</Button>
      </div>

      <div className="flex gap-2">
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="All programs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All programs</SelectItem>
            {FRN_TARGETED_PROGRAM_NAMES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
        filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{sessions.length === 0 ? 'No sessions scheduled yet — create the first one!' : 'No sessions for this program.'}</CardContent></Card> :
        (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(s => (
              <Card key={s.id} className="hover:shadow-md transition-shadow"><CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">{s.program_name || 'FRN Session'}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(s.session_date)}{(s.start_time || s.end_time) ? ` · ${s.start_time || ''}${s.end_time ? `–${s.end_time}` : ''}` : ''}</p>
                  </div>
                  <StatusBadge status={s.status} options={FRN_SESSION_STATUS_OPTIONS} />
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {s.room && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {ROOM_LABELS[s.room] || s.room}{s.location && s.room !== 'virtual' ? ` — ${s.location}` : ''}</p>}
                  {!s.room && s.location && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {s.location}</p>}
                  {s.recurrence_pattern && s.recurrence_pattern !== 'none' && <p className="flex items-center gap-1.5"><Repeat className="h-3 w-3" /> Repeats {s.recurrence_pattern}{s.recurrence_end_date ? ` until ${fmtDate(s.recurrence_end_date)}` : ''}</p>}
                  {s.facilitator_name && <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> {s.facilitator_name}</p>}
                </div>
                <div className="flex items-center mt-3 pt-2 border-t border-border/50">
                  <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setEditing(s); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit</Button>
                </div>
              </CardContent></Card>
            ))}
          </div>
        )}

      <SessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        session={editing}
        onSaved={() => { setDialogOpen(false); invalidate(); }}
      />
    </div>
  );
}