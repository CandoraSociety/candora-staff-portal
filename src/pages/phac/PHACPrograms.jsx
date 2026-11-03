import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, Clock, MapPin, FileText, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProgramFormDialog from '@/components/phac/ProgramFormDialog';
import ProgramDetailDialog from '@/components/phac/ProgramDetailDialog';
import SessionFormDialog from '@/components/phac/SessionFormDialog';
import StatusBadge from '@/components/phac/StatusBadge';
import ProgramDocumentsDialog from '@/components/programs/ProgramDocumentsDialog';
import {
  PROGRAM_STATUS_OPTIONS, WEEKDAY_LABELS, formatAgeRange,
  PHAC_PROGRAM_CATEGORY_OPTIONS, PHAC_PROGRAM_CATEGORY_LABELS,
} from '@/lib/phacConstants';

export default function PHACPrograms() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [docProgram, setDocProgram] = useState(null);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionProgramId, setSessionProgramId] = useState('');
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['phac-programs'],
    queryFn: () => base44.entities.PHACProgram.list('name', 200),
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ['phac-sessions'],
    queryFn: () => base44.entities.PHACSession.list('session_date', 500),
  });

  const filtered = programs.filter(p => {
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['phac-programs'] });
    queryClient.invalidateQueries({ queryKey: ['phac-sessions'] });
  };

  const handleEdit = (program) => { setDetail(null); setEditing(program); setDialogOpen(true); };
  const handleAdd = () => { setEditing(null); setDialogOpen(true); };
  const handleSaved = () => { setDialogOpen(false); setEditing(null); refresh(); };

  const sessionCount = (program) => sessions.filter(s =>
    s.program_id === program.id || (s.program_name || '').toLowerCase() === (program.name || '').toLowerCase()
  ).length;

  const saveDocuments = async (next) => {
    setDocProgram(current => (current ? { ...current, documents: next } : current));
    await base44.entities.PHACProgram.update(docProgram.id, { documents: next });
    queryClient.invalidateQueries({ queryKey: ['phac-programs'] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Programs</h1>
          <p className="text-muted-foreground text-sm mt-1">Drop-in programs for families with children 0–6 — open a card for its details and sessions</p>
        </div>
        <Button onClick={handleAdd}><Plus className="h-4 w-4" /> Add Program</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {PHAC_PROGRAM_CATEGORY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PROGRAM_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          {programs.length === 0 ? 'No programs yet. Click "Add Program" to get started.' : 'No programs match your filters.'}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => (
            <Card
              key={p.id}
              className="hover:shadow-md hover:border-primary/50 transition-shadow cursor-pointer"
              onClick={() => setDetail(p)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{PHAC_PROGRAM_CATEGORY_LABELS[p.category] || 'Drop-in program'}</p>
                  </div>
                  <StatusBadge status={p.status} options={PROGRAM_STATUS_OPTIONS} />
                </div>
                {p.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{p.description}</p>}
                <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 bg-muted rounded-full">{formatAgeRange(p.target_age_min_months, p.target_age_max_months)}</span>
                </div>
                {(p.schedule_days?.length > 0 || p.start_time || p.location) && (
                  <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                    {p.schedule_days?.length > 0 && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {p.schedule_days.map(d => WEEKDAY_LABELS[d]?.slice(0, 3)).join(', ')}
                        {p.start_time ? ` · ${p.start_time}${p.end_time ? `–${p.end_time}` : ''}` : ''}
                      </p>
                    )}
                    {p.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {p.location}</p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {sessionCount(p)} sessions</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 px-2 text-xs"
                    title="Program documents"
                    onClick={(e) => { e.stopPropagation(); setDocProgram(p); }}
                  >
                    <FileText className="h-3.5 w-3.5" /> {(p.documents || []).length}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-7"
                    onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProgramFormDialog open={dialogOpen} onOpenChange={setDialogOpen} program={editing} onSaved={handleSaved} />

      {detail && (
        <ProgramDetailDialog
          open={!!detail}
          onOpenChange={(v) => { if (!v) setDetail(null); }}
          program={detail}
          onChanged={refresh}
          onEdit={handleEdit}
          onAddSession={(program) => { setDetail(null); setSessionProgramId(program.id); setSessionOpen(true); }}
        />
      )}

      <SessionFormDialog
        open={sessionOpen}
        onOpenChange={setSessionOpen}
        presetProgramId={sessionProgramId}
        onSaved={() => { setSessionOpen(false); setSessionProgramId(''); refresh(); }}
      />

      {docProgram && (
        <ProgramDocumentsDialog
          open={!!docProgram}
          onOpenChange={(v) => { if (!v) setDocProgram(null); }}
          title={`${docProgram.name} — Documents`}
          subtitle="Handouts, curriculum and forms for this program"
          documents={docProgram.documents || []}
          onChange={saveDocuments}
        />
      )}
    </div>
  );
}