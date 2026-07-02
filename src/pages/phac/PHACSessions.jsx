import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SessionFormDialog from '@/components/phac/SessionFormDialog';
import StatusBadge from '@/components/phac/StatusBadge';
import { SESSION_STATUS_OPTIONS } from '@/lib/phacConstants';

export default function PHACSessions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['phac-sessions'],
    queryFn: () => base44.entities.PHACSession.list('-session_date', 200),
  });

  const filtered = sessions.filter(s => {
    const matchSearch = (s.program_name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (s.facilitator || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleEdit = (session) => { setEditing(session); setDialogOpen(true); };
  const handleAdd = () => { setEditing(null); setDialogOpen(true); };
  const handleSaved = () => { queryClient.invalidateQueries({ queryKey: ['phac-sessions'] }); setDialogOpen(false); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Sessions</h1>
          <p className="text-muted-foreground text-sm mt-1">Individual drop-in sessions and attendance tracking</p>
        </div>
        <Button onClick={handleAdd}><Plus className="h-4 w-4" /> Add Session</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by program or facilitator..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
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
        <div className="space-y-2">
          {filtered.map(s => (
            <Card key={s.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm text-foreground truncate">{s.program_name}</p>
                    <StatusBadge status={s.status} options={SESSION_STATUS_OPTIONS} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{new Date(s.session_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {s.start_time && <span>{s.start_time}{s.end_time ? `–${s.end_time}` : ''}</span>}
                    {s.location && <span>{s.location}</span>}
                    {s.facilitator && <span>Facilitator: {s.facilitator}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {s.status === 'completed' && (
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {s.attendee_count || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">attendees</p>
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(s)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SessionFormDialog open={dialogOpen} onOpenChange={setDialogOpen} session={editing} onSaved={handleSaved} />
    </div>
  );
}