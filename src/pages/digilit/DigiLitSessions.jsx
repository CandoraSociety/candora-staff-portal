import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, CalendarDays, Clock, MapPin, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import SessionDialog from '@/components/digilit/SessionDialog';
import { SESSION_STATUS_OPTIONS, TOPIC_AREA_OPTIONS, TOPIC_AREA_LABELS } from '@/lib/digilitConstants';
import { useToast } from '@/components/ui/use-toast';

export default function DigiLitSessions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sessions = [], isLoading } = useQuery({ queryKey: ['digilit-sessions'], queryFn: () => base44.entities.DigiLitSession.list('-session_date', 200) });

  const filtered = sessions.filter(s => {
    const matchSearch = (s.title || '').toLowerCase().includes(search.toLowerCase()) || (s.facilitator_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (s) => { setEditing(s); setDialogOpen(true); };
  const onSaved = () => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['digilit-sessions'] }); };

  const handleMarkCompleted = async (session) => {
    try {
      // Mark all registered as attended
      await base44.entities.DigiLitSession.update(session.id, { status: 'completed', attended_participant_ids: session.registered_participant_ids || [] });
      queryClient.invalidateQueries({ queryKey: ['digilit-sessions'] });
      toast({ title: 'Session marked as completed' });
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Sessions</h1><p className="text-muted-foreground text-sm mt-1">Schedule and manage Digital Literacy sessions</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> New Session</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by title or facilitator..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{SESSION_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{sessions.length === 0 ? 'No sessions scheduled yet.' : 'No sessions match your filters.'}</CardContent></Card> :
      (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(s => {
            const topic = TOPIC_AREA_OPTIONS.find(t => t.value === s.topic_area);
            const regCount = (s.registered_participant_ids || []).length;
            const attCount = (s.attended_participant_ids || []).length;
            return (
              <Card key={s.id} className="hover:shadow-md transition-shadow"><CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1"><span className="text-lg">{topic?.icon || '📋'}</span><div className="min-w-0"><p className="font-medium text-sm text-foreground truncate">{s.title}</p><p className="text-xs text-muted-foreground">{TOPIC_AREA_LABELS[s.topic_area]}</p></div></div>
                  <StatusBadge status={s.status} options={SESSION_STATUS_OPTIONS} />
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> {s.session_date ? new Date(s.session_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}{(s.start_time || s.end_time) && ` · ${s.start_time || ''}${s.end_time ? `–${s.end_time}` : ''}`}</p>
                  {s.location && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {s.location}</p>}
                  {s.facilitator_name && <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> {s.facilitator_name}</p>}
                  <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> {regCount} registered{s.status === 'completed' && ` · ${attCount} attended`}{s.max_participants && ` / ${s.max_participants} max`}</p>
                </div>
                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/50">
                  {s.status === 'scheduled' && <Button size="sm" variant="outline" onClick={() => handleMarkCompleted(s)}><CheckCircle className="h-4 w-4" /> Mark Completed</Button>}
                  <Button size="sm" variant="ghost" className="ml-auto" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}
      <SessionDialog open={dialogOpen} onOpenChange={setDialogOpen} session={editing} onSaved={onSaved} />
    </div>
  );
}