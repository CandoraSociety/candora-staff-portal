import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Users, CalendarDays, Pencil } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/frn/StatusBadge';
import ProgramFormDialog from '@/components/frn/ProgramFormDialog';
import ProgramDetailDialog from '@/components/frn/ProgramDetailDialog';
import SessionDialog from '@/components/frn/SessionDialog';
import { FRN_PROGRAM_CATEGORY_LABELS, FRN_PROGRAM_CATEGORY_OPTIONS, FRN_PROGRAM_STATUS_OPTIONS, enrolledReferralsForProgram } from '@/lib/frnPrograms';

export default function FRNPrograms() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionProgram, setSessionProgram] = useState('');
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading } = useQuery({ queryKey: ['frn-programs'], queryFn: () => base44.entities.FRNProgram.list('name', 200) });
  const { data: referrals = [] } = useQuery({ queryKey: ['frn-referrals'], queryFn: () => base44.entities.FRNReferral.list('-referral_date', 500) });
  const { data: sessions = [] } = useQuery({ queryKey: ['frn-sessions'], queryFn: () => base44.entities.FRNSession.list('session_date', 500) });

  const filtered = programs.filter(p => {
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['frn-programs'] });
    queryClient.invalidateQueries({ queryKey: ['frn-referrals'] });
    queryClient.invalidateQueries({ queryKey: ['frn-sessions'] });
  };

  const sessionCount = (program) => sessions.filter(s => (s.program_name || '').toLowerCase() === program.name.toLowerCase()).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Programs</h1>
          <p className="text-muted-foreground text-sm mt-1">Every FRN targeted program — open a card for its details, enrolled participants and sessions</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> New Program</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {FRN_PROGRAM_CATEGORY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {FRN_PROGRAM_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          {programs.length === 0 ? 'No programs yet. Click "New Program" to add the first one.' : 'No programs match your filters.'}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => {
            const enrolled = enrolledReferralsForProgram(referrals, p).length;
            return (
              <Card
                key={p.id}
                className="hover:shadow-md hover:border-primary/50 transition-shadow cursor-pointer"
                onClick={() => setDetail(p)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{FRN_PROGRAM_CATEGORY_LABELS[p.category] || 'Program'}</p>
                    </div>
                    <StatusBadge status={p.status} options={FRN_PROGRAM_STATUS_OPTIONS} />
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{p.description}</p>}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {p.schedule_description && <p>{p.schedule_description}</p>}
                    {p.coordinator_name && <p>Coordinator: {p.coordinator_name}</p>}
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {enrolled} enrolled</span>
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {sessionCount(p)} sessions</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto h-7"
                      onClick={(e) => { e.stopPropagation(); setEditing(p); setFormOpen(true); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ProgramFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        program={editing}
        onSaved={() => { setFormOpen(false); setEditing(null); refresh(); }}
      />
      {detail && (
        <ProgramDetailDialog
          open={!!detail}
          onOpenChange={(v) => { if (!v) setDetail(null); }}
          program={detail}
          onChanged={refresh}
          onEdit={(program) => { setDetail(null); setEditing(program); setFormOpen(true); }}
          onAddSession={(program) => { setDetail(null); setSessionProgram(program.name); setSessionOpen(true); }}
        />
      )}
      <SessionDialog
        open={sessionOpen}
        onOpenChange={setSessionOpen}
        presetProgramName={sessionProgram}
        onSaved={() => { setSessionOpen(false); refresh(); }}
      />
    </div>
  );
}